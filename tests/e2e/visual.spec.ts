import { test, expect } from "@playwright/test";
import { catalog, articles } from "../../apps/web/src/lib/catalog";

const routes = [
  ...Object.keys(catalog),
  ...articles.map((a) => `/resources/${a.slug}`),
];
for (const width of [390, 768, 1440])
  for (const route of routes) {
    test(`reference design ${route} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({
        width,
        height: width === 390 ? 844 : width === 768 ? 1024 : 900,
      });
      await page.goto(route, { waitUntil: "networkidle" });
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
      await expect(page).toHaveScreenshot(`${name}-${width}.png`, {
        fullPage: true,
      });
    });
  }
