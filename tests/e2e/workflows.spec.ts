import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { db, decrypt, token, digest } from "@cloudyo/data";
import { catalog, articles } from "../../apps/web/src/lib/catalog";
import contrastDebt from "./reference/accessibility.json" with { type: "json" };
import { encode } from "next-auth/jwt";
import { z } from "zod";

test.afterAll(async () => {
  await db.$disconnect();
});
test("all public routes render content, metadata, local assets and actual 404s", async ({
  page,
}) => {
  for (const path of [
    ...Object.keys(catalog),
    ...articles.map((a) => `/resources/${a.slug}`),
    "/terms",
    "/cookies",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("link[rel=canonical]")).toHaveCount(
      path === "/terms" || path === "/cookies" ? 0 : 1,
    );
  }
  const missing = await page.goto("/does-not-exist");
  expect(missing?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
});
test("contact and partnership forms persist accepted requests", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByLabel("First Name", { exact: true }).fill("Synthetic");
  await page.getByLabel("Last Name", { exact: true }).fill("Browser");
  await page
    .getByLabel("Work Email", { exact: true })
    .fill(`browser-${Date.now()}@cloudyo.example`);
  await page
    .getByLabel("Message", { exact: true })
    .fill("Synthetic end-to-end enquiry");
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "Submit Request" }).click();
  await expect(page.getByText("Message received!")).toBeVisible();
  await expect(page.getByText(/Reference: CLY-/)).toBeVisible();
  await page.goto("/partner-with-us");
  await page
    .getByLabel("Organization Name", { exact: true })
    .fill("Synthetic partnership");
  await page.getByLabel("Contact Name", { exact: true }).fill("Test Partner");
  await page
    .getByLabel("Work Email", { exact: true })
    .fill(`partner-${Date.now()}@cloudyo.example`);
  await page
    .getByLabel("Value Proposition", { exact: true })
    .fill("Synthetic partnership verification.");
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "Submit Application" }).click();
  await expect(page.getByText("Application received!")).toBeVisible();
});
test("newsletter requires consent and explicit confirmation; GET has no side effect", async ({
  page,
}) => {
  const email = `reader-${Date.now()}@cloudyo.example`;
  await page.goto("/");
  await page.getByLabel("Newsletter work email address").fill(email);
  await page.getByLabel(/Send me insights/).check();
  await page.waitForTimeout(1600);
  await page.getByRole("button", { name: "Subscribe", exact: true }).click();
  await expect(page.getByText(/If confirmation is needed/)).toBeVisible();
  const subscriber = await db.subscriber.findFirstOrThrow({ where: { email } });
  const mail = await db.emailOutbox.findFirstOrThrow({
    where: { reference: subscriber.id },
  });
  const url = decrypt(mail.payload!).url!;
  await page.goto(new URL(url).pathname + new URL(url).search);
  expect(
    (await db.subscriber.findUniqueOrThrow({ where: { id: subscriber.id } }))
      .state,
  ).toBe("Pending");
  await page.getByRole("button", { name: "Confirm subscription" }).click();
  await expect(page.getByText("Your subscription is confirmed.")).toBeVisible();
  const unsubscribe = token();
  await db.subscriptionToken.create({
    data: {
      subscriberId: subscriber.id,
      purpose: "unsubscribe",
      hash: digest(unsubscribe),
      expiresAt: new Date(Date.now() + 60000),
    },
  });
  await page.goto(`/newsletter/unsubscribe?token=${unsubscribe}`);
  expect(
    (await db.subscriber.findUniqueOrThrow({ where: { id: subscriber.id } }))
      .state,
  ).toBe("Confirmed");
  await page.getByRole("button", { name: "Unsubscribe", exact: true }).click();
  await expect(page.getByText("You have been unsubscribed.")).toBeVisible();
  expect(
    (
      await page.request.post(
        `/api/newsletter/unsubscribe?token=${unsubscribe}`,
        { form: { "List-Unsubscribe": "One-Click" } },
      )
    ).status(),
  ).toBe(200);
});
test("staff endpoints reject anonymous access and no bypass login exists", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Welcome to Cloudyo" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with Microsoft" }),
  ).toBeVisible();
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  for (const area of [
    "contacts",
    "partners",
    "content",
    "subscribers",
    "settings",
    "outbox",
  ])
    expect((await request.get(`/api/admin/${area}`)).status()).toBe(401);
});
test("API rejects cross-origin requests, malformed input and oversized payloads", async ({
  request,
}) => {
  const path = "/api/email/contact";
  expect(
    (
      await request.post(path, {
        data: {},
        headers: { Origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.post(path, {
        data: {},
        headers: { Origin: "http://127.0.0.1:3000" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post(path, {
        data: { message: "x".repeat(70000) },
        headers: { Origin: "http://127.0.0.1:3000" },
      })
    ).status(),
  ).toBe(413);
});
test("service links preselect the correct topic without changing the public design", async ({
  page,
}) => {
  await page.goto("/expertise/cloud-services");
  const link = page.locator('a[href^="/contact?topic="]').first();
  await expect(link).toBeVisible();
  await page.goto((await link.getAttribute("href"))!);
  await expect(page.getByLabel("Topic", { exact: true })).toHaveValue(
    "Cloud Migration Services",
  );
});
test("resource category filters and mobile navigation work", async ({
  page,
}) => {
  await page.goto("/resources");
  await page.getByRole("tab", { name: "Case Studies", exact: true }).click();
  await expect(
    page.getByText("Financial Services: $12M Saved on Oracle Renewal"),
  ).toBeVisible();
  await expect(
    page.getByText("The 2025 Guide to Cloud FinOps"),
  ).not.toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("header button").last().click();
  await expect(
    page
      .locator("header")
      .getByRole("link", { name: "Contact Us", exact: true }),
  ).toBeVisible();
});
test("sitemap is real XML and public content is server rendered", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.headers()["content-type"]).toContain("xml");
  expect(await response.text()).toContain("/resources/2025-guide-cloud-finops");
  expect(await response.text()).not.toContain("/admin");
  const html = await (await request.get("/")).text();
  expect(html).toContain("Master your");
  expect(html).not.toContain("built on Replit");
});
test("isolated signed test sessions enforce staff roles, publishing, previews, and session freshness", async ({
  page,
  context,
}) => {
  async function role(roles: string[], age = 0) {
    await context.clearCookies();
    const value = await encode({
      secret: process.env.NEXTAUTH_SECRET!,
      token: {
        staffId: "e2e:editor",
        roles,
        authenticatedAt: Date.now() - age,
      },
      maxAge: 900,
    });
    await context.addCookies([
      { name: "next-auth.session-token", value, url: "http://127.0.0.1:3000" },
    ]);
  }
  await role(["Sales"]);
  expect((await page.request.get("/api/admin/contacts")).status()).toBe(200);
  expect((await page.request.get("/api/admin/content")).status()).toBe(403);
  await role(["Editor"]);
  expect((await page.request.get("/api/admin/contacts")).status()).toBe(403);
  const path = `/resources/e2e-${Date.now()}`;
  const post = (data: unknown) =>
    page.request.post("/api/admin/content", {
      data,
      headers: { Origin: "http://127.0.0.1:3000" },
    });
  const saved = await post({
    action: "save",
    data: {
      path,
      version: 0,
      title: "Synthetic CMS resource",
      description: "Browser-created test content",
      body: {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Private draft content",
                marks: [{ type: "bold" }],
              },
            ],
          },
        ],
      },
    },
  });
  expect(saved.status()).toBe(200);
  const record = z
    .object({
      page: z.object({ id: z.uuid(), version: z.number() }),
      revision: z.object({ id: z.uuid() }),
    })
    .parse(await saved.json());
  try {
    expect((await page.goto(path))?.status()).toBe(404);
    await page.goto(`/admin/preview/${record.page.id}`);
    await expect(
      page.getByText("Private draft content", { exact: true }),
    ).toBeVisible();
    expect(
      (
        await post({
          action: "publish",
          data: {
            id: record.page.id,
            version: record.page.version,
            revisionId: record.revision.id,
          },
        })
      ).status(),
    ).toBe(200);
    await page.goto(path);
    await expect(page.locator("strong")).toHaveText("Private draft content");
    await page.goto("/resources");
    await expect(
      page.getByRole("heading", { name: "Synthetic CMS resource" }),
    ).toBeVisible();
    expect(
      (
        await post({
          action: "publish",
          data: {
            id: record.page.id,
            version: record.page.version,
            revisionId: null,
          },
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await post({
          action: "publish",
          data: { id: record.page.id, version: 2, revisionId: null },
        })
      ).status(),
    ).toBe(200);
    await page.goto("/resources");
    await expect(
      page.getByRole("heading", { name: "Synthetic CMS resource" }),
    ).toHaveCount(0);
    const original = await db.contentPage.findUniqueOrThrow({
      where: { path: "/resources/2025-guide-cloud-finops" },
    });
    await page.goto(`/admin/preview/${original.id}`);
    await expect(
      page.getByRole("heading", {
        name: "The 2025 Guide to Cloud FinOps",
        exact: true,
      }),
    ).toBeVisible();
    await role(["Administrator"], 6 * 60000);
    expect(
      (
        await page.request.post("/api/admin/export", {
          data: { area: "contacts" },
          headers: { Origin: "http://127.0.0.1:3000" },
        })
      ).status(),
    ).toBe(401);
    await role(["Administrator"]);
    expect(
      (
        await page.request.post("/api/admin/export", {
          data: { area: "contacts" },
          headers: { Origin: "http://127.0.0.1:3000" },
        })
      ).status(),
    ).toBe(200);
    await role(["Sales"], 16 * 60000);
    expect((await page.request.get("/api/admin/contacts")).status()).toBe(401);
  } finally {
    await db.contentPage.update({
      where: { id: record.page.id },
      data: { publishedId: null },
    });
    await db.contentPage.delete({ where: { id: record.page.id } });
  }
});
test("staff can save, preview, publish and unpublish from the actual rich-text editor", async ({
  page,
  context,
}) => {
  const value = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    token: {
      staffId: "e2e:ui-editor",
      roles: ["Editor"],
      authenticatedAt: Date.now(),
    },
    maxAge: 900,
  });
  await context.addCookies([
    { name: "next-auth.session-token", value, url: "http://127.0.0.1:3000" },
  ]);
  await page.goto("/admin");
  await page.getByRole("button", { name: "New page or resource" }).click();
  const path = `/resources/e2e-editor-${Date.now()}`;
  await page.getByLabel("Public URL path").fill(path);
  await page
    .getByLabel("Page title / SEO title")
    .fill("Browser editor resource");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Synthetic editor verification");
  await page
    .getByRole("textbox", { name: "Page body" })
    .fill("Edited in the actual staff console");
  await page.getByRole("button", { name: "Save new draft revision" }).click();
  await expect(
    page.getByRole("heading", { name: "Content editor", exact: true }),
  ).toHaveCount(0);
  const record = await db.contentPage.findUniqueOrThrow({ where: { path } });
  try {
    const card = page
      .locator("article.admin-card")
      .filter({ has: page.getByRole("heading", { name: path, exact: true }) });
    await card.getByRole("button", { name: "Edit and revisions" }).click();
    await page
      .getByLabel("Page title / SEO title")
      .fill("Unsaved content must not leak");
    await page
      .locator("article.admin-card")
      .filter({
        has: page.getByRole("heading", {
          name: "/resources/2025-guide-cloud-finops",
          exact: true,
        }),
      })
      .getByRole("button", { name: "Edit and revisions" })
      .click();
    await expect(page.getByLabel("Public URL path")).toHaveValue(
      "/resources/2025-guide-cloud-finops",
    );
    await card.getByRole("button", { name: "Edit and revisions" }).click();
    await expect(page.getByLabel("Public URL path")).toHaveValue(path);
    await expect(page.getByLabel("Page title / SEO title")).toHaveValue(
      "Browser editor resource",
    );
    await page
      .getByRole("button", { name: "Publish selected saved revision" })
      .click();
    await expect(
      page.getByRole("heading", { name: "Content editor", exact: true }),
    ).toHaveCount(0);
    await page.goto(path);
    await expect(
      page.getByText("Edited in the actual staff console", { exact: true }),
    ).toBeVisible();
    await page.goto("/admin");
    await card.getByRole("button", { name: "Edit and revisions" }).click();
    await page.getByRole("button", { name: "Unpublish", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Content editor", exact: true }),
    ).toHaveCount(0);
    expect((await page.goto(path))?.status()).toBe(404);
  } finally {
    await db.contentPage.update({
      where: { id: record.id },
      data: { publishedId: null },
    });
    await db.contentPage.delete({ where: { id: record.id } });
  }
});
test("primary pages introduce no serious accessibility failures beyond measured reference contrast debt", async ({
  page,
}) => {
  const source = await readFile("node_modules/axe-core/axe.min.js", "utf8");
  for (const path of [
    "/",
    "/contact",
    "/partner-with-us",
    "/resources",
    "/admin",
  ]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(800);
    await page.addScriptTag({ content: source });
    const result = await page.evaluate(async () => {
      const axe = Reflect.get(window, "axe") as typeof import("axe-core");
      return axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
      });
    });
    const serious = result.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect
      .soft(
        serious
          .filter((v) => v.id !== "color-contrast")
          .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
        path,
      )
      .toEqual([]);
    const baseline =
      Object.entries(contrastDebt.routes).find(([key]) => key === path)?.[1] ??
      [];
    const signature = (summary: string) =>
      summary.match(/foreground color:.*font weight: [a-z]+/)?.[0];
    const known = new Set(baseline.map((node) => signature(node.summary)));
    const failures = serious
      .filter((v) => v.id === "color-contrast")
      .flatMap((v) => v.nodes);
    expect
      .soft(
        failures.length,
        `${path}: reference contrast finding count must not increase`,
      )
      .toBeLessThanOrEqual(baseline.length);
    expect
      .soft(
        failures
          .filter((node) => !known.has(signature(node.failureSummary ?? "")))
          .map((v) => v.target),
        `${path}: new contrast combinations`,
      )
      .toEqual([]);
    if (failures.length)
      test.info().annotations.push({
        type: "Unapproved reference contrast debt",
        description: `${path}: ${failures.length} original-theme contrast findings retained pending owner decision.`,
      });
  }
});
