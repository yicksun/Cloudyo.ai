import { PublicShell } from "@/components/public-shell";
export const metadata = {
  title: "Terms of Service",
  robots: { index: false, follow: false },
};
export default function Terms() {
  return (
    <PublicShell>
      <article className="content-document">
        <h1>Terms of Service</h1>
        <p>
          Cloudyo's final website terms require owner and legal approval before
          production launch. This development page does not create a service
          agreement.
        </p>
        <p>
          For service enquiries or contract terms, contact{" "}
          <a href="mailto:support@cloudyo.ai">support@cloudyo.ai</a>.
        </p>
      </article>
    </PublicShell>
  );
}
