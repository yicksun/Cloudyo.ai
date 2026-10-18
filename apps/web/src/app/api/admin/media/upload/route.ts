import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { randomUUID, createHash } from "node:crypto";
import { db } from "@cloudyo/data";
import { AppError } from "@cloudyo/core";
import { z } from "zod";
import { staff } from "@/lib/auth";
import { endpoint, sameOrigin } from "@/lib/api";

export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await staff("content");
    const storage = process.env.MEDIA_STORAGE_URL;
    if (!storage)
      throw new AppError(
        "MEDIA_NOT_CONFIGURED",
        503,
        "Azure media storage is not configured.",
      );
    if (Number(request.headers.get("content-length") ?? 0) > 10 * 1024 * 1024)
      throw new AppError("TOO_LARGE", 413, "Maximum file size is 10 MiB.");
    const reader = request.body?.getReader();
    if (!reader) throw new AppError("INVALID_FILE", 400, "A file is required.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 10 * 1024 * 1024) {
        await reader.cancel();
        throw new AppError("TOO_LARGE", 413, "Maximum file size is 10 MiB.");
      }
      chunks.push(chunk.value);
    }
    const bytes = Buffer.concat(chunks);
    const type =
      bytes.subarray(0, 4).toString() === "%PDF"
        ? "application/pdf"
        : bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          ? "image/png"
          : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            ? "image/jpeg"
            : bytes.subarray(0, 4).toString() === "RIFF" &&
                bytes.subarray(8, 12).toString() === "WEBP"
              ? "image/webp"
              : null;
    if (!type)
      throw new AppError(
        "INVALID_FILE",
        400,
        "Only verified PNG, JPEG, WebP and PDF files are accepted.",
      );
    const id = randomUUID();
    const blobKey = `quarantine/${id}`;
    function header(name: string, max: number) {
      try {
        return z
          .string()
          .trim()
          .min(1)
          .max(max)
          .parse(decodeURIComponent(request.headers.get(name) ?? ""));
      } catch {
        throw new AppError(
          "INVALID_FILE_METADATA",
          400,
          "A valid file name and alternative text are required.",
        );
      }
    }
    const record = await db.mediaAsset.create({
      data: {
        id,
        blobKey,
        name: header("x-file-name", 200),
        mediaType: type,
        size,
        checksum: createHash("sha256").update(bytes).digest("hex"),
        alt: header("x-alt-text", 500),
        uploader: user.id,
      },
    });
    const blob = new BlobServiceClient(storage, new DefaultAzureCredential())
      .getContainerClient("media")
      .getBlockBlobClient(blobKey);
    await blob.uploadData(bytes, {
      blobHTTPHeaders: {
        blobContentType: type,
        blobContentDisposition: "attachment",
      },
    });
    await db.auditEvent.create({
      data: { actor: user.id, action: "media.quarantined", target: record.id },
    });
    return {
      id,
      status: "Quarantined",
      message:
        "The file cannot be published until malware scanning is complete.",
    };
  }, 202);
}
