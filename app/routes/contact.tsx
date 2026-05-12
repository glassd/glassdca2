import type { Route } from "./+types/contact";
import { seoMeta } from "~/lib/seo";
import { Form, useActionData, useNavigation } from "react-router";
import { sendContactEmail } from "../lib/email.server";
import {
  getClientIp,
  looksLikeBot,
  isTooFast,
  rateLimit,
  throttleDuplicates,
  hashContent,
  originAllowed,
} from "../lib/abuse.server";

export function meta({}: Route.MetaArgs) {
  return seoMeta({
    title: "Contact Me - David Glass",
    description: "Get in touch with David Glass.",
    url: "/contact",
  });
}

type ActionData = {
  ok?: true;
  errors?: {
    email?: string;
    subject?: string;
    message?: string;
    general?: string;
  };
};

export async function action({
  request,
}: Route.ActionArgs): Promise<ActionData | Response> {
  const now = Date.now();
  const reqId = Math.random().toString(36).slice(2, 8);

  console.log(`[contact:${reqId}] action start at ${now}`);

  const form = await request.formData();
  console.log(`[contact:${reqId}] raw formData keys:`, Array.from(form.keys()));

  // Form fields
  const email = String(form.get("email") || "").trim();
  const subject = String(form.get("subject") || "").trim();
  const message = String(form.get("message") || "").trim();

  // Honeypot + timing
  const company = String(form.get("company") || "").trim();
  const startedAtRaw = String(form.get("startedAt") || "0");
  const startedAt = Number(startedAtRaw);

  console.log(`[contact:${reqId}] parsed fields`, {
    email,
    subjectLength: subject.length,
    messageLength: message.length,
    company,
    startedAtRaw,
    startedAt,
    now,
    deltaMs: now - startedAt,
  });

  const publicSiteUrl = (process as any)?.env?.PUBLIC_SITE_URL;
  if (!originAllowed(request, publicSiteUrl)) {
    console.warn(`[contact:${reqId}] origin not allowed`, {
      publicSiteUrl,
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    });
    return { errors: { general: "Unable to process request." } };
  }

  if (company) {
    console.warn(
      `[contact:${reqId}] honeypot triggered (company field not empty)`,
    );
    return { errors: { general: "Unable to process request." } };
  }
  if (looksLikeBot(request)) {
    console.warn(`[contact:${reqId}] looksLikeBot returned true`, {
      ua: request.headers.get("user-agent"),
    });
    return { errors: { general: "Unable to process request." } };
  }

  if (isTooFast(now, startedAt)) {
    console.warn(`[contact:${reqId}] isTooFast triggered`, {
      now,
      startedAt,
      deltaMs: now - startedAt,
    });
    return {
      errors: { general: "Form submitted too quickly. Please try again." },
    };
  }

  const errors: ActionData["errors"] = {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }
  if (!subject) {
    errors.subject = "Please enter a subject.";
  } else if (subject.length > 200) {
    errors.subject = "Subject is too long (max 200 chars).";
  }
  if (!message) {
    errors.message = "Please enter a message.";
  } else if (message.length > 5000) {
    errors.message = "Message is too long (max 5000 chars).";
  }
  if (Object.keys(errors).length) {
    console.warn(`[contact:${reqId}] validation failed`, { errors });
    return { errors };
  }

  const ip = getClientIp(request);
  console.log(`[contact:${reqId}] client IP`, { ip });

  const rl = rateLimit(ip, now);
  if (!rl.ok) {
    console.warn(`[contact:${reqId}] rateLimit exceeded`, {
      ip,
      retryAfterMs: rl.retryAfterMs,
    });
    return {
      errors: { general: "Too many requests. Please try again later." },
    };
  }
  const contentHash = hashContent(`${email}|${subject}|${message}`);
  const dup = throttleDuplicates(ip, now, contentHash);
  if (!dup.ok) {
    console.warn(`[contact:${reqId}] duplicate submission detected`, {
      ip,
      contentHash,
    });
    return {
      errors: {
        general:
          "Duplicate submission detected. Please wait before trying again.",
      },
    };
  }

  console.log(`[contact:${reqId}] passing abuse checks, about to send email`, {
    email,
    subject,
    messageLength: message.length,
  });

  const sendStart = Date.now();
  try {
    await sendContactEmail({ fromEmail: email, subject, text: message });
    const sendDuration = Date.now() - sendStart;
    console.log(
      `[contact:${reqId}] sendContactEmail succeeded in ${sendDuration}ms`,
    );
    return new Response(null, {
      status: 303,
      headers: { Location: "/contact/sent" },
    });
  } catch (e: any) {
    const sendDuration = Date.now() - sendStart;
    console.error(
      `[contact:${reqId}] sendContactEmail FAILED after ${sendDuration}ms`,
      {
        errorMessage: e?.message || e,
        stack: e?.stack,
      },
    );
    return {
      errors: {
        general:
          "Unable to send your message right now. Please try again later.",
      },
    };
  }
}

const META =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";
const META_ACID =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-acid";
const FIELD_LABEL =
  "block font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";

const CONTACT_CARDS: Array<[string, string]> = [
  ["DIRECT", "HELLO@GLASSD.CA"],
  ["LOCATION", "TORONTO · GMT-5"],
  ["TWITTER", "@DAGLASSD"],
  ["GITHUB", "/GLASSD"],
];

