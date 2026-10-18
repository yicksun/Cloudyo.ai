import { csvCell, AppError } from "@cloudyo/core";
import { db } from "@cloudyo/data";
import { staff } from "@/lib/auth";
import { endpoint, sameOrigin, readJson } from "@/lib/api";
import { z } from "zod";

export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await staff("export", true);
    const { area } = z
      .object({ area: z.enum(["contacts", "partners", "subscribers"]) })
      .parse(await readJson(request));
    const records =
      area === "contacts"
        ? await db.contactEnquiry.findMany({ take: 5001 })
        : area === "partners"
          ? await db.partnerApplication.findMany({ take: 5001 })
          : await db.subscriber.findMany({ take: 5001 });
    if (records.length > 5000)
      throw new AppError(
        "EXPORT_LIMIT",
        413,
        "Export exceeds 5,000 records. Request a scoped authorized export.",
      );
    await db.auditEvent.create({
      data: {
        actor: user.id,
        action: `${area}.export`,
        target: String(records.length),
      },
    });
    const keys = records[0] ? Object.keys(records[0]) : [];
    return {
      csv: [
        keys.map(csvCell).join(","),
        ...records.map((r) =>
          keys.map((key) => csvCell(Reflect.get(r, key))).join(","),
        ),
      ].join("\r\n"),
    };
  });
}
