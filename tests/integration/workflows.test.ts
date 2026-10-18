import { beforeEach, afterAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  db,
  acceptSubmission,
  subscribe,
  transitionSubscription,
  decrypt,
  digest,
  token,
  claimEmail,
  dispatchOutbox,
  emailFailure,
  retryEmail,
  recordDelivery,
  recordAcceptance,
  expireEmailPayloads,
  saveContent,
  publishContent,
  updateBusiness,
  recordMediaScan,
  publishMedia,
  privacyBusiness,
} from "@cloudyo/data";

const contact = () => ({
  firstName: "Test",
  lastName: "Visitor",
  company: "Synthetic",
  email: "visitor@cloudyo.example",
  topic: "General Inquiry",
  message: "Synthetic integration test",
  startedAt: Date.now() - 2500,
});
async function clear() {
  await db.contentPage.updateMany({ data: { publishedId: null } });
  await db.$transaction([
    db.internalNote.deleteMany(),
    db.contactEnquiry.deleteMany(),
    db.partnerApplication.deleteMany(),
    db.consentEvent.deleteMany(),
    db.subscriptionToken.deleteMany(),
    db.subscriber.deleteMany(),
    db.contentRevision.deleteMany(),
    db.contentPage.deleteMany(),
    db.redirect.deleteMany(),
    db.emailOutbox.deleteMany(),
    db.emailDeliveryEvent.deleteMany(),
    db.idempotencyRecord.deleteMany(),
    db.abuseLimit.deleteMany(),
    db.auditEvent.deleteMany(),
    db.applicationSetting.deleteMany(),
    db.mediaAsset.deleteMany(),
  ]);
}
beforeEach(clear);
afterAll(async () => {
  await clear();
  await db.$disconnect();
});

