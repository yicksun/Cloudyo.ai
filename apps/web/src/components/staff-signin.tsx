"use client";
import { signIn, signOut } from "next-auth/react";
export function StaffSignIn({ configured }: { configured: boolean }) {
  return configured ? (
    <button
      className="admin-button"
      onClick={() => signIn("azure-ad", { callbackUrl: "/admin" })}
    >
      Sign in with Microsoft
    </button>
  ) : (
    <p className="admin-notice" role="status">
      Staff sign-in is unavailable until the organization's Microsoft Entra ID
      connection is configured. No local password or bypass login is enabled.
    </p>
  );
}
export function StaffSignOut() {
  return (
    <button
      className="admin-button secondary"
      onClick={() => signOut({ callbackUrl: "/admin" })}
    >
      Sign out
    </button>
  );
}
