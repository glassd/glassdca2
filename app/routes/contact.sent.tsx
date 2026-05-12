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

const META =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";

export default function ContactSent() {
  return (
    <div className="relative px-[18px] pb-6 pt-7 md:px-7 md:pt-9 xl:px-8 xl:pt-12">
      <div className="relative z-[2] mx-auto max-w-[1176px]">
        {/* Section label */}
        <div className="mb-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:mb-9">
          <span className={META}>§ 05.01 — TRANSMITTED</span>
          <div className="hidden h-px flex-1 bg-sd-rule2 md:block" />
          <span className={META}>EXPECT REPLY ≤ 24H</span>
        </div>

        {/* Hero */}
        <h1 className="mb-10 font-sd-display text-[56px] font-bold leading-[0.92] tracking-[-0.03em] text-sd-fg md:mb-14 md:text-[100px] md:leading-[0.86] xl:text-[140px]">
          <span className="text-sd-acid">●</span> MESSAGE
          <br />
          DELIVERED<span className="text-sd-acid">.</span>
        </h1>

        <p className="mb-10 max-w-[640px] text-[15px] leading-[1.7] text-sd-dim md:text-[17px]">
          Thanks for reaching out. Your message was delivered and I&apos;ll
          get back to you as soon as I can — usually within a day.
        </p>

        <div className="grid grid-cols-1 gap-3 md:flex md:flex-wrap md:gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-sd-acid px-[22px] py-[14px] font-sd-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-sd-bg transition-colors duration-150 hover:bg-sd-fg"
          >
            BACK TO HOME ↗
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center border border-sd-fg bg-transparent px-[22px] py-[14px] font-sd-mono text-[12px] uppercase tracking-[0.08em] text-sd-fg transition-colors duration-150 hover:bg-sd-fg hover:text-sd-bg"
          >
            SEND ANOTHER
          </Link>
          <Link
            to="/blog"
            className="inline-flex items-center justify-center border border-sd-rule2 bg-transparent px-[22px] py-[14px] font-sd-mono text-[12px] uppercase tracking-[0.08em] text-sd-dim transition-colors duration-150 hover:border-sd-fg hover:text-sd-fg"
          >
            READ THE BLOG ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
