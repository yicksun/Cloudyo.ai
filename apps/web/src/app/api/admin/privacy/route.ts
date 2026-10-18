import { privacyBusiness } from "@cloudyo/data";
import { staff } from "@/lib/auth";
import { endpoint, readJson, sameOrigin } from "@/lib/api";

export async function POST(request: Request) {
  return endpoint(async () => {
    sameOrigin(request);
    const user = await staff("settings", true);
    await privacyBusiness(await readJson(request), user.id);
    return { status: "saved" };
  });
}
