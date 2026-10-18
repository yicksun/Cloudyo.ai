import { beforeEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import {
  encrypt,
  decrypt,
  digest,
  token,
} from "../../packages/data/src/crypto";
import { renderEmail } from "@cloudyo/email";

beforeEach(() => {
  process.env.OUTBOX_ENCRYPTION_KEY = randomBytes(32).toString("hex");
});
describe("email payload protection", () => {
  it("encrypts personal data and recovers the typed payload", () => {
    const data = {
      to: "reader@example.com",
      name: "Reader",
      reference: "CLY-TEST",
    };
    const encrypted = encrypt(data);
    expect(encrypted).not.toContain(data.to);
    expect(decrypt(encrypted)).toEqual(data);
  });
  it("detects tampering and rejects missing keys", () => {
    const encrypted = encrypt({
      to: "reader@example.com",
      name: "Reader",
      reference: "TEST",
    });
    expect(() => decrypt(encrypted.slice(0, -4) + "AAAA")).toThrow();
    delete process.env.OUTBOX_ENCRYPTION_KEY;
    expect(() =>
      encrypt({ to: "reader@example.com", name: "", reference: "" }),
    ).toThrow();
  });
  it("creates unpredictable tokens and stores deterministic hashes", () => {
    const a = token();
    expect(a).not.toBe(token());
    expect(digest(a)).toHaveLength(64);
    expect(digest(a)).not.toContain(a);
  });
});
describe("branded templates", () => {
  it("escapes user HTML and provides plain text", async () => {
    const result = await renderEmail("contact-internal", {
      name: "<script>bad</script>",
      reference: "CLY-TEST",
      message: "<img src=x onerror=bad>",
    });
    expect(result.html).not.toContain("<script>bad");
    expect(result.html).toContain("&lt;script&gt;");
    expect(result.plainText).toContain("CLY-TEST");
  });
  it("includes confirmation action and expiry", async () => {
    const result = await renderEmail("newsletter-confirm", {
      name: "Reader",
      reference: "TEST",
      url: "https://cloudyo.ai/newsletter/confirm?token=test",
    });
    expect(result.html).toContain("Confirm subscription");
    expect(result.plainText).toContain("24 hours");
  });
});
