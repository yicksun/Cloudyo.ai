import {
  AppError,
  contentSchema,
  contactSchema,
  partnerSchema,
  safeInternalPath,
  type Permission,
} from "@cloudyo/core";
import { z } from "zod";
import { db } from "./index";
import { atomic } from "./submissions";

const updateSchema = z.object({
  id: z.uuid(),
  version: z.number().int().positive(),
  status: z.string(),
  owner: z.string().trim().max(200).nullable(),
  note: z.string().trim().max(5000).optional(),
});
export async function updateBusiness(
  kind: "contact" | "partner",
  raw: unknown,
  actor: string,
) {
  const input = updateSchema.parse(raw);
  const valid =
    kind === "contact"
      ? ["New", "In Progress", "Closed"]
      : ["New", "In Review", "Approved", "Declined"];
  if (!valid.includes(input.status))
    throw new AppError("INVALID_STATUS", 400, "Invalid workflow status.");
  return atomic(async (tx) => {
    const where = { id: input.id, version: input.version };
    const data = {
      status: input.status,
      owner: input.owner,
      version: { increment: 1 },
    };
    const updated =
      kind === "contact"
        ? await tx.contactEnquiry.updateMany({ where, data })
        : await tx.partnerApplication.updateMany({ where, data });
    if (!updated.count)
      throw new AppError(
        "STALE_RECORD",
        409,
        "This record changed. Reload before saving.",
      );
    if (input.note)
      await tx.internalNote.create({
        data: {
          author: actor,
          body: input.note,
          ...(kind === "contact"
            ? { contactId: input.id }
            : { partnerId: input.id }),
        },
      });
    await tx.auditEvent.create({
      data: { actor, action: `${kind}.update`, target: input.id },
    });
  });
}
export async function privacyBusiness(raw: unknown, actor: string) {
  const input = z
    .object({
      kind: z.enum(["contact", "partner"]),
      id: z.uuid(),
      version: z.number().int().positive(),
      action: z.enum(["correct", "erase"]),
      acknowledge: z.literal(true),
      data: z.unknown().optional(),
    })
    .parse(raw);
  await atomic(async (tx) => {
    const where = { id: input.id, version: input.version };
    const record =
      input.kind === "contact"
        ? await tx.contactEnquiry.findFirst({ where })
        : await tx.partnerApplication.findFirst({ where });
    if (!record)
      throw new AppError(
        "STALE_RECORD",
        409,
        "The record changed. Reload before processing this request.",
      );
    if (input.action === "erase") {
      if (input.kind === "contact")
        await tx.contactEnquiry.delete({ where: { id: input.id } });
      else await tx.partnerApplication.delete({ where: { id: input.id } });
      await tx.emailOutbox.deleteMany({
        where: { reference: record.reference },
      });
    } else if (input.kind === "contact") {
      const data = contactSchema
        .omit({ startedAt: true, website: true })
        .strict()
        .parse(input.data);
      await tx.contactEnquiry.update({
        where: { id: input.id },
        data: { ...data, version: { increment: 1 } },
      });
    } else {
      const data = partnerSchema
        .omit({ startedAt: true, website: true })
        .strict()
        .parse(input.data);
      await tx.partnerApplication.update({
        where: { id: input.id },
        data: { ...data, version: { increment: 1 } },
      });
    }
    await tx.auditEvent.create({
      data: {
        actor,
        action: `${input.kind}.privacy-${input.action}`,
        target: input.id,
      },
    });
  });
}
const editSchema = contentSchema.extend({
  id: z.uuid().optional(),
  path: z.string(),
  version: z.number().int().nonnegative(),
});
export async function saveContent(raw: unknown, actor: string) {
  const input = editSchema.parse(raw);
  safeInternalPath(input.path);
  return atomic(async (tx) => {
    let page = input.id
      ? await tx.contentPage.findUnique({ where: { id: input.id } })
      : null;
    if (page && page.version !== input.version)
      throw new AppError(
        "STALE_RECORD",
        409,
        "This page changed. Reload before saving.",
      );
    const occupying = await tx.contentPage.findUnique({
      where: { path: input.path },
    });
    if (occupying && occupying.id !== page?.id)
      throw new AppError(
        "PATH_IN_USE",
        409,
        "This public URL belongs to another page.",
      );
    if (page?.publishedId && page.path !== input.path)
      throw new AppError(
        "UNPUBLISH_BEFORE_RENAME",
        409,
        "Unpublish the page before changing its public URL.",
      );
    if (!page) {
      if (input.id) throw new AppError("NOT_FOUND", 404, "Page not found.");
      page = await tx.contentPage.create({
        data: {
          path: input.path,
          kind: input.path.startsWith("/resources/") ? "resource" : "page",
        },
      });
    } else {
      if (page.path !== input.path) {
        const destinationRedirect = await tx.redirect.findUnique({
          where: { source: input.path },
        });
        if (destinationRedirect)
          throw new AppError(
            "INVALID_PATH",
            409,
            "This path is already a redirect.",
          );
        await tx.redirect.updateMany({
          where: { destination: page.path },
          data: { destination: input.path },
        });
        await tx.redirect.upsert({
          where: { source: page.path },
          create: { source: page.path, destination: input.path },
          update: { destination: input.path },
        });
      }
      page = await tx.contentPage.update({
        where: { id: page.id },
        data: { path: input.path, version: { increment: 1 } },
      });
    }
    const revision = await tx.contentRevision.create({
      data: {
        pageId: page.id,
        title: input.title,
        description: input.description,
        body: JSON.parse(JSON.stringify(input.body)),
        author: actor,
      },
    });
    await tx.auditEvent.create({
      data: { actor, action: "content.draft", target: page.id },
    });
    return { page, revision };
  });
}
export async function publishContent(raw: unknown, actor: string) {
  const input = z
    .object({
      id: z.uuid(),
      revisionId: z.uuid().nullable(),
      version: z.number().int().positive(),
    })
    .parse(raw);
  return atomic(async (tx) => {
    if (
      input.revisionId &&
      !(await tx.contentRevision.findFirst({
        where: { id: input.revisionId, pageId: input.id },
      }))
    )
      throw new AppError(
        "INVALID_REVISION",
        400,
        "Revision does not belong to this page.",
      );
    const result = await tx.contentPage.updateMany({
      where: { id: input.id, version: input.version },
      data: { publishedId: input.revisionId, version: { increment: 1 } },
    });
    if (!result.count)
      throw new AppError(
        "STALE_RECORD",
        409,
        "This page changed. Reload before publishing.",
      );
    await tx.auditEvent.create({
      data: {
        actor,
        action: input.revisionId ? "content.publish" : "content.unpublish",
        target: input.id,
      },
    });
  });
}
export const areaPermission: Record<string, Permission> = {
  contacts: "business",
  partners: "business",
  content: "content",
  media: "content",
  subscribers: "subscribers",
  settings: "settings",
  outbox: "retry",
  audit: "settings",
};
export async function listArea(area: string, search = "", cursor = 0) {
  const paging = {
    take: 50,
    skip: Math.min(cursor, 10000),
    orderBy: { createdAt: "desc" as const },
  };
  switch (area) {
    case "contacts":
      return db.contactEnquiry.findMany({
        ...paging,
        where: {
          OR: [
            { reference: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { topic: { contains: search, mode: "insensitive" } },
            { status: { equals: search } },
          ],
        },
        include: { notes: true },
      });
    case "partners":
      return db.partnerApplication.findMany({
        ...paging,
        where: {
          OR: [
            { orgName: { contains: search, mode: "insensitive" } },
            { status: { equals: search } },
          ],
        },
        include: { notes: true },
      });
    case "subscribers":
      return db.subscriber.findMany({
        ...paging,
        where: { email: { contains: search, mode: "insensitive" } },
        include: { consent: true },
      });
    case "content":
      return db.contentPage.findMany({
        ...paging,
        include: { revisions: { orderBy: { createdAt: "desc" } } },
      });
    case "media":
      return db.mediaAsset.findMany(paging);
    case "outbox":
      return db.emailOutbox.findMany({
        ...paging,
        select: {
          id: true,
          reference: true,
          template: true,
          state: true,
          attempts: true,
          lastError: true,
          createdAt: true,
        },
      });
    case "audit":
      return db.auditEvent.findMany(paging);
    case "settings":
      return db.applicationSetting.findMany({ take: 50 });
    default:
      throw new AppError("NOT_FOUND", 404, "Unknown administration area.");
  }
}
