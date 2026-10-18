import { app } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { QueueClient } from "@azure/storage-queue";
import { EmailClient } from "@azure/communication-email";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  db,
  decrypt,
  dispatchOutbox,
  claimEmail,
  emailFailure,
  recordDelivery,
  recordAcceptance,
  expireEmailPayloads,
  recordMediaScan,
} from "@cloudyo/data";
import { renderEmail } from "@cloudyo/email";

const credential = new DefaultAzureCredential();
function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for email processing.`);
  return value;
}
app.timer("dispatch", {
  schedule: "0 * * * * *",
  handler: async () => {
    const queue = new QueueClient(required("EMAIL_QUEUE_URL"), credential);
    await dispatchOutbox(async (id) => {
      await queue.sendMessage(
        Buffer.from(JSON.stringify({ id })).toString("base64"),
      );
    });
  },
});
app.storageQueue("sendEmail", {
  queueName: "cloudyo-email",
  connection: "EmailQueue",
  handler: async (message: unknown, context) => {
    const { id } = z.object({ id: z.uuid() }).parse(message);
    const item = await claimEmail(id);
    if (!item || !item.payload || !item.leaseToken) return;
    let providerCallStarted = false;
    try {
      const payload = decrypt(item.payload);
      if (process.env.EMAIL_MODE !== "azure")
        throw new Error(
          "Live sending is disabled. Configure EMAIL_MODE=azure only after approval.",
        );
      if (process.env.APP_ENV !== "production") {
        const allowlist = required("EMAIL_TEST_ALLOWLIST")
          .split(",")
          .map((s) => s.trim());
        if (!allowlist.includes(payload.to))
          throw new Error(
            "Recipient is not in the approved nonproduction allowlist.",
          );
      }
      const content = await renderEmail(item.template, payload);
      const client = new EmailClient(
        required("ACS_EMAIL_ENDPOINT"),
        credential,
      );
      const from = required("EMAIL_FROM");
      const operationId = randomUUID();
      await db.emailOutbox.updateMany({
        where: { id, leaseToken: item.leaseToken },
        data: { operationId },
      });
      providerCallStarted = true;
      const poller = await client.beginSend(
        {
          senderAddress: from,
          recipients: { to: [{ address: payload.to }] },
          replyTo: payload.replyTo ? [{ address: payload.replyTo }] : undefined,
          content,
        },
        { operationId },
      );
      const result = await poller.pollUntilDone();
      if (result.status !== "Succeeded") {
        await emailFailure(id, item.leaseToken, "Permanent");
        return;
      }
      await recordAcceptance(id, item.leaseToken, result.id);
    } catch {
      await emailFailure(
        id,
        item.leaseToken,
        providerCallStarted ? "Unknown" : "Permanent",
      );
      context.error(
        JSON.stringify({
          event: "email.send.failed",
          id,
          outcome: providerCallStarted ? "Unknown" : "Failed",
        }),
      );
    }
  },
});
app.eventGrid("emailDelivery", {
  handler: async (event) => {
    const expected = required("ACS_EVENT_SOURCE");
    if (
      event.topic !== expected ||
      event.eventType !== "Microsoft.Communication.EmailDeliveryReportReceived"
    )
      throw new Error("Unexpected email delivery event source or type.");
    const data = z
      .object({
        messageId: z.string(),
        status: z.string(),
      })
      .parse(event.data);
    if (
      data.status !== "Delivered" &&
      !["Bounced", "Failed", "Suppressed"].includes(data.status)
    )
      return;
    await recordDelivery({
      id: event.id,
      messageId: data.messageId,
      status: data.status === "Delivered" ? "Delivered" : "Bounced",
      occurredAt: new Date(event.eventTime),
    });
  },
});
app.eventGrid("mediaScan", {
  handler: async (event) => {
    if (
      event.topic !== required("MEDIA_EVENT_SOURCE") ||
      event.eventType !== "Microsoft.Security.MalwareScanningResult"
    )
      throw new Error("Unexpected media scan source or type.");
    const data = z
      .object({
        blobUri: z.url(),
        scanResultType: z.string(),
        scanResultDetails: z.object({
          sha256: z.string().regex(/^[a-fA-F0-9]{64}$/),
        }),
      })
      .parse(event.data);
    const url = new URL(data.blobUri);
    if (
      url.origin !== new URL(required("MEDIA_STORAGE_URL")).origin ||
      !url.pathname.startsWith("/media/quarantine/")
    )
      throw new Error("The scanned blob is outside the configured quarantine.");
    await recordMediaScan(
      decodeURIComponent(url.pathname.slice("/media/".length)),
      data.scanResultType === "No threats found",
      data.scanResultDetails.sha256.toLowerCase(),
    );
  },
});
app.storageQueue("poison", {
  queueName: "cloudyo-email-poison",
  connection: "EmailQueue",
  handler: async (message: unknown, context) => {
    const { id } = z.object({ id: z.uuid() }).parse(message);
    await db.emailOutbox.updateMany({
      where: { id, state: { in: ["Pending", "Enqueued"] } },
      data: { state: "Failed", lastError: "POISON_QUEUE" },
    });
    context.error(JSON.stringify({ event: "email.poison", id }));
  },
});
app.timer("maintenance", {
  schedule: "0 30 2 * * *",
  handler: async () => {
    const retention = z
      .object({
        enquiryDays: z.number().int().min(1),
        auditDays: z.number().int().min(1),
      })
      .parse(
        (
          await db.applicationSetting.findUnique({
            where: { key: "retention" },
          })
        )?.value,
      );
    const before = new Date(Date.now() - retention.enquiryDays * 86400000);
    await expireEmailPayloads();
    await db.$transaction([
      db.contactEnquiry.deleteMany({
        where: { createdAt: { lt: before }, status: "Closed" },
      }),
      db.partnerApplication.deleteMany({
        where: {
          createdAt: { lt: before },
          status: { in: ["Approved", "Declined"] },
        },
      }),
      db.abuseLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      db.subscriptionToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      }),
      db.auditEvent.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - retention.auditDays * 86400000),
          },
        },
      }),
    ]);
  },
});