describe("durable acceptance", () => {
  it("atomically records one enquiry and two protected messages", async () => {
    const ref = await acceptSubmission(
      "contact",
      contact(),
      randomUUID(),
      "integration",
    );
    expect(await db.contactEnquiry.count({ where: { reference: ref } })).toBe(
      1,
    );
    const messages = await db.emailOutbox.findMany({
      where: { reference: ref },
    });
    expect(messages).toHaveLength(2);
    expect(messages[0].payload).not.toContain("visitor@cloudyo.example");
  });
  it("replays an accepted request without duplicate records", async () => {
    const input = contact(),
      key = randomUUID();
    const results = await Promise.all([
      acceptSubmission("contact", input, key, "duplicate"),
      acceptSubmission("contact", input, key, "duplicate"),
    ]);
    expect(results[0]).toBe(results[1]);
    expect(await db.contactEnquiry.count()).toBe(1);
  });
  it("rejects changing input under the same key", async () => {
    const input = contact(),
      key = randomUUID();
    await acceptSubmission("contact", input, key, "conflict");
    await expect(
      acceptSubmission(
        "contact",
        { ...input, message: "Changed" },
        key,
        "conflict",
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
  it("does not persist half an enquiry if encryption fails", async () => {
    const key = process.env.OUTBOX_ENCRYPTION_KEY;
    delete process.env.OUTBOX_ENCRYPTION_KEY;
    try {
      await expect(
        acceptSubmission("contact", contact(), randomUUID(), "rollback"),
      ).rejects.toThrow();
    } finally {
      process.env.OUTBOX_ENCRYPTION_KEY = key;
    }
    expect(await db.contactEnquiry.count()).toBe(0);
  });
  it("enforces the shared rate limit", async () => {
    for (let i = 0; i < 5; i++)
      await acceptSubmission("contact", contact(), randomUUID(), "limited");
    await expect(
      acceptSubmission("contact", contact(), randomUUID(), "limited"),
    ).rejects.toMatchObject({ status: 429 });
    expect(await db.contactEnquiry.count()).toBe(5);
  });
  it("persists partnership applications with the correct workflow", async () => {
    await acceptSubmission(
      "partner",
      {
        orgName: "Synthetic partner",
        contactName: "Test Partner",
        workEmail: "partner@cloudyo.example",
        partnerType: "Technology / ISV",
        valueProposition: "Integration test",
        startedAt: Date.now() - 2500,
      },
      randomUUID(),
      "partner",
    );
    expect((await db.partnerApplication.findFirstOrThrow()).status).toBe("New");
  });
});
describe("consent lifecycle", () => {
  async function requestConfirmation() {
    await subscribe(
      {
        email: "Reader+News@CLOUDYO.EXAMPLE",
        consent: true,
        startedAt: Date.now() - 2500,
      },
      "subscriber",
    );
    const mail = await db.emailOutbox.findFirstOrThrow({
      where: { template: "newsletter-confirm" },
      orderBy: { createdAt: "desc" },
    });
    const payload = decrypt(mail.payload!);
    return new URL(payload.url!).searchParams.get("token")!;
  }
  it("records pending consent and consumes the confirmation token only once", async () => {
    const value = await requestConfirmation();
    expect((await db.subscriber.findFirstOrThrow()).state).toBe("Pending");
    expect((await db.subscriptionToken.findFirstOrThrow()).hash).toBe(
      digest(value),
    );
    await transitionSubscription(value, "confirm");
    expect((await db.subscriber.findFirstOrThrow()).state).toBe("Confirmed");
    await expect(
      transitionSubscription(value, "confirm"),
    ).rejects.toMatchObject({ status: 400 });
  });
  it("does not reveal existing membership or resend to confirmed subscribers", async () => {
    const value = await requestConfirmation();
    await transitionSubscription(value, "confirm");
    await subscribe(
      {
        email: "Reader+News@cloudyo.example",
        consent: true,
        startedAt: Date.now() - 2500,
      },
      "subscriber",
    );
    expect(await db.emailOutbox.count()).toBe(1);
  });
  it("unsubscribes idempotently and requires fresh confirmation to resubscribe", async () => {
    const value = await requestConfirmation();
    await transitionSubscription(value, "confirm");
    const subscriber = await db.subscriber.findFirstOrThrow(),
      unsubscribeToken = token();
    await db.subscriptionToken.create({
      data: {
        subscriberId: subscriber.id,
        purpose: "unsubscribe",
        hash: digest(unsubscribeToken),
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    await transitionSubscription(unsubscribeToken, "unsubscribe");
    await transitionSubscription(unsubscribeToken, "unsubscribe");
    await requestConfirmation();
    expect((await db.subscriber.findFirstOrThrow()).state).toBe("Suppressed");
  });
  it("restores an erased identity only after a new confirmation", async () => {
    const original = await requestConfirmation();
    const subscriber = await db.subscriber.findFirstOrThrow();
    await db.subscriber.update({
      where: { id: subscriber.id },
      data: { email: "erased", state: "Suppressed" },
    });
    const fresh = await requestConfirmation();
    expect((await db.subscriber.findFirstOrThrow()).email).toBe("erased");
    await expect(
      transitionSubscription(original, "confirm"),
    ).rejects.toMatchObject({ status: 400 });
    await transitionSubscription(fresh, "confirm");
    expect((await db.subscriber.findFirstOrThrow()).email).toBe(
      "Reader+News@CLOUDYO.EXAMPLE",
    );
    expect(
      await db.subscriptionToken.count({
        where: { pendingEmail: { not: null } },
      }),
    ).toBe(0);
  });
});
describe("staff concurrency and content", () => {
  it("rejects stale enquiry updates and audits a valid update", async () => {
    await acceptSubmission("contact", contact(), randomUUID(), "staff");
    const enquiry = await db.contactEnquiry.findFirstOrThrow();
    await updateBusiness(
      "contact",
      {
        id: enquiry.id,
        version: 1,
        status: "In Progress",
        owner: "staff-id",
        note: "Following up",
      },
      "staff-id",
    );
    await expect(
      updateBusiness(
        "contact",
        { id: enquiry.id, version: 1, status: "Closed", owner: null },
        "staff-id",
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(await db.internalNote.count()).toBe(1);
  });
  it("keeps drafts private until a saved revision is published", async () => {
    const saved = await saveContent(
      {
        path: "/resources/integration",
        title: "Integration",
        description: "Synthetic content",
        version: 0,
        body: {
          type: "doc",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Draft" }] },
          ],
        },
      },
      "editor",
    );
    expect(saved.page.publishedId).toBeNull();
    await publishContent(
      { id: saved.page.id, version: 1, revisionId: saved.revision.id },
      "editor",
    );
    expect(
      (await db.contentPage.findUniqueOrThrow({ where: { id: saved.page.id } }))
        .publishedId,
    ).toBe(saved.revision.id);
  });
});
describe("privacy actions", () => {
  it("corrects and erases only the current record version with an audit trail", async () => {
    await acceptSubmission("contact", contact(), randomUUID(), "privacy");
    const row = await db.contactEnquiry.findFirstOrThrow();
    const data = Object.fromEntries(
      Object.entries(contact()).filter(([key]) => key !== "startedAt"),
    );
    await privacyBusiness(
      {
        kind: "contact",
        id: row.id,
        version: 1,
        action: "correct",
        acknowledge: true,
        data: { ...data, email: "corrected@cloudyo.example" },
      },
      "administrator",
    );
    await expect(
      privacyBusiness(
        {
          kind: "contact",
          id: row.id,
          version: 1,
          action: "erase",
          acknowledge: true,
        },
        "administrator",
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(
      (await db.contactEnquiry.findUniqueOrThrow({ where: { id: row.id } }))
        .email,
    ).toBe("corrected@cloudyo.example");
    await privacyBusiness(
      {
        kind: "contact",
        id: row.id,
        version: 2,
        action: "erase",
        acknowledge: true,
      },
      "administrator",
    );
    expect(await db.contactEnquiry.count()).toBe(0);
    expect(
      await db.emailOutbox.count({ where: { reference: row.reference } }),
    ).toBe(0);
    expect(
      await db.auditEvent.count({ where: { action: "contact.privacy-erase" } }),
    ).toBe(1);
  });
});
describe("outbox resilience", () => {
  async function message() {
    await acceptSubmission("contact", contact(), randomUUID(), "worker");
    return db.emailOutbox.findFirstOrThrow();
  }
  it("claims a message once even under concurrent delivery", async () => {
    const row = await message();
    const claims = await Promise.all([claimEmail(row.id), claimEmail(row.id)]);
    expect(claims.filter(Boolean)).toHaveLength(1);
  });
  it("retains the enquiry if queue enqueue fails", async () => {
    await message();
    await expect(
      dispatchOutbox(async () => {
        throw new Error("Queue outage");
      }),
    ).rejects.toThrow("Queue outage");
    expect(await db.contactEnquiry.count()).toBe(1);
    expect(await db.emailOutbox.count({ where: { state: "Pending" } })).toBe(2);
  });
  it("marks ambiguous send results unknown and audits reviewed retry", async () => {
    const row = await message(),
      claimed = await claimEmail(row.id);
    await emailFailure(row.id, claimed!.leaseToken!, "Unknown");
    expect(
      (await db.emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).state,
    ).toBe("Unknown");
    await retryEmail(row.id, "admin");
    expect(
      await db.auditEvent.count({
        where: { action: "email.retry-duplicate-risk-acknowledged" },
      }),
    ).toBe(1);
  });
  it("deduplicates delivery events without regressing a terminal state", async () => {
    const row = await message();
    await db.emailOutbox.update({
      where: { id: row.id },
      data: { messageId: "provider-test", state: "ProviderAccepted" },
    });
    const event = {
      id: "event-1",
      messageId: "provider-test",
      status: "Delivered" as const,
      occurredAt: new Date(),
    };
    await recordDelivery(event);
    await recordDelivery(event);
    await recordDelivery({ ...event, id: "event-2", status: "Bounced" });
    expect(await db.emailDeliveryEvent.count()).toBe(2);
    expect(
      (await db.emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).state,
    ).toBe("Delivered");
  });
  it("does not claim a scheduled retry early", async () => {
    const row = await message();
    await db.emailOutbox.update({
      where: { id: row.id },
      data: { nextAttempt: new Date(Date.now() + 60000) },
    });
    expect(await claimEmail(row.id)).toBeNull();
  });
  it("reconciles a delivery report that precedes the provider response", async () => {
    const row = await message(),
      claimed = await claimEmail(row.id);
    await recordDelivery({
      id: "early-report",
      messageId: "early-provider",
      status: "Delivered",
      occurredAt: new Date(),
    });
    await recordAcceptance(row.id, claimed!.leaseToken!, "early-provider");
    expect(
      (await db.emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).state,
    ).toBe("Delivered");
  });
  it("expires unsent payloads explicitly instead of leaving stranded pending jobs", async () => {
    const row = await message();
    await db.emailOutbox.update({
      where: { id: row.id },
      data: { createdAt: new Date(Date.now() - 2 * 86400000) },
    });
    await expireEmailPayloads();
    expect(
      await db.emailOutbox.findUniqueOrThrow({ where: { id: row.id } }),
    ).toMatchObject({
      state: "Failed",
      lastError: "PAYLOAD_EXPIRED",
      payload: null,
    });
    expect(await claimEmail(row.id)).toBeNull();
  });
});

describe("media publishing", () => {
  it("requires a matching trusted scan and explicit staff publication", async () => {
    const asset = await db.mediaAsset.create({
      data: {
        blobKey: "quarantine/test",
        name: "test.png",
        mediaType: "image/png",
        size: 8,
        checksum: "a".repeat(64),
        alt: "Synthetic image",
        uploader: "editor",
      },
    });
    await expect(publishMedia(asset.id, "editor")).rejects.toMatchObject({
      status: 409,
    });
    await expect(
      recordMediaScan(asset.blobKey, true, "b".repeat(64)),
    ).rejects.toMatchObject({ status: 409 });
    await recordMediaScan(asset.blobKey, true, asset.checksum);
    expect(
      (await db.mediaAsset.findUniqueOrThrow({ where: { id: asset.id } }))
        .status,
    ).toBe("Clean");
    await publishMedia(asset.id, "editor");
    expect(
      (await db.mediaAsset.findUniqueOrThrow({ where: { id: asset.id } }))
        .status,
    ).toBe("Published");
  });
});
