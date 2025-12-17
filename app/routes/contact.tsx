import type { Route } from "./+types/contact";
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
  return [
    { title: "Contact Me" },
    { name: "description", content: "Get in touch with me." },
  ];
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
  const company = String(form.get("company") || "").trim(); // honeypot field - should be blank
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

  // Optional origin hardening (if PUBLIC_SITE_URL is set)
  const publicSiteUrl = (process as any)?.env?.PUBLIC_SITE_URL;
  if (!originAllowed(request, publicSiteUrl)) {
    console.warn(`[contact:${reqId}] origin not allowed`, {
      publicSiteUrl,
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    });
    return { errors: { general: "Unable to process request." } };
  }

  // Honeypot trap and basic bot signals
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

  // Validation
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

  // Abuse protections: rate limit + duplicate throttle
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

  // Send email via SMTP relay (no auth)
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

export default function Contact() {
  const data = useActionData<ActionData>();
  const nav = useNavigation();
  const sending = nav.state === "submitting";
  const startedAt = Date.now();

  return (
    <div className="container mx-auto px-4 py-30 max-w-2xl">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
        Contact Me
      </h1>

      {data?.ok ? (
        <div className="rounded-md border border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/30 p-4 text-green-800 dark:text-green-200">
          Thanks! Your message has been sent.
        </div>
      ) : (
        <Form method="post" replace className="space-y-4" noValidate>
          {/* Honeypot (hidden) */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
          />

          {/* Started-at timestamp for anti-bot timing */}
          <input type="hidden" name="startedAt" value={String(startedAt)} />

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Your email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {data?.errors?.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {data.errors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Subject
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              maxLength={200}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {data?.errors?.subject && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {data.errors.subject}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={8}
              maxLength={5000}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {data?.errors?.message && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {data.errors.message}
              </p>
            )}
          </div>

          {data?.errors?.general && (
            <div className="rounded-md border border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/30 p-3 text-red-800 dark:text-red-200">
              {data.errors.general}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send message"}
            </button>
          </div>
        </Form>
      )}
    </div>
  );
}
