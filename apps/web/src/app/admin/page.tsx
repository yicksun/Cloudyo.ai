import { getServerSession } from "next-auth";
import { authOptions, authConfigured } from "@/lib/auth";
import { AdminConsole } from "@/components/admin-console";
import { StaffSignIn } from "@/components/staff-signin";
import "./styles.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Staff administration",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const session = authConfigured ? await getServerSession(authOptions) : null;
  return (
    <main className="admin-layout">
      <header className="admin-header">
        <a href="/" className="admin-brand">
          Cloudyo<span>.</span>
        </a>
        <span>Staff workspace</span>
      </header>
      {session?.staff.id &&
      Date.now() - session.staff.authenticatedAt <= 900000 ? (
        <AdminConsole roles={session.staff.roles} />
      ) : (
        <section className="admin-signin">
          <p className="admin-eyebrow">SECURE STAFF ACCESS</p>
          <h1>Welcome to Cloudyo</h1>
          <p>
            Manage enquiries, partnerships, content, and newsletter preferences.
          </p>
          <StaffSignIn configured={authConfigured} />
        </section>
      )}
    </main>
  );
}
