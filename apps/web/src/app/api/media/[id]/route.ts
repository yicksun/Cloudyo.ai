import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "node:crypto";
import { db } from "@cloudyo/data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const parsed = z.uuid().safeParse((await context.params).id);
  if (!parsed.success) return new NextResponse("Not found", { status: 404 });
  const asset = await db.mediaAsset.findFirst({
    where: { id: parsed.data, status: "Published" },
  });
  if (!asset) return new NextResponse("Not found", { status: 404 });
  const storage = process.env.MEDIA_STORAGE_URL;
  if (!storage)
    return new NextResponse("Media storage is not configured.", {
      status: 503,
    });
  const blob = new BlobServiceClient(storage, new DefaultAzureCredential())
    .getContainerClient("media")
    .getBlobClient(asset.blobKey);
  const bytes = await blob.downloadToBuffer(0, asset.size);
  if (createHash("sha256").update(bytes).digest("hex") !== asset.checksum) {
    await db.$transaction([
      db.mediaAsset.update({
        where: { id: asset.id },
        data: { status: "Rejected" },
      }),
      db.auditEvent.create({
        data: {
          actor: "system:media-integrity",
          action: "media.integrity-failed",
          target: asset.id,
        },
      }),
    ]);
    return new NextResponse("The file failed integrity verification.", {
      status: 409,
    });
  }
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": asset.mediaType,
      "Content-Disposition": `${asset.mediaType === "application/pdf" ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(asset.name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
