/**
 * SMTP email helper (server-only)
 *
 * This module sends contact form emails through an SMTP relay that requires no credentials.
 * Configure via environment variables:
 *
 * Required:
 *  - SMTP_HOST              e.g. "smtp.yourrelay.local"
 *  - SMTP_PORT              e.g. "25" or "587" or "465"
 *  - CONTACT_TO_EMAIL       e.g. "you@yourdomain.com"
 *  - CONTACT_FROM_EMAIL     e.g. "noreply@yourdomain.com"
 *
 * Optional:
 *  - SMTP_SECURE            "true" to use TLS (typically port 465). Defaults to false unless port is 465.
 *  - CONTACT_BCC_EMAIL      e.g. "archive@yourdomain.com"
 *  - CONTACT_SUBJECT_PREFIX e.g. "[Contact]"
 *
 * Notes:
 *  - This transporter is configured WITHOUT authentication, as requested.
 *  - Make sure your relay accepts mail from the CONTACT_FROM_EMAIL envelope/sender.
 */

import nodemailer from "nodemailer";

export type Transporter = {
  sendMail: (
    mailOptions: any,
  ) => Promise<{ messageId?: string } & Record<string, any>>;
};

/**
 * Basic guard to avoid header injection: strip CR/LF and trim.
 */
function sanitizeHeaderValue(input: string): string {
  return input.replace(/[\r\n]+/g, " ").trim();
}

/**
 * Basic guard for email-like strings used in headers (replyTo).
 * - Remove CR/LF and dangerous characters
 * - Truncate to a reasonable length
 */
function sanitizeEmailAddress(input: string): string {
  const cleaned = sanitizeHeaderValue(input).replace(
    /[<>\(\)\[\]\\,;:"']/g,
    "",
  );
  return cleaned.slice(0, 254);
}

/**
 * Normalize a subject line: apply optional prefix, strip line breaks, and cap length.
 */
function buildSubject(raw: string, prefix = ""): string {
  const base = sanitizeHeaderValue(raw).slice(0, 200);
  const pfx = prefix ? `${sanitizeHeaderValue(prefix)} ` : "";
  return `${pfx}${base}`.slice(0, 240);
}

/**
 * Ensure required configuration is present.
 */
function assertEmailConfig() {
  const { SMTP_HOST, SMTP_PORT, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } =
    process.env;

  if (!SMTP_HOST) {
    throw new Error("SMTP_HOST is not set");
  }
  if (!SMTP_PORT) {
    throw new Error("SMTP_PORT is not set");
  }
  if (!CONTACT_TO_EMAIL) {
    throw new Error("CONTACT_TO_EMAIL is not set");
  }
  if (!CONTACT_FROM_EMAIL) {
    throw new Error("CONTACT_FROM_EMAIL is not set");
  }
}

/**
 * Create a Nodemailer transporter for an unauthenticated SMTP relay.
 */
export function createTransport(): Transporter {
  assertEmailConfig();

  const host = process.env.SMTP_HOST!;
  const port = Number(process.env.SMTP_PORT!);
  const secure =
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
    port === 465;

  // No auth: relay is expected to accept unauthenticated connections from this server
  return nodemailer.createTransport({
    host,
    port,
    secure,
    // STARTTLS will be used automatically when available (for non-secure connections)
    // Additional TLS options can be added if needed:
    // tls: { rejectUnauthorized: true },
  });
}

export type SendContactEmailParams = {
  fromEmail: string; // Reply-to address provided by the user
  subject: string; // Subject provided by the user
  text: string; // Message body (plain text)
  html?: string | null; // Optional HTML alternative
};

/**
 * Send a contact email via the SMTP relay.
 *
 * - From: CONTACT_FROM_EMAIL (must be authorized by your relay)
 * - To: CONTACT_TO_EMAIL
 * - Reply-To: fromEmail provided by the user
 * - Optional BCC: CONTACT_BCC_EMAIL
 * - Subject: optional CONTACT_SUBJECT_PREFIX applied
 */
export async function sendContactEmail({
  fromEmail,
  subject,
  text,
  html = null,
}: SendContactEmailParams): Promise<{ ok: true; id: string | undefined }> {
  assertEmailConfig();

  const TO = process.env.CONTACT_TO_EMAIL!;
  const FROM = process.env.CONTACT_FROM_EMAIL!;
  const BCC = process.env.CONTACT_BCC_EMAIL;
  const SUBJECT_PREFIX = process.env.CONTACT_SUBJECT_PREFIX || "[Contact]";

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure =
    String(process.env.SMTP_SECURE || "").toLowerCase() === "true" ||
    port === 465;

  console.log("[email] sendContactEmail start", {
    TO,
    FROM,
    BCC,
    SUBJECT_PREFIX,
    SMTP_HOST: host,
    SMTP_PORT: port,
    SMTP_SECURE: secure,
    fromEmail,
    subject,
    textLength: text?.length ?? 0,
    hasHtml: !!html,
  });

  const transporter = createTransport();

  const replyTo = sanitizeEmailAddress(fromEmail);
  const finalSubject = buildSubject(subject, SUBJECT_PREFIX);

  // Ensure the plain text is a string and not unbounded
  const safeText = String(text ?? "").slice(0, 20000);
  const safeHtml =
    typeof html === "string" && html.trim().length > 0
      ? html.slice(0, 50000)
      : undefined;

  const start = Date.now();
  try {
    const info = await transporter.sendMail({
      from: sanitizeHeaderValue(FROM),
      to: sanitizeHeaderValue(TO),
      ...(BCC ? { bcc: sanitizeHeaderValue(BCC) } : {}),
      subject: finalSubject,
      text: `From: ${replyTo}\n\n${safeText}`,
      ...(safeHtml ? { html: safeHtml } : {}),
      replyTo,
      headers: {
        "X-Contact-Form": "true",
      },
    });

    console.log("[email] sendContactEmail success", {
      durationMs: Date.now() - start,
      messageId: info.messageId,
      response: (info as any)?.response,
    });

    return { ok: true as const, id: info.messageId };
  } catch (err: any) {
    console.error("[email] sendContactEmail error", {
      durationMs: Date.now() - start,
      errorMessage: err?.message || String(err),
      code: err?.code,
      command: err?.command,
      stack: err?.stack,
    });
    throw err;
  }
}
