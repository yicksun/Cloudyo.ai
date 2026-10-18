import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { z } from "zod";

export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("base64url");
function encryptionKey() {
  const raw = process.env.OUTBOX_ENCRYPTION_KEY;
  if (!raw || !/^[0-9a-f]{64}$/i.test(raw))
    throw new Error("OUTBOX_ENCRYPTION_KEY must be a 32-byte hexadecimal key.");
  return Buffer.from(raw, "hex");
}
export const mailSchema = z.object({
  to: z.email(),
  replyTo: z.email().optional(),
  name: z.string(),
  reference: z.string(),
  message: z.string().optional(),
  url: z.url().optional(),
});
export type MailPayload = z.infer<typeof mailSchema>;
export function encrypt(payload: MailPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(mailSchema.parse(payload))),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), encrypted]
    .map((b) => b.toString("base64url"))
    .join(".");
}
export function decrypt(value: string): MailPayload {
  const parts = value.split(".");
  if (parts.length !== 3) throw new Error("Invalid protected email payload.");
  const [iv, tag, ciphertext] = parts.map((v) => Buffer.from(v, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return mailSchema.parse(
    JSON.parse(
      Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
        "utf8",
      ),
    ),
  );
}
