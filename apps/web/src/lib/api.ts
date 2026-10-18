import "server-only";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@cloudyo/core";
import { Prisma } from "@cloudyo/data";

export async function readBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError("INVALID_BODY", 400, "A JSON request is required.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.byteLength;
    if (size > 65536) {
      await reader.cancel();
      throw new AppError("PAYLOAD_TOO_LARGE", 413, "The request is too large.");
    }
    chunks.push(next.value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new AppError("INVALID_CONTENT_TYPE", 400, "Use application/json.");
  const body = await readBody(request);
  try {
    return JSON.parse(body);
  } catch {
    throw new AppError(
      "INVALID_JSON",
      400,
      "The request contains invalid JSON.",
    );
  }
}
export function sameOrigin(request: Request) {
  const expected = new URL(process.env.SITE_URL ?? request.url).origin;
  if (request.headers.get("origin") !== expected)
    throw new AppError("INVALID_ORIGIN", 403, "This request is not allowed.");
}
export function clientKey(request: Request) {
  if (process.env.APP_ENV === "azure" || process.env.APP_ENV === "production")
    return request.headers.get("x-azure-clientip") ?? "unknown-client";
  return "local-development-client";
}
export async function endpoint(
  run: (correlationId: string) => Promise<unknown>,
  status = 200,
) {
  const correlationId = randomUUID();
  try {
    return NextResponse.json(await run(correlationId), {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION",
            message: "Please check the form details.",
            fieldErrors: z.flattenError(error).fieldErrors,
          },
          correlationId,
        },
        { status: 400 },
      );
    if (error instanceof AppError)
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            fieldErrors: error.fieldErrors,
          },
          correlationId,
        },
        {
          status: error.status,
          headers: {
            ...(error.status === 429 ? { "Retry-After": "600" } : {}),
            "Cache-Control": "no-store",
          },
        },
      );
    console.error(
      JSON.stringify({
        event: "request.failed",
        correlationId,
        type: error instanceof Error ? error.name : "Unknown",
      }),
    );
    const unavailable =
      error instanceof Prisma.PrismaClientInitializationError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P1001", "P1002", "P1008", "P1017", "P2024"].includes(error.code)) ||
      (error instanceof Error && error.name === "RestError");
    return NextResponse.json(
      {
        error: {
          code: unavailable ? "TEMPORARILY_UNAVAILABLE" : "INTERNAL_ERROR",
          message: unavailable
            ? "The service is temporarily unavailable. Please try again later."
            : "The request failed. Please try again later.",
        },
        correlationId,
      },
      {
        status: unavailable ? 503 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
