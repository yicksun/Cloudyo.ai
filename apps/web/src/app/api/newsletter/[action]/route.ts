import { z } from "zod";
import { transitionSubscription } from "@cloudyo/data";
import { AppError } from "@cloudyo/core";
import { endpoint, readJson, readBody, sameOrigin } from "@/lib/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ action: string }> },
) {
  return endpoint(async (correlationId) => {
    const { action } = await context.params;
    if (action !== "confirm" && action !== "unsubscribe")
      throw new AppError("NOT_FOUND", 404, "Unknown subscription action.");
    let token: string;
    if (
      action === "unsubscribe" &&
      request.headers.get("content-type")?.split(";")[0] ===
        "application/x-www-form-urlencoded"
    ) {
      z.literal("One-Click").parse(
        new URLSearchParams(await readBody(request)).get("List-Unsubscribe"),
      );
      token = z.string().parse(new URL(request.url).searchParams.get("token"));
    } else {
      sameOrigin(request);
      token = z
        .object({ token: z.string() })
        .parse(await readJson(request)).token;
    }
    await transitionSubscription(token, action);
    return { status: "complete", correlationId };
  });
}
