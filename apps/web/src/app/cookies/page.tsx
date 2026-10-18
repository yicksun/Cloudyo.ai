import { PublicShell } from "@/components/public-shell";
export const metadata = {
  title: "Cookie Policy",
  robots: { index: false, follow: false },
};
export default function Cookies() {
  return (
    <PublicShell>
      <article className="content-document">
        <h1>Cookie Policy</h1>
        <p>
          This implementation does not enable advertising or nonessential
          analytics cookies. Staff sign-in uses essential authentication
          cookies.
        </p>
        <p>
          The final cookie notice must be approved against the deployed
          configuration before production launch. Optional tracking may not be
          enabled without the required consent controls.
        </p>
      </article>
    </PublicShell>
  );
}
