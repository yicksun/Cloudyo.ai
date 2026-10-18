import {
  AppError,
  normalizeEmail,
  subscribeSchema,
  validateTiming,
} from "@cloudyo/core";
import { atomic, rateLimit, abuseKey, siteUrl } from "./submissions";
import { digest, encrypt, decrypt, token } from "./crypto";

export async function subscribe(raw: unknown, client: string) {
  const input = subscribeSchema.parse(raw);
  validateTiming(input.startedAt);
  const lookupKey = abuseKey(normalizeEmail(input.email));
  const origin = siteUrl();
  return atomic(async (tx) => {
    await rateLimit(tx, abuseKey(`subscribe-client:${client}`), 10, 600);
    const limited = await tx.abuseLimit.findUnique({
      where: {
        key: `subscribe-email:${abuseKey(lookupKey)}:${Math.floor(Date.now() / 3600000)}`,
      },
    });
    if (limited && limited.count >= 3) return;
    await rateLimit(tx, `subscribe-email:${abuseKey(lookupKey)}`, 3, 3600);
    const subscriber = await tx.subscriber.upsert({
      where: { lookupKey },
      create: { email: input.email, lookupKey },
      update: {},
    });
    if (subscriber.state === "Confirmed") return;
    const rawToken = token();
    await tx.subscriptionToken.updateMany({
      where: { subscriberId: subscriber.id, purpose: "confirm", usedAt: null },
      data: { usedAt: new Date(), pendingEmail: null },
    });
    await tx.subscriptionToken.create({
      data: {
        subscriberId: subscriber.id,
        purpose: "confirm",
        hash: digest(rawToken),
        pendingEmail: encrypt({
          to: input.email,
          name: "Cloudyo reader",
          reference: subscriber.id,
        }),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    await tx.consentEvent.create({
      data: {
        subscriberId: subscriber.id,
        action: "Requested",
        noticeVersion: "2026-10-19",
        source: "website-footer",
      },
    });
    await tx.emailOutbox.create({
      data: {
        reference: subscriber.id,
        template: "newsletter-confirm",
        payload: encrypt({
          to: input.email,
          name: "Cloudyo reader",
          reference: subscriber.id,
          url: `${origin}/newsletter/confirm?token=${rawToken}`,
        }),
      },
    });
  });
}
export async function transitionSubscription(
  rawToken: string,
  purpose: "confirm" | "unsubscribe",
) {
  if (!/^[a-zA-Z0-9_-]{40,100}$/.test(rawToken))
    throw new AppError(
      "INVALID_TOKEN",
      400,
      "This link is invalid or has expired.",
    );
  return atomic(async (tx) => {
    const record = await tx.subscriptionToken.findUnique({
      where: { hash: digest(rawToken) },
    });
    if (
      !record ||
      record.purpose !== purpose ||
      record.expiresAt.getTime() < Date.now()
    )
      throw new AppError(
        "INVALID_TOKEN",
        400,
        "This link is invalid or has expired.",
      );
    if (record.usedAt) {
      if (purpose === "unsubscribe") return;
      throw new AppError(
        "INVALID_TOKEN",
        400,
        "This link has already been used.",
      );
    }
    const now = new Date();
    if (purpose === "unsubscribe")
      await tx.subscriptionToken.updateMany({
        where: {
          subscriberId: record.subscriberId,
          purpose: "confirm",
          usedAt: null,
        },
        data: { usedAt: now, pendingEmail: null },
      });
    const email = record.pendingEmail
      ? decrypt(record.pendingEmail).to
      : undefined;
    await tx.subscriptionToken.update({
      where: { id: record.id },
      data: { usedAt: now, pendingEmail: null },
    });
    await tx.subscriber.update({
      where: { id: record.subscriberId },
      data:
        purpose === "confirm"
          ? { state: "Confirmed", email, confirmedAt: now, suppressedAt: null }
          : { state: "Suppressed", suppressedAt: now },
    });
    await tx.consentEvent.create({
      data: {
        subscriberId: record.subscriberId,
        action: purpose === "confirm" ? "Confirmed" : "Unsubscribed",
        noticeVersion: "2026-10-19",
        source: "token-action",
      },
    });
  });
}
