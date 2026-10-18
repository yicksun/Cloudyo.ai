import type { MetadataRoute } from "next";
import { catalog, articles } from "@/lib/catalog";
import { db } from "@cloudyo/data";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_URL ?? "http://localhost:3000";
  const paths = new Set([
    ...Object.keys(catalog),
    ...articles.map((v) => `/resources/${v.slug}`),
  ]);
  if (process.env.PUBLIC_CONTENT_MODE !== "static") {
    for (const page of await db.contentPage.findMany({
      select: { path: true, publishedId: true },
    })) {
      if (page.publishedId) paths.add(page.path);
      else paths.delete(page.path);
    }
    for (const redirect of await db.redirect.findMany())
      paths.delete(redirect.source);
  }
  return [...paths].map((path) => ({ url: origin + path }));
}
