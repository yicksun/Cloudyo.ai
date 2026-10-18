import { randomBytes } from "node:crypto";

const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test"))
  throw new Error(
    "TEST_DATABASE_URL must identify an isolated database ending in _test.",
  );
process.env.DATABASE_URL = url;
process.env.OUTBOX_ENCRYPTION_KEY = randomBytes(32).toString("hex");
process.env.ABUSE_HASH_SECRET = randomBytes(32).toString("hex");
process.env.INTERNAL_EMAIL = "internal@cloudyo.example";
process.env.SITE_URL = "http://127.0.0.1:3000";
