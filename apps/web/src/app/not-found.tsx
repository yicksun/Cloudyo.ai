import Link from "next/link";
import { PublicShell } from "@/components/public-shell";
export default function NotFound() {
  return (
    <PublicShell>
      <section className="content-document">
        <h1>Page not found</h1>
        <p>The page may have moved or is no longer published.</p>
        <Link href="/" className="text-accent underline">
          Back to Cloudyo
        </Link>
      </section>
    </PublicShell>
  );
}
