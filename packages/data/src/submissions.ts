import { randomUUID, createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import {
  AppError,
  contactSchema,
  partnerSchema,
  validateTiming,
} from "@cloudyo/core";
import { db } from "./index";
import { digest, encrypt } from "./crypto";

export type Transaction = Prisma.TransactionClient;
export async function atomic<T>(
  run: (tx: Transaction) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(run, {
        isolationLevel: "Serializable",
        timeout: 10000,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2034", "P2002"].includes(error.code) &&
        attempt < 3
      )
        continue;
      throw error;
    }
  }
  throw new Error("Transaction retry budget exhausted.");
}
export function siteUrl() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error("SITE_URL is required.");
  const url = new URL(value);
  const local =
    process.env.APP_ENV !== "production" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !local)
    throw new Error("Production SITE_URL must use HTTPS.");
  return url.origin;
}
export function abuseKey(value: string) {
  const secret = process.env.ABUSE_HASH_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("ABUSE_HASH_SECRET must contain at least 32 characters.");
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function rateLimit(
  tx: Transaction,
  key: string,
  max: number,
  seconds: number,
) {
  const window = Math.floor(Date.now() / (seconds * 1000));
  const expires = new Date((window + 1) * seconds * 1000);
  const rows = await tx.$queryRaw<{ count: number }[]>`
    INSERT INTO "AbuseLimit" ("key", "count", "expiresAt")
    VALUES (${`${key}:${window}`}, 1, ${expires})
    ON CONFLICT ("key") DO UPDATE SET "count" = "AbuseLimit"."count" + 1
    RETURNING "count"`;
  if (rows[0].count > max)
    throw new AppError(
      "RATE_LIMITED",
      429,
      "Too many attempts. Please try again later.",
    );
}
export async function acceptSubmission(
  kind: "contact" | "partner",
  raw: unknown,
  idempotencyKey: string | null,
  client: string,
) {
  const input =
    kind === "contact" ? contactSchema.parse(raw) : partnerSchema.parse(raw);
  if (!idempotencyKey || !/^[a-zA-Z0-9_-]{16,100}$/.test(idempotencyKey))
    throw new AppError(
      "IDEMPOTENCY_REQUIRED",
      400,
      "A valid submission key is required.",
    );
  const keyHash = digest(idempotencyKey);
  const fingerprint = digest(JSON.stringify(input));
  const recipientSetting = await db.applicationSetting.findUnique({
    where: { key: "recipients" },
  });
  const settings = recipientSetting?.value;
  const configured =
    typeof settings === "object" &&
    settings !== null &&
    !Array.isArray(settings)
      ? settings
      : {};
  const routingKey = "topic" in input ? input.topic : "partnerships";
  const route = configured[routingKey];
  const recipient =
    typeof route === "string" ? route : process.env.INTERNAL_EMAIL;
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))
    throw new AppError(
      "NOT_CONFIGURED",
      503,
      "Enquiries are temporarily unavailable. Please contact us directly.",
    );
  return atomic(async (tx) => {
    const previous = await tx.idempotencyRecord.findUnique({
      where: { scope_keyHash: { scope: kind, keyHash } },
    });
    if (previous) {
      if (
        previous.fingerprint !== fingerprint ||
        previous.expiresAt.getTime() < Date.now()
      )
        throw new AppError(
          "IDEMPOTENCY_CONFLICT",
          409,
          "This submission key has expired or was used for different details.",
        );
      return previous.reference;
    }
    validateTiming(input.startedAt);
    await rateLimit(tx, abuseKey(`${kind}:${client}`), 5, 600);
    const reference = `CLY-${randomUUID().slice(0, 8).toUpperCase()}`;
    const address = "email" in input ? input.email : input.workEmail;
    const person =
      "firstName" in input
        ? `${input.firstName} ${input.lastName}`
        : input.contactName;
    const body = "message" in input ? input.message : input.valueProposition;
    if (kind === "contact" && "firstName" in input) {
      const { startedAt: _time, website: _trap, ...fields } = input;
      await tx.contactEnquiry.create({ data: { ...fields, reference } });
    } else if ("orgName" in input) {
      const { startedAt: _time, website: _trap, ...fields } = input;
      await tx.partnerApplication.create({ data: { ...fields, reference } });
    }
    await tx.emailOutbox.createMany({
      data: [
        {
          reference,
          template: `${kind}-internal`,
          payload: encrypt({
            to: recipient,
            replyTo: address,
            name: person,
            reference,
            message: `${routingKey}\n\n${body}`,
          }),
        },
        {
          reference,
          template: `${kind}-ack`,
          payload: encrypt({ to: address, name: person, reference }),
        },
      ],
    });
    await tx.idempotencyRecord.create({
      data: {
        scope: kind,
        keyHash,
        fingerprint,
        reference,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    return reference;
  });
}
