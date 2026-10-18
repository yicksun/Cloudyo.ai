import { z } from "zod";
import { AppError } from "@cloudyo/core";
import {
  db,
  areaPermission,
  listArea,
  updateBusiness,
  saveContent,
  publishContent,
  retryEmail,
  atomic,
  publishMedia,
} from "@cloudyo/data";
import { staff } from "@/lib/auth";
import { endpoint, readJson, sameOrigin } from "@/lib/api";

export async function GET(
  request: Request,
  context: { params: Promise<{ area: string }> },
) {
  const { area } = await context.params;
  const permission = areaPermission[area];
  return endpoint(async () => {
    if (!permission)
      throw new AppError("NOT_FOUND", 404, "Unknown administration area.");
    const user = await staff(permission);
    const url = new URL(request.url);
    const skip = z.coerce
      .number()
      .int()
      .min(0)
      .max(10000)
      .parse(url.searchParams.get("skip") ?? 0);
    const records = await listArea(
      area,
      (url.searchParams.get("q") ?? "").slice(0, 200),
      skip,
    );
    await db.auditEvent.create({
      data: { actor: user.id, action: `${area}.read`, target: area },
    });
    return { records };
  });
}
export async function POST(
  request: Request,
  context: { params: Promise<{ area: string }> },
) {
  return endpoint(async () => {
    sameOrigin(request);
    const { area } = await context.params;
    const permission = areaPermission[area];
    if (!permission)
      throw new AppError("NOT_FOUND", 404, "Unknown administration area.");
    const user = await staff(
      permission,
      ["settings", "subscribers", "outbox"].includes(area),
    );
    const raw = await readJson(request);
    switch (area) {
      case "media": {
        const { id, action } = z
          .object({ id: z.uuid(), action: z.literal("publish") })
          .parse(raw);
        await publishMedia(id, user.id);
        return {
          status: action === "publish" ? "published" : "saved",
          url: `/api/media/${id}`,
        };
      }
      case "contacts":
        await updateBusiness("contact", raw, user.id);
        break;
      case "partners":
        await updateBusiness("partner", raw, user.id);
        break;
      case "content": {
        const operation = z
          .object({ action: z.enum(["save", "publish"]), data: z.unknown() })
          .parse(raw);
        return operation.action === "save"
          ? await saveContent(operation.data, user.id)
          : await publishContent(operation.data, user.id).then(() => ({
              status: "published",
            }));
      }
      case "outbox": {
        const { id } = z
          .object({ id: z.uuid(), acknowledgeDuplicateRisk: z.literal(true) })
          .parse(raw);
        await retryEmail(id, user.id);
        break;
      }
      case "subscribers": {
        const input = z
          .object({
            id: z.uuid(),
            action: z.enum(["suppress", "erase"]),
            acknowledge: z.literal(true),
          })
          .parse(raw);
        await db.$transaction(async (tx) => {
          if (input.action === "suppress") {
            await tx.subscriber.update({
              where: { id: input.id },
              data: { state: "Suppressed", suppressedAt: new Date() },
            });
            await tx.subscriptionToken.updateMany({
              where: {
                subscriberId: input.id,
                purpose: "confirm",
                usedAt: null,
              },
              data: { usedAt: new Date(), pendingEmail: null },
            });
            await tx.consentEvent.create({
              data: {
                subscriberId: input.id,
                action: "StaffSuppressed",
                noticeVersion: "2026-10-19",
                source: "staff",
              },
            });
          } else {
            const subscriber = await tx.subscriber.findUniqueOrThrow({
              where: { id: input.id },
            });
            if (subscriber.state !== "Suppressed")
              throw new AppError(
                "SUPPRESSION_REQUIRED",
                409,
                "Suppress marketing before processing an erasure request.",
              );
            await tx.emailOutbox.deleteMany({ where: { reference: input.id } });
            await tx.subscriber.update({
              where: { id: input.id },
              data: { email: "erased", confirmedAt: null },
            });
            await tx.subscriptionToken.deleteMany({
              where: { subscriberId: input.id },
            });
          }
          await tx.auditEvent.create({
            data: {
              actor: user.id,
              action: `subscriber.${input.action}`,
              target: input.id,
            },
          });
        });
        break;
      }
      case "settings": {
        const input = z
          .object({
            key: z.enum(["recipients", "retention"]),
            value: z.unknown(),
            version: z.number().int().nonnegative(),
          })
          .parse(raw);
        const value =
          input.key === "recipients"
            ? z.record(z.string().max(100), z.email()).parse(input.value)
            : z
                .object({
                  enquiryDays: z.number().int().min(1),
                  auditDays: z.number().int().min(1),
                })
                .strict()
                .parse(input.value);
        await atomic(async (tx) => {
          const current = await tx.applicationSetting.findUnique({
            where: { key: input.key },
          });
          if ((current?.version ?? 0) !== input.version)
            throw new AppError(
              "STALE_RECORD",
              409,
              "Settings changed. Reload before saving.",
            );
          await tx.applicationSetting.upsert({
            where: { key: input.key },
            create: { key: input.key, value, updater: user.id },
            update: { value, updater: user.id, version: { increment: 1 } },
          });
          await tx.auditEvent.create({
            data: {
              actor: user.id,
              action: "settings.update",
              target: input.key,
            },
          });
        });
        break;
      }
      default:
        throw new AppError("INVALID_OPERATION", 400, "This area is read-only.");
    }
    return { status: "saved" };
  });
}