export default function Contact() {
  const data = useActionData<ActionData>();
  const nav = useNavigation();
  const sending = nav.state === "submitting";
  const startedAt = Date.now();

  return (
    <div className="relative px-[18px] pb-6 pt-7 md:px-7 md:pt-9 xl:px-8 xl:pt-12">
      <div className="relative z-[2] mx-auto max-w-[1176px]">
        {/* Section label */}
        <div className="mb-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:mb-9">
          <span className={META}>§ 05 — TRANSMIT</span>
          <div className="hidden h-px flex-1 bg-sd-rule2 md:block" />
          <span className={META}>REPLIES IN ≤ 24H · NO TRACKING</span>
        </div>

        {/* Hero */}
        <h1 className="mb-10 font-sd-display text-[68px] font-bold leading-[0.9] tracking-[-0.03em] text-sd-fg md:mb-14 md:text-[120px] md:leading-[0.86] xl:text-[180px]">
          SAY{" "}
          <span className="text-sd-acid">
            HI<span className="text-sd-fg">.</span>
          </span>
        </h1>

        {/* 2-col body */}
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-12 xl:gap-16">
          {/* Left: direct contact + status */}
          <div>
            <p className="m-0 max-w-[460px] text-[14px] leading-[1.65] text-sd-dim md:text-[16px]">
              Project inquiries, recruiting, or just &ldquo;hey I liked your
              post&rdquo; — all welcome. I read everything and reply within
              a day.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-px border border-sd-rule bg-sd-rule">
              {CONTACT_CARDS.map(([k, v]) => (
                <div key={k} className="relative bg-sd-bg p-[22px]">
                  <div className={`${META_ACID} mb-2`}>{k}</div>
                  <div className="font-sd-mono text-[15px] font-semibold tracking-[0.01em] text-sd-fg md:text-[16px]">
                    {v}
                  </div>
                </div>
              ))}
            </div>

            {/* Status panel */}
            <div className="relative mt-7 border border-sd-acid p-[18px_22px]">
              <span className="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-sd-acid" />
              <span className="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-sd-acid" />
              <div className={`${META_ACID} mb-2`}>STATUS</div>
              <div className="flex items-baseline gap-2 text-[14px] leading-[1.3]">
                <span className="text-sd-acid">●</span>
                <span className="font-sd-display text-[18px] font-semibold leading-[1.2] text-sd-fg md:text-[20px]">
                  OPEN TO NEW PROJECTS — Q3 / Q4 2026
                </span>
              </div>
            </div>
          </div>

          {/* Right: form */}
          <div className="relative border border-sd-rule2 p-6 md:p-8">
            <span className="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-sd-acid" />
            <span className="pointer-events-none absolute -top-px -right-px h-2.5 w-2.5 border-r border-t border-sd-acid" />
            <span className="pointer-events-none absolute -bottom-px -left-px h-2.5 w-2.5 border-b border-l border-sd-acid" />
            <span className="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-sd-acid" />

            <div className={`${META_ACID} mb-6`}>// FORM_001</div>

            {data?.ok ? (
              <div className="border border-sd-acid p-4 font-sd-mono text-[12px] uppercase tracking-[0.06em] text-sd-acid">
                ● TRANSMITTED. THANKS FOR REACHING OUT.
              </div>
            ) : (
              <Form
                method="post"
                replace
                noValidate
                className="flex flex-col gap-[26px]"
              >
                {/* Honeypot */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                />
                <input
                  type="hidden"
                  name="startedAt"
                  value={String(startedAt)}
                />

                <FormField
                  id="email"
                  type="email"
                  number="01"
                  label="EMAIL"
                  placeholder="you@somewhere.com"
                  error={data?.errors?.email}
                  required
                />
                <FormField
                  id="subject"
                  type="text"
                  number="02"
                  label="SUBJECT"
                  placeholder="quick chat about a project"
                  maxLength={200}
                  error={data?.errors?.subject}
                  required
                />
                <FormField
                  id="message"
                  type="textarea"
                  number="03"
                  label="MESSAGE"
                  placeholder="hi david, i'd love to talk about…"
                  maxLength={5000}
                  rows={6}
                  error={data?.errors?.message}
                  required
                />

                {data?.errors?.general && (
                  <div className="border border-sd-acid p-3 font-sd-mono text-[11px] uppercase tracking-[0.06em] text-sd-acid">
                    {data.errors.general}
                  </div>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2 border border-sd-acid bg-sd-acid px-[22px] py-[14px] font-sd-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-sd-bg transition-colors duration-150 hover:bg-sd-fg hover:border-sd-fg disabled:opacity-60"
                  >
                    {sending ? "TRANSMITTING…" : "TRANSMIT ↗"}
                  </button>
                  <span className={META}>⌘ + ENTER</span>
                </div>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  id,
  type,
  number,
  label,
  placeholder,
  error,
  required,
  maxLength,
  rows,
}: {
  id: "email" | "subject" | "message";
  type: "email" | "text" | "textarea";
  number: string;
  label: string;
  placeholder: string;
  error?: string;
  required?: boolean;
  maxLength?: number;
  rows?: number;
}) {
  const base =
    "w-full bg-transparent border-0 border-b border-sd-fg pb-2 pt-1 font-sd-mono text-[16px] text-sd-fg placeholder:text-sd-faint focus:border-sd-acid focus:outline-none transition-colors";

  return (
    <div>
      <label
        htmlFor={id}
        className={`${FIELD_LABEL} mb-2 flex items-baseline gap-2`}
      >
        <span className="text-sd-acid">{number} —</span>
        <span>{label}</span>
      </label>
      {type === "textarea" ? (
        <textarea
          id={id}
          name={id}
          required={required}
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          className={`${base} min-h-[120px] resize-y leading-[1.5]`}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          className={base}
        />
      )}
      {error && (
        <p className="mt-1.5 font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-acid">
          {error}
        </p>
      )}
    </div>
  );
}
