import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/home";
import { seoMeta, SITE_URL, SITE_NAME } from "~/lib/seo";
import { urlFor } from "~/lib/sanity";

type Tag = {
  _id: string;
  title: string;
  slug: string;
};

type Post = {
  _id: string;
  title: string;
  slug: string;
  mainImage?: any;
  publishedAt?: string;
  tags?: Tag[];
  snippet: string;
};

export function meta({}: Route.MetaArgs) {
  return [
    ...seoMeta({
      title: "David Glass - Developer Portfolio",
      description:
        "Full-stack developer portfolio showcasing projects, blog posts, and more.",
      url: "/",
    }),
    {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      }),
    },
  ];
}

const META =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";
const META_LIGHT =
  "font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-dim";

const MARQUEE_TOKENS = [
  "SHIP SMALL",
  "REACT",
  "TYPESCRIPT",
  "POSTGRES",
  "THINK LOUD",
  "TAILWIND",
  "AWS",
  "MIGRATE OFTEN",
  "GRAPHQL",
  "NODE",
  "MEDITATE",
  "BUILD WEIRD STUFF",
];

type Stats = {
  years: number;
  projects: number;
  posts: number;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildStats(s: Stats | null): Array<[string, string]> {
  return [
    [s ? `${s.years} yrs` : "—", "BUILDING SOFTWARE"],
    [s ? pad2(s.projects) : "—", "SHIPPED PROJECTS"],
    [s ? pad2(s.posts) : "—", "ESSAYS PUBLISHED"],
    ["∞", "CUPS OF COFFEE"],
  ];
}

function formatDispatchDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}.${yy}`;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/blog/latest")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) =>
        console.error("[Home] Failed to fetch latest posts:", err),
      );
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.years === "number") setStats(data);
      })
      .catch((err) =>
        console.error("[Home] Failed to fetch stats:", err),
      );
  }, []);

  const statRows = buildStats(stats);

  return (
    <div className="relative px-[18px] pt-7 pb-6 md:px-7 md:pt-9 xl:px-8 xl:pt-12">
      <div className="relative z-[2] mx-auto max-w-[1376px]">
        {/* Top meta strip */}
        <div className="mb-7 flex flex-wrap items-center gap-x-[18px] gap-y-2 md:mb-9">
          <span className="inline-flex items-center gap-[6px] border border-sd-rule2 px-[10px] py-[5px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-dim">
            <span className="inline-block h-1.5 w-1.5 animate-sd-pulse rounded-full bg-sd-acid" />
            AVAILABLE NOW
          </span>
          <span className={META}>EST. 2024</span>
          <div className="hidden h-px flex-1 bg-sd-rule2 md:block" />
          <span className={`${META} hidden md:inline`}>
            FULL-STACK · IC · REMOTE-FIRST
          </span>
        </div>

        {/* Hero */}
        <div>
          <span className={`${META} mb-3 block md:mb-4`}>
            § 01 — INTRODUCTION
          </span>
          <h1 className="mt-0 font-sd-display text-[68px] font-bold leading-[0.88] tracking-[-0.03em] text-sd-fg md:text-[100px] md:leading-[0.86] xl:text-[144px]">
            DAVID
            <br />
            GLASS<span className="text-sd-acid">.</span>
          </h1>
        </div>

        {/* Subheading row */}
        <div className="mt-7 grid grid-cols-1 items-end gap-7 md:mt-9 md:grid-cols-[1fr_minmax(220px,280px)] md:gap-8 xl:grid-cols-[1.1fr_1fr_minmax(260px,320px)] xl:gap-10">
          <h2 className="font-sd-display text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-sd-fg md:text-[28px] md:leading-[1.05] xl:text-[32px]">
            Full-stack engineer
            <br />
            shipping{" "}
            <span className="italic text-sd-acid">opinionated</span> software
            <br />
            on the open web.
          </h2>
          <p className="m-0 max-w-[380px] text-[14px] leading-[1.65] text-sd-dim md:col-start-1 md:col-end-2 xl:col-start-2 xl:col-end-3">
            Ex-IT operator turned product builder, based in Toronto. I design
            and ship end-to-end web apps, write essays about AI &amp; systems,
            and care a lot about keeping things small.
          </p>
          <div className="flex flex-col gap-[10px] md:col-start-2 md:row-start-1 md:row-end-3 md:items-stretch md:justify-end xl:col-start-3">
            <Link
              to="/projects"
              className="inline-flex items-center justify-center bg-sd-acid px-[22px] py-[14px] font-sd-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-sd-bg no-underline transition-colors duration-150 hover:bg-sd-fg"
            >
              VIEW WORK ↗
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center border border-sd-fg bg-transparent px-[22px] py-[14px] font-sd-mono text-[12px] uppercase tracking-[0.08em] text-sd-fg no-underline transition-colors duration-150 hover:bg-sd-fg hover:text-sd-bg"
            >
              SCHEDULE CALL
            </Link>
          </div>
        </div>

        {/* Stats row — hairline-divided cells keep the visual rhythm
            even when individual values vary in width ("14 yrs" vs "∞").
            Numbers use tabular-nums + whitespace-nowrap so they neither
            re-flow nor visually shift as the digit counts change. */}
        <div className="mt-12 grid grid-cols-2 gap-px border border-sd-rule bg-sd-rule md:grid-cols-4 xl:mt-16">
          {statRows.map(([n, l]) => (
            <div
              key={l}
              className="flex flex-col bg-sd-bg px-4 py-5 md:px-5 md:py-6 xl:px-7 xl:py-7"
            >
              <div
                className="whitespace-nowrap font-sd-display text-[40px] font-bold leading-none text-sd-acid md:text-[44px] xl:text-[64px]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {n}
              </div>
              <div className={`${META} mt-2`}>{l}</div>
            </div>
          ))}
        </div>

        {/* Marquee — edges fade to bg so the loop has no visible seam,
            especially on wide / ultrawide where the content reveals
            empty space at the wrap point. Fade width is a % of the
            track so it scales naturally up through ultrawide. */}
        <div
          className="-mx-[18px] mt-9 overflow-hidden border-y border-sd-rule2 md:-mx-7 xl:-mx-8"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)",
          }}
        >
          <div className="flex w-max animate-sd-marquee whitespace-nowrap py-3.5 [animation-play-state:running] hover:[animation-play-state:paused]">
            {[...MARQUEE_TOKENS, ...MARQUEE_TOKENS].map((t, i) => (
              <span
                key={`${t}-${i}`}
                className={
                  "mr-12 shrink-0 font-sd-display text-[24px] font-semibold md:text-[28px] xl:text-[32px] " +
                  (i % 4 === 2 ? "text-sd-acid" : "text-sd-fg")
                }
              >
                {t}{" "}
                <span className="mx-3 font-normal text-sd-faint">●</span>
              </span>
            ))}
          </div>
        </div>

        {/* Latest dispatches */}
        <section className="mt-10">
          <div className="mb-[22px] flex items-baseline">
            <span className={META}>§ 02 — LATEST DISPATCHES</span>
            <div className="mx-[18px] h-px flex-1 bg-sd-rule2" />
            <Link
              to="/blog"
              className={`${META} text-sd-acid hover:underline`}
            >
              VIEW ALL ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {posts === null
              ? [0, 1, 2].map((i) => (
                  <DispatchSkeleton key={i} delay={i * 0.15} />
                ))
              : posts.map((p, i) => (
                  <DispatchCard key={p._id} post={p} index={i} />
                ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DispatchCard({ post, index }: { post: Post; index: number }) {
  const date = formatDispatchDate(post.publishedAt);
  const num = String(index + 1).padStart(3, "0");
  const primaryTag = post.tags?.[0]?.title;

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group relative block border border-sd-rule2 bg-sd-bg p-[22px] no-underline transition-colors duration-150 hover:border-sd-fg"
    >
      {/* Corner ticks */}
      <span className="pointer-events-none absolute -left-px -top-px h-2.5 w-2.5 border-l border-t border-sd-acid" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-2.5 w-2.5 border-b border-r border-sd-acid" />

      <div className="mb-4 flex items-center gap-3">
        <span className="font-sd-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-sd-acid">
          № {num}
        </span>
        {date && <span className={META}>{date}</span>}
        <span className="flex-1" />
        {primaryTag && (
          <span className="inline-flex items-center border border-sd-rule2 px-2.5 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-dim">
            {primaryTag}
          </span>
        )}
      </div>

      <h3 className="m-0 font-sd-display text-[26px] font-semibold leading-[1.05] text-sd-fg transition-colors duration-150 group-hover:text-sd-acid">
        {post.title}
      </h3>

      <div className="mt-5 flex items-center gap-2">
        <span className={META}>READ →</span>
      </div>
    </Link>
  );
}

function DispatchSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="relative animate-fade-in border border-sd-rule2 bg-sd-bg p-[22px]"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2 w-10 animate-pulse bg-sd-rule" />
        <div className="h-2 w-16 animate-pulse bg-sd-rule" />
        <span className="flex-1" />
        <div className="h-4 w-12 animate-pulse bg-sd-rule" />
      </div>
      <div className="space-y-2">
        <div className="h-6 w-full animate-pulse bg-sd-rule" />
        <div className="h-6 w-3/4 animate-pulse bg-sd-rule" />
      </div>
      <div className="mt-5 h-2 w-12 animate-pulse bg-sd-rule" />
    </div>
  );
}
