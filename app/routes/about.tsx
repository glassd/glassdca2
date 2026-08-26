import type { Route } from "./+types/about";
import { seoMeta } from "~/lib/seo";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "About Me - David Glass",
    description:
      "Learn more about David Glass, a full-stack developer passionate about building software and exploring technology.",
    url: "/about",
  });
}

const META =
  "font-sd-mono text-[11px] uppercase tracking-[0.1em] text-sd-faint";
const META_ACID =
  "font-sd-mono text-[11px] uppercase tracking-[0.1em] text-sd-acid";

const TIMELINE: Array<[string, string]> = [
  ["2011", "Started CS degree."],
  ["2015", 'Took the first "real" job — in IT, not dev.'],
  ["2018", "Promoted into systems & network ops."],
  ["2023", "Quit ops. Started writing software again, full-time."],
  ["2024", "Launched glassd.ca · v1."],
  ["2026", "Rebuilt the site from scratch. You are here."],
];

const ELSEWHERE: Array<{ label: string; href: string }> = [
  { label: "GITHUB / GLASSD ↗", href: "https://github.com/glassd" },
  { label: "TWITTER / @DAGLASSD ↗", href: "https://x.com/daglassd" },
  {
    label: "LINKEDIN / /IN/GLASSD ↗",
    href: "https://www.linkedin.com/in/glassd",
  },
  {
    label: "EMAIL — HELLO@GLASSD.CA ↗",
    href: "mailto:hello@glassd.ca",
  },
];

export default function About() {
  return (
    <div className="relative px-[18px] pb-6 pt-7 md:px-7 md:pt-9 xl:px-8 xl:pt-12">
      <div className="relative z-[2] mx-auto max-w-[1176px]">
        {/* Section label */}
        <div className="mb-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:mb-9">
          <span className={META}>ON THE AUTHOR</span>
          <div className="hidden h-px flex-1 bg-sd-rule2 md:block" />
          <span className={META}>6 MIN · UPDATED 2026.05</span>
        </div>

        {/* Hero */}
        <h1 className="mb-10 font-sd-display text-[56px] font-bold leading-[0.92] tracking-[-0.03em] text-sd-fg md:mb-14 md:text-[88px] md:leading-[0.88] xl:text-[132px]">
          JUST LIKES
          <br />
          BUILDING
          <br />
          <span className="text-sd-acid">
            THINGS<span className="text-sd-fg">.</span>
          </span>
        </h1>

        {/* Body: bio + aside */}
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[1fr_320px] md:gap-16 xl:gap-[64px]">
          {/* Bio */}
          <div className="text-[15px] leading-[1.7] text-sd-dim md:text-[17px]">
            <p className="m-0">
              <span className="font-medium text-sd-fg">
                For a long time, I was happy enough to show up, do my job, and
                go home.
              </span>{" "}
              Lately, that doesn&apos;t feel like enough. The world&apos;s
              changing too fast to just sit in the passenger seat, so this is me
              trying to get back behind the wheel.
            </p>
            <p className="my-[22px]">
              I went to school for software development, fully expecting to
              write code for a living. Like most plans, that didn&apos;t quite
              survive contact with reality. I ended up in IT, managing systems,
              building networks, and keeping other people&apos;s stuff running.
            </p>
            <p className="my-[22px]">
              A couple of years ago I made the jump back to what I really wanted
              to do: building software. That&apos;s what led to this site.
            </p>
            <p className="my-[22px]">
              I&apos;m especially interested in AI right now — how it can
              actually be useful, where it goes off the rails, and what it means
              for the way we work and live. I&apos;ll keep building, breaking
              things, and writing about what I learn.
            </p>
          </div>

          {/* Aside: timeline + elsewhere */}
          <aside className="md:border-l md:border-sd-rule2 md:pl-7 xl:pl-7">
            <div className={`${META_ACID} mb-4`}>// TIMELINE</div>
            <ol className="m-0 list-none p-0">
              {TIMELINE.map(([y, t], i) => (
                <li
                  key={y}
                  className={
                    "grid grid-cols-[60px_1fr] items-baseline gap-4 py-2.5 " +
                    (i === 0 ? "" : "border-t border-sd-rule")
                  }
                >
                  <span
                    className={`font-sd-mono text-[11px] uppercase tracking-[0.1em] text-sd-acid`}
                  >
                    {y}
                  </span>
                  <span className="text-[14px] text-sd-fg">{t}</span>
                </li>
              ))}
            </ol>

            <div className={`${META_ACID} mb-3.5 mt-8`}>// ELSEWHERE</div>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {ELSEWHERE.map((it) => (
                <li key={it.label}>
                  <a
                    href={it.href}
                    target={it.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      it.href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="block border border-sd-rule2 px-2.5 py-2 font-sd-mono text-[11px] uppercase tracking-[0.1em] text-sd-fg no-underline transition-colors hover:border-sd-acid hover:text-sd-acid"
                  >
                    {it.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
