import { randomUUID } from "node:crypto";
import { AppError, retryDelay } from "@cloudyo/core";
import { Prisma } from "@prisma/client";
import { db } from "./index";
import { atomic } from "./submissions";

export async function dispatchOutbox(enqueue: (id: string) => Promise<void>) {
  await db.emailOutbox.updateMany({
    where: { state: "Sending", leaseUntil: { lt: new Date() } },
    data: {
      state: "Unknown",
      lastError: "SEND_LEASE_EXPIRED",
      leaseUntil: null,
      leaseToken: null,
    },
  });
  const due = await db.emailOutbox.findMany({
    where: {
      state: { in: ["Pending", "Enqueued"] },
      nextAttempt: { lte: new Date() },
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
    },
    take: 50,
    orderBy: { createdAt: "asc" },
  });
  for (const item of due) {
    const lease = randomUUID();
    const claimed = await db.emailOutbox.updateMany({
      where: {
        id: item.id,
        state: { in: ["Pending", "Enqueued"] },
        OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
      },
      data: { leaseToken: lease, leaseUntil: new Date(Date.now() + 120000) },
    });
    if (!claimed.count) continue;
    try {
      await enqueue(item.id);
      await db.emailOutbox.updateMany({
        where: {
          id: item.id,
          leaseToken: lease,
          state: { in: ["Pending", "Enqueued"] },
        },
        data: {
          state: "Enqueued",
          leaseUntil: new Date(Date.now() + 300000),
          leaseToken: null,
          nextAttempt: new Date(Date.now() + 300000),
        },
      });
    } catch (error) {
      await db.emailOutbox.updateMany({
        where: { id: item.id, leaseToken: lease },
        data: {
          state: "Pending",
          leaseUntil: null,
          leaseToken: null,
          nextAttempt: new Date(Date.now() + 30000),
          lastError: "QUEUE_UNAVAILABLE",
        },
      });
      throw error;
    }
  }
}
export async function claimEmail(id: string) {
  const lease = randomUUID();
  const claimed = await db.emailOutbox.updateMany({
    where: {
      id,
      attempts: { lt: 5 },
      payload: { not: null },
      OR: [
        { state: "Pending", nextAttempt: { lte: new Date() } },
        { state: "Enqueued" },
      ],
    },
    data: {
      state: "Sending",
      attempts: { increment: 1 },
      leaseUntil: new Date(Date.now() + 300000),
      leaseToken: lease,
    },
  });
  return claimed.count
    ? db.emailOutbox.findUniqueOrThrow({ where: { id } })
    : null;
}
export async function emailFailure(
  id: string,
  lease: string,
  classification: "Transient" | "Permanent" | "Unknown",
) {
  const record = await db.emailOutbox.findUniqueOrThrow({ where: { id } });
  const retry = classification === "Transient" && record.attempts < 5;
  await db.emailOutbox.updateMany({
    where: { id, state: "Sending", leaseToken: lease },
    data: {
      state:
        classification === "Unknown" ? "Unknown" : retry ? "Pending" : "Failed",
      nextAttempt: new Date(Date.now() + retryDelay(record.attempts)),
      lastError: classification.toUpperCase(),
      leaseUntil: null,
      leaseToken: null,
    },
  });
}
export async function retryEmail(id: string, actor: string) {
  return atomic(async (tx) => {
    const record = await tx.emailOutbox.findUnique({ where: { id } });
    if (
      !record ||
      !["Failed", "Unknown"].includes(record.state) ||
      !record.payload
    )
      throw new AppError(
        "INVALID_RETRY",
        409,
        "Only retained failed or reviewed unknown messages can be retried.",
      );
    await tx.emailOutbox.update({
      where: { id },
      data: {
        state: "Pending",
        attempts: 0,
        nextAttempt: new Date(),
        operationId: null,
        messageId: null,
        leaseUntil: null,
        leaseToken: null,
        lastError: null,
      },
    });
    await tx.auditEvent.create({
      data: {
        actor,
        action: "email.retry-duplicate-risk-acknowledged",
        target: id,
      },
    });
  });
}
export async function recordDelivery(event: {
  id: string;
  messageId: string;
  status: "Delivered" | "Bounced";
  occurredAt: Date;
}) {
  try {
    await atomic(async (tx) => {
      await tx.emailDeliveryEvent.create({
        data: {
          id: event.id,
          messageId: event.messageId,
          status: event.status,
          createdAt: event.occurredAt,
        },
      });
      await tx.emailOutbox.updateMany({
        where: {
          messageId: event.messageId,
          state: { in: ["ProviderAccepted", "Unknown"] },
        },
        data: { state: event.status, payload: null },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (await db.emailDeliveryEvent.findUnique({ where: { id: event.id } }))
    )
      return;
    throw error;
  }
}

export async function recordAcceptance(
  id: string,
  lease: string,
  messageId: string,
) {
  await atomic(async (tx) => {
    const delivery = await tx.emailDeliveryEvent.findFirst({
      where: { messageId },
      orderBy: { createdAt: "asc" },
    });
    await tx.emailOutbox.updateMany({
      where: { id, leaseToken: lease, state: "Sending" },
      data: {
        state:
          delivery?.status === "Delivered"
            ? "Delivered"
            : delivery?.status === "Bounced"
              ? "Bounced"
              : "ProviderAccepted",
        messageId,
        operationId: messageId,
        payload: null,
        leaseToken: null,
        leaseUntil: null,
        lastError: null,
      },
    });
  });
}

export async function expireEmailPayloads(
  before = new Date(Date.now() - 86400000),
) {
  await atomic(async (tx) => {
    await tx.emailOutbox.updateMany({
      where: {
        createdAt: { lt: before },
        state: { in: ["Pending", "Enqueued"] },
      },
      data: {
        state: "Failed",
        lastError: "PAYLOAD_EXPIRED",
        leaseUntil: null,
        leaseToken: null,
      },
    });
    await tx.emailOutbox.updateMany({
      where: { createdAt: { lt: before }, state: { not: "Sending" } },
      data: { payload: null },
    });
  });
}
