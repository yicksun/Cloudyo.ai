"use client";
import { useState } from "react";
import { Button } from "./reference-adapters";
export function SubscriptionAction({
  token,
  action,
}: {
  token: string;
  action: "confirm" | "unsubscribe";
}) {
  const [state, setState] = useState("");
  const [pending, setPending] = useState(false);
  async function run() {
    setPending(true);
    try {
      const response = await fetch(`/api/newsletter/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data: { error?: { message?: string } } = await response.json();
      setState(
        response.ok
          ? action === "confirm"
            ? "Your subscription is confirmed."
            : "You have been unsubscribed."
          : (data.error?.message ?? "This link could not be processed."),
      );
    } catch {
      setState("Unable to connect. Please try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <p role="status">{state}</p>
      <Button onClick={run} disabled={pending || !token}>
        {pending
          ? "Processing..."
          : action === "confirm"
            ? "Confirm subscription"
            : "Unsubscribe"}
      </Button>
    </>
  );
}
