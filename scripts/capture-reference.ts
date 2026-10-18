import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve(process.env.REFERENCE_DIR ?? ".local/reference");
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const fonts = new Set<string>();
  page.on("response", async (response) => {
    if (/fonts\.gstatic\.com/.test(response.url()) && response.ok())
      fonts.add(response.url());
  });
  await page.goto("https://cloudyo.ai", { waitUntil: "networkidle" });
  const resources = await page
    .locator("a[href^='/resources/']")
    .evaluateAll((anchors) =>
      anchors.map((a) => a.getAttribute("href")!).filter(Boolean),
    );
  await page.goto("https://cloudyo.ai/resources", { waitUntil: "networkidle" });
  resources.push(
    ...(await page
      .locator("a[href^='/resources/']")
      .evaluateAll((a) => a.map((v) => v.getAttribute("href")!))),
  );
  const routes = [
    ...new Set([
      "/",
      "/expertise",
      "/expertise/software-procurement",
      "/expertise/it-cost-management",
      "/expertise/cloud-services",
      "/expertise/data-ai-solutions",
      "/industries",
      "/cloud-providers",
      "/resources",
      "/about",
      "/contact",
      "/partner-with-us",
      "/privacy",
      ...resources,
    ]),
  ];
  const report: Record<string, unknown> = {
    capturedAt: new Date().toISOString(),
    browser: browser.version(),
    routes,
  };
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({
      width,
      height: width === 390 ? 844 : width === 768 ? 1024 : 900,
    });
    for (const route of routes) {
      await page.goto(`https://cloudyo.ai${route}`, {
        waitUntil: "networkidle",
      });
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      for (
        let y = 0;
        y < (await page.locator("body").evaluate((v) => v.scrollHeight));
        y += 700
      ) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(80);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      const name =
        route === "/" ? "home" : route.slice(1).replaceAll("/", "--");
      await page.screenshot({
        path: path.join(output, `${name}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
      if (route === "/" && width === 1440) {
        report.computedFonts = await page
          .locator("body, h1, nav, footer")
          .evaluateAll((nodes) =>
            nodes.map((v) => ({
              element: v.tagName,
              font: getComputedStyle(v).fontFamily,
            })),
          );
      }
    }
  }
  report.fontRequests = [...fonts];
  await writeFile(
    path.join(output, "manifest.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
