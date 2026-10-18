import "server-only";
import { getServerSession, type NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { z } from "zod";
import { AppError, requirePermission, type Permission } from "@cloudyo/core";

export const authConfigured = Boolean(
  process.env.ENTRA_TENANT_ID &&
  process.env.ENTRA_CLIENT_ID &&
  process.env.ENTRA_CLIENT_SECRET &&
  process.env.NEXTAUTH_SECRET,
);
export const authOptions: NextAuthOptions = {
  providers: authConfigured
    ? [
        AzureADProvider({
          clientId: process.env.ENTRA_CLIENT_ID!,
          clientSecret: process.env.ENTRA_CLIENT_SECRET!,
          tenantId: process.env.ENTRA_TENANT_ID!,
        }),
      ]
    : [],
  session: { strategy: "jwt", maxAge: 900 },
  jwt: { maxAge: 900 },
  pages: { signIn: "/admin" },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile) {
        const parsed = z
          .object({
            oid: z.string(),
            tid: z.string(),
            roles: z.array(z.string()).default([]),
          })
          .parse(profile);
        if (parsed.tid !== process.env.ENTRA_TENANT_ID)
          throw new Error("Unexpected Entra tenant.");
        token.staffId = parsed.oid;
        token.roles = parsed.roles;
        token.authenticatedAt = Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      session.staff = {
        id: typeof token.staffId === "string" ? token.staffId : "",
        roles: z.array(z.string()).parse(token.roles ?? []),
        authenticatedAt:
          typeof token.authenticatedAt === "number" ? token.authenticatedAt : 0,
      };
      return session;
    },
  },
  logger: {
    error(code) {
      console.error(JSON.stringify({ event: "auth.error", code }));
    },
    warn(code) {
      console.warn(JSON.stringify({ event: "auth.warning", code }));
    },
    debug() {},
  },
};
export async function staff(permission: Permission, fresh = false) {
  const session = await getServerSession(authOptions);
  if (!session?.staff.id || Date.now() - session.staff.authenticatedAt > 900000)
    throw new AppError(
      "UNAUTHENTICATED",
      401,
      "Sign in with your organization account.",
    );
  requirePermission(session.staff.roles, permission);
  if (fresh && Date.now() - session.staff.authenticatedAt > 300000)
    throw new AppError(
      "REAUTHENTICATE",
      401,
      "Sign out and sign in again to confirm this operation.",
    );
  return session.staff;
}
