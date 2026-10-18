import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";

const database = process.env.E2E_DATABASE_URL;
if (!database || !/_test$/.test(new URL(database).pathname))
  throw new Error(
    "E2E_DATABASE_URL must identify an isolated database ending in _test.",
  );
process.env.DATABASE_URL = database;
process.env.OUTBOX_ENCRYPTION_KEY ??= randomBytes(32).toString("hex");
process.env.ABUSE_HASH_SECRET ??= randomBytes(32).toString("hex");
process.env.NEXTAUTH_SECRET ??= randomBytes(32).toString("hex");
const origin = "http://127.0.0.1:3000";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: origin,
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  snapshotPathTemplate: "{testDir}/reference/{arg}{ext}",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: "disabled",
    },
  },
  webServer: {
    command: "npm run start --workspace @cloudyo/web",
    url: origin + "/health/ready",
    reuseExistingServer: Boolean(process.env.E2E_REUSE_SERVER),
    timeout: 120000,
    env: {
      DATABASE_URL: database,
      PUBLIC_CONTENT_MODE: "database",
      SITE_URL: origin,
      NEXTAUTH_URL: origin,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      ENTRA_TENANT_ID: "00000000-0000-4000-8000-000000000001",
      ENTRA_CLIENT_ID: "00000000-0000-4000-8000-000000000002",
      ENTRA_CLIENT_SECRET: "synthetic-test-only-never-an-actual-credential",
      OUTBOX_ENCRYPTION_KEY: process.env.OUTBOX_ENCRYPTION_KEY,
      ABUSE_HASH_SECRET: process.env.ABUSE_HASH_SECRET,
      INTERNAL_EMAIL: "internal@cloudyo.example",
      EMAIL_MODE: "disabled",
    },
  },
});
