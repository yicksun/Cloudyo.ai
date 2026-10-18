import { db, siteUrl } from "@cloudyo/data";
import { topics } from "@cloudyo/core";
import { z } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    z.object({
      PUBLIC_CONTENT_MODE: z.literal("database"),
      OUTBOX_ENCRYPTION_KEY: z.string().regex(/^[a-fA-F0-9]{64}$/),
      ABUSE_HASH_SECRET: z.string().min(32),
    }).parse(process.env);
    siteUrl();
    const settings = await Promise.race([
      db.applicationSetting.findUnique({ where: { key: "recipients" } }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Readiness timeout")), 2000),
      ),
    ]);
    const routes = z
      .record(z.string(), z.unknown())
      .parse(settings?.value ?? {});
    for (const topic of [...topics, "partnerships"])
      z.email().parse(routes[topic] ?? process.env.INTERNAL_EMAIL);
    return Response.json(
      { status: "ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(JSON.stringify({ event: "health.not-ready" }));
    return Response.json(
      { status: "not-ready" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
