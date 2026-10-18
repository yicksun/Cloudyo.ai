import { describe, expect, it } from "vitest";
import {
  contactSchema,
  partnerSchema,
  subscribeSchema,
  normalizeEmail,
  permitted,
  requirePermission,
  csvCell,
  validateTiming,
  retryDelay,
  documentSchema,
  safeInternalPath,
} from "@cloudyo/core";

const contact = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  company: "",
  topic: "General Inquiry",
  message: "Please help.",
  startedAt: Date.now() - 2000,
};
describe("public request contracts", () => {
  it("accepts personal addresses and optional company", () => {
    expect(contactSchema.parse(contact).email).toBe("jane@example.com");
  });
  it("rejects malformed email, unknown topics and oversized messages", () => {
    for (const change of [
      { email: "broken" },
      { topic: "unknown" },
      { message: "x".repeat(5001) },
    ])
      expect(contactSchema.safeParse({ ...contact, ...change }).success).toBe(
        false,
      );
  });
  it("requires all partnership business fields", () => {
    expect(
      partnerSchema.safeParse({
        ...contact,
        orgName: "",
        contactName: "Jane",
        workEmail: "jane@example.com",
        partnerType: "Technology / ISV",
        valueProposition: "Work with us",
      }).success,
    ).toBe(false);
  });
  it("requires explicit newsletter consent", () => {
    expect(
      subscribeSchema.safeParse({
        email: contact.email,
        startedAt: Date.now(),
        consent: false,
      }).success,
    ).toBe(false);
  });
  it("rejects honeypot content", () => {
    expect(
      contactSchema.safeParse({ ...contact, website: "spam" }).success,
    ).toBe(false);
  });
  it("normalizes only surrounding space and the email domain", () => {
    expect(normalizeEmail(" Jane.Doe+News@EXAMPLE.COM ")).toBe(
      "Jane.Doe+News@example.com",
    );
  });
  it("rejects instant and expired forms", () => {
    expect(() => validateTiming(Date.now())).toThrow();
    expect(() => validateTiming(Date.now() - 86400001)).toThrow();
    expect(() => validateTiming(Date.now() - 2000)).not.toThrow();
  });
});
describe("authorization and safe content", () => {
  it("denies role-free access", () => {
    expect(permitted([], "business")).toBe(false);
  });
  it("separates editors and sales", () => {
    expect(permitted(["Editor"], "content")).toBe(true);
    expect(permitted(["Editor"], "business")).toBe(false);
    expect(permitted(["Sales"], "content")).toBe(false);
    expect(permitted(["Sales"], "export")).toBe(false);
    expect(() => requirePermission(["Sales"], "settings")).toThrow();
  });
  it("permits administrator privileges", () => {
    expect(permitted(["Administrator"], "retry")).toBe(true);
  });
  it("escapes spreadsheet formulas and quotes", () => {
    expect(csvCell('=HYPERLINK("bad")')).toBe('"\'=HYPERLINK(""bad"")"');
    expect(csvCell("Plain")).toBe('"Plain"');
  });
  it("rejects script nodes, unsafe marks, and arbitrary attrs", () => {
    expect(documentSchema.safeParse({ type: "script" }).success).toBe(false);
    expect(
      documentSchema.safeParse({
        type: "text",
        text: "x",
        marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
      }).success,
    ).toBe(false);
    expect(
      documentSchema.safeParse({
        type: "heading",
        attrs: { level: 2, onclick: "bad" },
      }).success,
    ).toBe(false);
  });
  it("rejects external, administrative and malformed content paths", () => {
    for (const path of [
      "//evil.example",
      "/admin/test",
      "/api/test",
      "/a/../b",
      "/a?x=y",
    ])
      expect(() => safeInternalPath(path)).toThrow();
    expect(safeInternalPath("/resources/cloud-finops")).toBe(
      "/resources/cloud-finops",
    );
  });
  it("bounds exponential retry delays", () => {
    expect(retryDelay(1, () => 0)).toBe(30000);
    expect(retryDelay(30, () => 0)).toBe(1800000);
  });
});
