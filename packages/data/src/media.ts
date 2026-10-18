import { AppError } from "@cloudyo/core";
import { atomic } from "./submissions";

export async function recordMediaScan(
  blobKey: string,
  clean: boolean,
  checksum: string,
) {
  await atomic(async (tx) => {
    const asset = await tx.mediaAsset.findUnique({ where: { blobKey } });
    if (!asset)
      throw new AppError(
        "UNKNOWN_MEDIA",
        404,
        "The scanned file is not registered.",
      );
    if (asset.checksum !== checksum)
      throw new AppError(
        "MEDIA_CHANGED",
        409,
        "The scan does not match the uploaded bytes.",
      );
    if (asset.status !== "Quarantined") return;
    await tx.mediaAsset.update({
      where: { id: asset.id },
      data: { status: clean ? "Clean" : "Rejected" },
    });
    await tx.auditEvent.create({
      data: {
        actor: "system:malware-scan",
        action: clean ? "media.scan-clean" : "media.scan-rejected",
        target: asset.id,
      },
    });
  });
}

export async function publishMedia(id: string, actor: string) {
  await atomic(async (tx) => {
    const result = await tx.mediaAsset.updateMany({
      where: { id, status: "Clean" },
      data: { status: "Published" },
    });
    if (!result.count)
      throw new AppError(
        "MEDIA_NOT_CLEAN",
        409,
        "Only files approved by the trusted malware scanner can be published.",
      );
    await tx.auditEvent.create({
      data: { actor, action: "media.publish", target: id },
    });
  });
}
