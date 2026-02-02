import type { Route } from "./+types/contact.sent";
import { seoMeta } from "~/lib/seo";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    ...seoMeta({
      title: "Message Sent - David Glass",
      description: "Your message has been sent successfully.",
      url: "/contact/sent",
    }),
    { name: "robots", content: "noindex" },
  ];
}

export default function ContactSent() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-2xl">
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 7L9 18l-5-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Message sent
            </h1>
            <p className="mt-2 text-muted-foreground">
              Thanks for reaching out. Your message was delivered, and I'll get
              back to you as soon as I can.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-xl gradient-bg px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-2.5 font-medium text-foreground hover:bg-card transition-colors"
        >
          Send another message
        </Link>
        <Link
          to="/blog"
          className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-2.5 font-medium text-foreground hover:bg-card transition-colors"
        >
          View the blog
        </Link>
      </div>
    </div>
  );
}
