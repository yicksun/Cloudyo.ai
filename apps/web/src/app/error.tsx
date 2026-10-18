"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="content-document" role="alert">
      <h1>Temporarily unavailable</h1>
      <p>
        We could not load this page. Please retry or contact support@cloudyo.ai.
      </p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
