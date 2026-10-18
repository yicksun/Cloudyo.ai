import { PrismaClient } from "@prisma/client";

const globalDatabase = globalThis as { cloudyoDatabase?: PrismaClient };
export const db =
  globalDatabase.cloudyoDatabase ??
  new PrismaClient({
    log: [],
  });
if (process.env.NODE_ENV !== "production") globalDatabase.cloudyoDatabase = db;
export { Prisma, type PrismaClient } from "@prisma/client";
export * from "./crypto";
export * from "./submissions";
export * from "./newsletter";
export * from "./admin";
export * from "./outbox";
export * from "./media";
