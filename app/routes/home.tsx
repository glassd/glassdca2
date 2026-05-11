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

const STATS: Array<[string, string]> = [
  ["14 yrs", "BUILDING SOFTWARE"],
  ["08", "SHIPPED PROJECTS"],
  ["47", "ESSAYS PUBLISHED"],
  ["∞", "CUPS OF COFFEE"],
];

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

  useEffect(() => {
    fetch("/api/blog/latest")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) =>
        console.error("[Home] Failed to fetch latest posts:", err),
      );
  }, []);

  return (
    <div className="relative px-8 pt-12 pb-6">
      <div className="relative z-[2] mx-auto max-w-[1376px]">
        {/* Top meta strip */}
        <div className="mb-9 flex items-center gap-[18px]">
          <span className="inline-flex items-center gap-[6px] border border-sd-rule2 px-[10px] py-[5px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-dim">
            <span className="inline-block h-1.5 w-1.5 animate-sd-pulse rounded-full bg-sd-acid" />
            AVAILABLE NOW
          </span>
          <span className={META}>EST. 2024</span>
          <div className="h-px flex-1 bg-sd-rule2" />
          <span className={META}>FULL-STACK · IC · REMOTE-FIRST</span>
        </div>

        {/* Hero */}
        <div className="relative">
          <span className={`${META} absolute left-0 top-2`}>
            § 01 — INTRODUCTION
          </span>
          <h1 className="mt-0 font-sd-display text-[120px] font-bold leading-[0.86] tracking-[-0.03em] text-sd-fg">
            DAVID
            <br />
            GLASS<span className="text-sd-acid">.</span>
          </h1>
        </div>

        {/* Subheading row */}
        <div className="mt-9 grid grid-cols-[1fr_1fr_320px] items-end gap-10">
          <h2 className="font-sd-display text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-sd-fg">
            Full-stack engineer
            <br />
            shipping{" "}
            <span className="italic text-sd-acid">opinionated</span> software
            <br />
            on the open web.
          </h2>
          <p className="m-0 max-w-[380px] text-[14px] leading-[1.65] text-sd-dim">
            Ex-IT operator turned product builder, based in Toronto. I design
            and ship end-to-end web apps, write essays about AI &amp; systems,
            and care a lot about keeping things small.
          </p>
          <div className="flex flex-col gap-[10px]">
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

        {/* Stats row */}
        <div className="mt-16 grid grid-cols-4 gap-6 border-t border-sd-rule pt-[22px]">
          {STATS.map(([n, l]) => (
            <div key={l}>
              <div className="font-sd-display text-[64px] font-bold leading-none text-sd-acid">
                {n}
              </div>
              <div className={`${META} mt-2`}>{l}</div>
            </div>
          ))}
        </div>

        {/* Marquee */}
        <div className="mt-9 -mx-8 overflow-hidden border-y border-sd-rule2">
          <div className="flex animate-sd-marquee gap-12 whitespace-nowrap py-3.5 [animation-play-state:running] hover:[animation-play-state:paused]">
            {[...MARQUEE_TOKENS, ...MARQUEE_TOKENS].map((t, i) => (
              <span
                key={`${t}-${i}`}
                className={
                  "shrink-0 font-sd-display text-[32px] font-semibold " +
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

          <div className="grid grid-cols-3 gap-6">
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
