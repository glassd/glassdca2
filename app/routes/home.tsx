import { Link } from "react-router";
import type { Route } from "./+types/home";
import { seoMeta, SITE_URL, SITE_NAME } from "~/lib/seo";
import {
  featuredProjects,
  getSiteSettings,
  latestPosts,
  siteStats,
} from "~/lib/queries.server";
import { CAREER_START_YEAR } from "~/lib/site";
import { urlFor } from "~/lib/sanity";
import { deriveStatus, type ProjectCard } from "~/lib/projects";

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

export function meta(_args: Route.MetaArgs) {
  return [
    ...seoMeta({
      title: "David Glass - Developer Portfolio",
      description:
        "Full-stack developer portfolio showcasing projects, blog posts, and more.",
      url: "/",
    }),
    {
      "script:ld+json": {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
  ];
}

const META =
  "font-sd-mono text-[11px] uppercase tracking-[0.1em] text-sd-faint";
type Stats = {
  years: number;
  projects: number;
  posts: number;
};

export async function loader() {
  const settings = await getSiteSettings();
  try {
    const [posts, stats, featured] = await Promise.all([
      latestPosts(3),
      siteStats(),
      featuredProjects(2),
    ]);
    return { posts, stats, featured, settings, error: false };
  } catch (error: any) {
    console.error("[Home] Failed to load data:", {
      message: error?.message || String(error),
    });
    return {
      posts: null,
      stats: null,
      featured: [],
      settings,
      error: true,
    };
  }
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildStats(
  s: Stats | null,
): Array<{ n: string; label: string; to?: string }> {
  // Every cell has to be a number someone could check. The joke cell that
  // used to sit here made the two load-bearing figures read as decoration.
  return [
    { n: s ? `${s.years} yrs` : "—", label: "IN TECHNOLOGY" },
    {
      n: s ? pad2(s.projects) : "—",
      label: "SHIPPED PROJECTS",
      to: "/projects",
    },
    { n: s ? pad2(s.posts) : "—", label: "ESSAYS PUBLISHED", to: "/blog" },
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

export default function Home({ loaderData }: Route.ComponentProps) {
  const { posts, stats, featured, settings, error } = loaderData;

  const statRows = buildStats(stats);

  return (
    <div className="relative px-[18px] pt-7 pb-6 md:px-7 md:pt-9 xl:px-8 xl:pt-12">
      <div className="relative z-[2] mx-auto max-w-[1376px]">
        {/* Top meta strip */}
        <div className="mb-7 flex flex-wrap items-center gap-x-[18px] gap-y-2 md:mb-9">
          {settings.available && (
            <span className="inline-flex items-center gap-[6px] border border-sd-rule2 px-[10px] py-[5px] font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-dim">
              <span className="inline-block h-1.5 w-1.5 animate-sd-pulse rounded-full bg-sd-acid" />
              {settings.availabilityLabel}
            </span>
          )}
          <span className={META}>IN TECHNOLOGY SINCE {CAREER_START_YEAR}</span>
          <div className="hidden h-px flex-1 bg-sd-rule2 md:block" />
          <span className={`${META} hidden md:inline`}>
            FULL-STACK · IC · REMOTE-FIRST
          </span>
        </div>

        {/* Hero */}
        <div>
          <span className={`${META} mb-3 block md:mb-4`}>
            INTRODUCTION
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
            shipping <span className="italic text-sd-acid">
              opinionated
            </span>{" "}
            software
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
              SEND A MESSAGE
            </Link>
          </div>
        </div>

        {/* Stats row — hairline-divided cells keep the visual rhythm even
            when values vary in width ("11 yrs" vs "04"). Numbers use
            tabular-nums + whitespace-nowrap so they neither re-flow nor
            visually shift as the digit counts change. */}
        <div className="mt-12 grid grid-cols-1 gap-px border border-sd-rule bg-sd-rule sm:grid-cols-3 xl:mt-16">
          {statRows.map(({ n, label, to }) => {
            const cell = (
              <>
                <div
                  className="whitespace-nowrap font-sd-display text-[40px] font-bold leading-none text-sd-acid md:text-[44px] xl:text-[64px]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {n}
                </div>
                <div className={`${META} mt-2`}>
                  {label}
                  {to && <span className="ml-1.5 text-sd-acid">→</span>}
                </div>
              </>
            );
            const cellClass =
              "flex flex-col bg-sd-bg px-4 py-5 md:px-5 md:py-6 xl:px-7 xl:py-7";
            return to ? (
              <Link
                key={label}
                to={to}
                className={`${cellClass} no-underline transition-colors duration-150 hover:bg-sd-panel`}
              >
                {cell}
              </Link>
            ) : (
              <div key={label} className={cellClass}>
                {cell}
              </div>
            );
          })}
        </div>

        {/* Selected work — sits above the writing because the page's
            job is to show what has been built, and a visitor should hit
            evidence without a second scroll. */}
        {featured.length > 0 && (
          <section className="mt-12 xl:mt-16">
            <div className="mb-[22px] flex items-baseline">
              <span className={META}>SELECTED WORK</span>
              <div className="mx-[18px] h-px flex-1 bg-sd-rule2" />
              <Link
                to="/projects"
                className={`${META} text-sd-acid hover:underline`}
              >
                ALL PROJECTS ↗
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-px border border-sd-rule bg-sd-rule md:grid-cols-2">
              {featured.map((p: ProjectCard, i: number) => (
                <FeaturedProject key={p._id} project={p} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Latest dispatches */}
        <section className="mt-10">
          <div className="mb-[22px] flex items-baseline">
            <span className={META}>LATEST DISPATCHES</span>
            <div className="mx-[18px] h-px flex-1 bg-sd-rule2" />
            <Link to="/blog" className={`${META} text-sd-acid hover:underline`}>
              VIEW ALL ↗
            </Link>
          </div>

          {error || posts === null ? (
            <div className="grid place-items-center border border-sd-rule2 py-12 text-center">
              <span className={`${META} text-sd-acid`}>
                § ERR — DISPATCHES UNAVAILABLE · TRY AGAIN SHORTLY
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((p: Post, i: number) => (
                <DispatchCard key={p._id} post={p} index={i} />
              ))}
            </div>
          )}
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
      <div className="mb-4 flex items-center gap-3">
        <span className="font-sd-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-sd-acid">
          № {num}
        </span>
        {date && <span className={META}>{date}</span>}
        <span className="flex-1" />
        {primaryTag && (
          <span className="inline-flex items-center border border-sd-rule2 px-2.5 py-[3px] font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-dim">
            {primaryTag}
          </span>
        )}
      </div>

      <h3 className="m-0 font-sd-display text-[26px] font-semibold leading-[1.05] text-sd-fg transition-colors duration-150 group-hover:text-sd-acid">
        {post.title}
      </h3>

      {post.snippet && (
        <p className="mb-0 mt-3 line-clamp-2 text-[13px] leading-[1.6] text-sd-dim">
          {post.snippet}
        </p>
      )}

      <div className="mt-5 flex items-center gap-2">
        <span className={META}>READ →</span>
      </div>
    </Link>
  );
}

function coverUrl(project: ProjectCard): string | null {
  if (!project.mainImage) return null;
  try {
    return urlFor(project.mainImage).width(1200).height(750).fit("crop").url();
  } catch {
    return null;
  }
}

function FeaturedProject({
  project,
  index,
}: {
  project: ProjectCard;
  index: number;
}) {
  const cover = coverUrl(project);
  const status = deriveStatus(project);
  const num = String(index + 1).padStart(2, "0");

  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group flex flex-col bg-sd-bg p-5 no-underline transition-colors duration-150 hover:bg-[#0e0e0e] md:p-6 xl:p-7"
    >
      <div
        className="relative aspect-[16/10] w-full overflow-hidden border border-sd-rule2 bg-sd-panel bg-cover bg-center"
        style={
          project.mainImage?.lqip
            ? { backgroundImage: `url(${project.mainImage.lqip})` }
            : undefined
        }
      >
        {cover && (
          <img
            src={cover}
            alt={project.mainImage?.alt || project.title}
            /* Above the fold on desktop — see the project index for the
               same reasoning. */
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            width={1200}
            height={750}
            className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
          />
        )}
      </div>

      <div className="mt-5 flex flex-1 flex-col">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className={`${META} font-semibold text-sd-acid`}>№ {num}</span>
          <span className="flex-1" />
          <span
            className={
              "inline-flex items-center border px-2.5 py-[3px] font-sd-mono text-[11px] uppercase tracking-[0.08em] " +
              status.color
            }
          >
            {status.label}
          </span>
        </div>

        <h3 className="m-0 font-sd-display text-[28px] font-bold leading-[1] tracking-[-0.02em] text-sd-fg transition-colors group-hover:text-sd-acid md:text-[34px]">
          {project.title}
        </h3>

        {project.description && (
          <p className="mt-3 line-clamp-2 text-[14px] leading-[1.6] text-sd-dim">
            {project.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-5">
          <span className={`${META} font-semibold text-sd-acid`}>
            READ CASE STUDY →
          </span>
        </div>
      </div>
    </Link>
  );
}
