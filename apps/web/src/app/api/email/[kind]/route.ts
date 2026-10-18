import { acceptSubmission, subscribe } from "@cloudyo/data";
import { AppError } from "@cloudyo/core";
import { endpoint, readJson, sameOrigin, clientKey } from "@/lib/api";

export async function POST(
  request: Request,
  context: { params: Promise<{ kind: string }> },
) {
  return endpoint(async (correlationId) => {
    sameOrigin(request);
    const { kind } = await context.params;
    const body = await readJson(request);
    if (kind === "subscribe") {
      await subscribe(body, clientKey(request));
      return { status: "accepted", correlationId };
    }
    if (kind !== "contact" && kind !== "partner")
      throw new AppError("NOT_FOUND", 404, "Unknown form.");
    const reference = await acceptSubmission(
      kind,
      body,
      request.headers.get("idempotency-key"),
      clientKey(request),
    );
    return { status: "accepted", reference, correlationId };
  }, 202);
}
