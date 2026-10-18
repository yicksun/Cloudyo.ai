import NextAuth from "next-auth";
import { authConfigured, authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);
function unavailable() {
  return Response.json(
    {
      error: {
        code: "AUTH_NOT_CONFIGURED",
        message: "Staff sign-in is not configured.",
      },
    },
    { status: 503 },
  );
}
export const GET = authConfigured ? handler : unavailable;
export const POST = authConfigured ? handler : unavailable;
