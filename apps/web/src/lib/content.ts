import "server-only";
import { db } from "@cloudyo/data";

export async function contentPage(path: string) {
  if (process.env.PUBLIC_CONTENT_MODE === "static") return null;
  if (!process.env.DATABASE_URL)
    throw new Error(
      "DATABASE_URL is required. PUBLIC_CONTENT_MODE=static enables the explicit read-only reference preview.",
    );
  return db.contentPage.findUnique({
    where: { path },
    include: { published: true },
  });
}
