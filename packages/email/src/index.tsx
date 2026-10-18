import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Hr,
} from "@react-email/components";
import { render } from "@react-email/render";

export interface EmailInput {
  name: string;
  reference: string;
  message?: string;
  url?: string;
}
export async function renderEmail(template: string, input: EmailInput) {
  const confirmation = template === "newsletter-confirm";
  const internal = template.endsWith("-internal");
  const partner = template.startsWith("partner");
  const subject = confirmation
    ? "Confirm your Cloudyo subscription"
    : internal
      ? `New ${partner ? "partnership application" : "enquiry"} - ${input.reference}`
      : `Cloudyo received your ${partner ? "application" : "enquiry"} - ${input.reference}`;
  const element = (
    <Html lang="en">
      <Head />
      <Preview>{subject}</Preview>
      <Body
        style={{
          backgroundColor: "#f8fafc",
          fontFamily: "Arial, sans-serif",
          color: "#052b34",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            padding: "36px",
            margin: "32px auto",
            borderRadius: "8px",
          }}
        >
          <Heading style={{ color: "#052b34" }}>
            Cloudyo<span style={{ color: "#ff3710" }}>.</span>
          </Heading>
          <Heading as="h2">{subject}</Heading>
          <Text>Hello {input.name},</Text>
          {confirmation ? (
            <>
              <Text>
                Please confirm that you would like to receive Cloudyo insights.
                This link expires in 24 hours. If you did not request this, you
                can ignore this message.
              </Text>
              <Link href={input.url}>Confirm subscription</Link>
            </>
          ) : internal ? (
            <Text style={{ whiteSpace: "pre-wrap" }}>{input.message}</Text>
          ) : (
            <Text>
              Thank you for contacting Cloudyo. Your request has been recorded
              and our team will review it.
            </Text>
          )}
          {!confirmation && <Text>Reference: {input.reference}</Text>}
          <Hr />
          <Text style={{ fontSize: "12px", color: "#64748b" }}>
            Cloudyo | Cloud, software and AI advisory
          </Text>
        </Container>
      </Body>
    </Html>
  );
  return {
    subject,
    html: await render(element),
    plainText: await render(element, { plainText: true }),
  };
}
