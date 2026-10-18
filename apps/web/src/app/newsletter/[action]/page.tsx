import { notFound } from "next/navigation";
import { SubscriptionAction } from "@/components/subscription-action";
export const metadata = {
  title: "Newsletter preferences",
  robots: { index: false, follow: false },
};
export default async function NewsletterPage({
  params,
  searchParams,
}: {
  params: Promise<{ action: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { action } = await params;
  if (action !== "confirm" && action !== "unsubscribe") notFound();
  const { token = "" } = await searchParams;
  return (
    <main className="content-document">
      <a href="/">Cloudyo</a>
      <h1>
        {action === "confirm"
          ? "Confirm your subscription"
          : "Newsletter preferences"}
      </h1>
      <p>
        {token
          ? "Choose the action below to update your newsletter preference."
          : "A valid link from your email is required."}
      </p>
      <SubscriptionAction token={token} action={action} />
    </main>
  );
}
