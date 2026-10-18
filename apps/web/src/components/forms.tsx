"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { contactSchema, partnerSchema, topics, interests } from "@cloudyo/core";
import { Button } from "./reference-adapters";

const control =
  "w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";
interface Values {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  topic: string;
  message: string;
  orgName: string;
  contactName: string;
  workEmail: string;
  partnerType: string;
  valueProposition: string;
  website: string;
  startedAt: number;
}
type FieldName = keyof Values;
export function BusinessForm({ kind }: { kind: "contact" | "partner" }) {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({
    defaultValues: {
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      topic: topics[0],
      message: "",
      orgName: "",
      contactName: "",
      workEmail: "",
      partnerType: interests[0],
      valueProposition: "",
      website: "",
      startedAt: 0,
    },
  });
  const key = useRef("");
  const [reference, setReference] = useState("");
  const [failure, setFailure] = useState("");
  useEffect(() => {
    key.current = crypto.randomUUID();
    setValue("startedAt", Date.now());
    const selected = new URLSearchParams(window.location.search).get("topic");
    const topic = topics.find((v) => v === selected);
    if (topic) setValue("topic", topic);
  }, [setValue]);
  async function submit(values: Values) {
    setFailure("");
    const result = (
      kind === "contact" ? contactSchema : partnerSchema
    ).safeParse(values);
    if (!result.success) {
      for (const field of Object.keys(values) as FieldName[]) {
        const issue = result.error.issues.find((v) => v.path[0] === field);
        if (issue) setError(field, { message: issue.message });
      }
      return;
    }
    try {
      const response = await fetch(`/api/email/${kind}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key.current,
        },
        body: JSON.stringify(result.data),
      });
      const body: { reference?: string; error?: { message?: string } } =
        await response.json();
      if (!response.ok || !body.reference) {
        setFailure(
          body.error?.message ??
            "The request could not be accepted. Please try again.",
        );
        return;
      }
      setReference(body.reference);
    } catch {
      setFailure(
        "Unable to connect. Your request has not been confirmed. Retry with the same details.",
      );
    }
  }
  function field(
    name: FieldName,
    label: string,
    required = true,
    placeholder = "",
    type = "text",
  ) {
    return (
      <div className="space-y-2" key={name}>
        <label
          htmlFor={`${kind}-${name}`}
          className="text-sm font-medium text-slate-700"
        >
          {label}
          {!required && <span className="form-optional"> (optional)</span>}
        </label>
        <input
          id={`${kind}-${name}`}
          {...register(name)}
          type={type}
          required={required}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${kind}-${name}-error` : undefined}
          maxLength={
            name === "company" || name === "orgName"
              ? 200
              : type === "email"
                ? 254
                : 100
          }
          autoComplete={
            name === "firstName"
              ? "given-name"
              : name === "lastName"
                ? "family-name"
                : type === "email"
                  ? "email"
                  : name === "company" || name === "orgName"
                    ? "organization"
                    : "name"
          }
          placeholder={placeholder}
          className={control}
        />
        {errors[name] && (
          <p id={`${kind}-${name}-error`} className="form-error">
            {errors[name].message}
          </p>
        )}
      </div>
    );
  }
  if (reference)
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center gap-4"
        role="status"
      >
        <CheckCircle2 size={48} className="text-emerald-500" />
        <h3 className="text-xl font-bold text-primary">
          {kind === "contact" ? "Message received!" : "Application received!"}
        </h3>
        <p className="text-slate-600">
          Thank you. Our team will review your{" "}
          {kind === "contact" ? "message" : "application"}.
        </p>
        <p className="text-sm text-slate-500">Reference: {reference}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            reset();
            setReference("");
            key.current = crypto.randomUUID();
            setValue("startedAt", Date.now());
          }}
        >
          Send another
        </Button>
      </div>
    );
  const textName = kind === "contact" ? "message" : "valueProposition";
  return (
    <form className="space-y-6" onSubmit={handleSubmit(submit)}>
      {kind === "contact" ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field("firstName", "First Name", true, "Jane")}
            {field("lastName", "Last Name", true, "Doe")}
          </div>
          {field("company", "Company", false, "Acme Corp")}
          {field("email", "Work Email", true, "jane@acmecorp.com", "email")}
        </>
      ) : (
        <>
          {field("orgName", "Organization Name")}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {field("contactName", "Contact Name")}
            {field("workEmail", "Work Email", true, "", "email")}
          </div>
        </>
      )}
      <div className="space-y-2">
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor={`${kind}-topic`}
        >
          {kind === "contact" ? "Topic" : "Partnership Interest"}
        </label>
        <select
          id={`${kind}-topic`}
          {...register(kind === "contact" ? "topic" : "partnerType")}
          className={`${control} bg-white`}
        >
          {(kind === "contact" ? topics : interests).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <div className="business-message space-y-2 relative">
        <label
          htmlFor={`${kind}-message`}
          className="text-sm font-medium text-slate-700"
        >
          {kind === "contact" ? "Message" : "Value Proposition"}
        </label>
        <textarea
          {...register(textName)}
          id={`${kind}-message`}
          rows={4}
          required
          maxLength={5000}
          aria-invalid={Boolean(errors[textName])}
          aria-describedby={
            errors[textName] ? `${kind}-message-error` : undefined
          }
          className={`${control} resize-none`}
          placeholder={
            kind === "contact"
              ? "How can we help you?"
              : "Briefly describe how a partnership would benefit both organizations..."
          }
        />
        {errors[textName] && (
          <p id={`${kind}-message-error`} className="form-error">
            {errors[textName].message}
          </p>
        )}
        <div className="honeypot" aria-hidden="true">
          <label>
            Leave empty
            <input {...register("website")} tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <input
          type="hidden"
          {...register("startedAt", { valueAsNumber: true })}
        />
        <p className="form-privacy">
          Used to reply, not for marketing.{" "}
          <a href="/privacy">Privacy Policy</a>.
        </p>
      </div>
      {failure && (
        <p className="form-error" role="alert">
          {failure}
        </p>
      )}
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full h-12 bg-primary hover:bg-primary/90 text-white text-lg rounded-lg"
      >
        {isSubmitting
          ? "Submitting..."
          : kind === "contact"
            ? "Submit Request"
            : "Submit Application"}
      </Button>
    </form>
  );
}
export function NewsletterForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<{ email: string; consent: boolean; website: string }>({
    defaultValues: { email: "", consent: false, website: "" },
  });
  const startedAt = useRef(Date.now());
  const [state, setState] = useState("");
  const [error, setErrorMessage] = useState("");
  async function submit(values: {
    email: string;
    consent: boolean;
    website: string;
  }) {
    setErrorMessage("");
    try {
      const response = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, startedAt: startedAt.current }),
      });
      const data: { error?: { message?: string } } = await response.json();
      if (!response.ok) {
        setErrorMessage(
          data.error?.message ?? "Subscription could not be accepted.",
        );
        return;
      }
      setState(
        "If confirmation is needed, check your inbox to confirm your subscription.",
      );
      reset();
    } catch {
      setErrorMessage("Unable to connect. Please try again.");
    }
  }
  if (state)
    return (
      <p className="text-sm text-emerald-400" role="status">
        {state}
      </p>
    );
  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="newsletter-form flex flex-col"
    >
      <label className="sr-only" htmlFor="newsletter-email">
        Newsletter work email address
      </label>
      <input
        {...register("email")}
        id="newsletter-email"
        type="email"
        required
        maxLength={254}
        autoComplete="email"
        placeholder="Work email address"
        className="bg-white/5 border border-white/10 rounded-md px-4 py-2 focus:outline-none focus:border-accent text-white"
      />
      <div className="honeypot" aria-hidden="true">
        <label>
          Leave empty
          <input {...register("website")} tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error && (
        <p className="text-red-400 text-xs" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-accent hover:bg-accent/90 text-white flex items-center gap-2"
      >
        {isSubmitting ? (
          "Subscribing..."
        ) : (
          <>
            Subscribe <ArrowRight size={16} />
          </>
        )}
      </Button>
      <label className="newsletter-consent">
        <input {...register("consent")} type="checkbox" required />
        <span>
          Send me insights. Unsubscribe anytime. <a href="/privacy">Privacy</a>.
        </span>
      </label>
    </form>
  );
}
