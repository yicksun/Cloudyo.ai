import { z } from "zod";

export const topics = [
  "Software Procurement Advisory",
  "IT Cost Management / FinOps",
  "Cloud Migration Services",
  "Data & AI Solutions",
  "General Inquiry",
] as const;
export const interests = [
  "Technology / ISV",
  "System Integrator",
  "Referral / Affiliate",
] as const;

const name = z.string().trim().min(1, "This field is required.").max(100);
export const email = z
  .string()
  .trim()
  .max(254)
  .email("Enter a valid email address.");
const message = z.string().trim().min(1, "This field is required.").max(5000);
const antiSpam = {
  website: z.string().max(0, "Leave this field empty.").optional(),
  startedAt: z.number().int().positive(),
};
export const contactSchema = z.object({
  firstName: name,
  lastName: name,
  company: z.string().trim().max(200).default(""),
  email,
  topic: z.enum(topics),
  message,
  ...antiSpam,
});
export const partnerSchema = z.object({
  orgName: z.string().trim().min(1).max(200),
  contactName: name,
  workEmail: email,
  partnerType: z.enum(interests),
  valueProposition: message,
  ...antiSpam,
});
export const subscribeSchema = z.object({
  email,
  consent: z.literal(true, {
    error: "Please agree to receive Cloudyo insights.",
  }),
  ...antiSpam,
});
export type ContactInput = z.infer<typeof contactSchema>;
export type PartnerInput = z.infer<typeof partnerSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;

export function normalizeEmail(address: string): string {
  const trimmed = address.trim();
  const at = trimmed.lastIndexOf("@");
  return `${trimmed.slice(0, at)}@${trimmed.slice(at + 1).toLowerCase()}`;
}
export class AppError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}
export const roles = ["Administrator", "Editor", "Sales"] as const;
export type Role = (typeof roles)[number];
export type Permission =
  | "business"
  | "content"
  | "subscribers"
  | "settings"
  | "export"
  | "retry";
const policy: Record<Permission, readonly Role[]> = {
  business: ["Administrator", "Sales"],
  content: ["Administrator", "Editor"],
  subscribers: ["Administrator"],
  settings: ["Administrator"],
  export: ["Administrator"],
  retry: ["Administrator"],
};
export function permitted(
  userRoles: readonly string[],
  permission: Permission,
): boolean {
  return policy[permission].some((role) => userRoles.includes(role));
}
export function requirePermission(
  userRoles: readonly string[],
  permission: Permission,
) {
  if (!permitted(userRoles, permission))
    throw new AppError(
      "FORBIDDEN",
      403,
      "You do not have access to this operation.",
    );
}
export function csvCell(value: unknown): string {
  let text = String(value ?? "");
  if (/^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
export function validateTiming(startedAt: number, now = Date.now()) {
  if (now - startedAt < 1500 || now - startedAt > 86_400_000)
    throw new AppError(
      "FORM_EXPIRED",
      400,
      "Please reload the form and try again.",
    );
}
export function retryDelay(attempt: number, random = Math.random): number {
  return (
    Math.min(30 * 60_000, 30_000 * 2 ** Math.max(0, attempt - 1)) +
    Math.floor(random() * 1000)
  );
}
export const documentSchema: z.ZodType<RichNode> = z.lazy(() =>
  z
    .object({
      type: z.enum([
        "doc",
        "paragraph",
        "heading",
        "text",
        "bulletList",
        "orderedList",
        "listItem",
        "blockquote",
        "hardBreak",
        "horizontalRule",
      ]),
      text: z.string().max(100000).optional(),
      attrs: z
        .object({
          level: z.number().int().min(1).max(3).optional(),
          start: z.number().int().min(1).max(100000).optional(),
          type: z.enum(["1", "a", "A", "i", "I"]).nullable().optional(),
        })
        .strict()
        .optional(),
      marks: z
        .array(
          z
            .object({ type: z.enum(["bold", "italic", "strike", "code"]) })
            .strict(),
        )
        .optional(),
      content: z.array(documentSchema).max(1000).optional(),
    })
    .strict(),
);
export interface RichNode {
  type: string;
  text?: string;
  attrs?: {
    level?: number;
    start?: number;
    type?: "1" | "a" | "A" | "i" | "I" | null;
  };
  marks?: { type: string }[];
  content?: RichNode[];
}
export const contentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(320),
  body: documentSchema.refine(
    (v) => v.type === "doc",
    "A document root is required.",
  ),
});
export function safeInternalPath(value: string) {
  if (
    !/^\/[a-z0-9/-]*$/.test(value) ||
    value.includes("//") ||
    /^\/(?:api|admin|health|newsletter)(?:\/|$)/.test(value)
  )
    throw new AppError("INVALID_PATH", 400, "Choose a valid public path.");
  return value;
}
