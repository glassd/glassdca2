import { useMemo } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/projects";
import { seoMeta } from "~/lib/seo";
import { urlFor } from "../lib/sanity";
import { listProjects } from "~/lib/queries.server";
import {
  deriveStatus,
  projectYear,
  type ProjectCard as Project,
} from "../lib/projects";

export function meta(_args: Route.MetaArgs) {
  return seoMeta({
    title: "Projects - David Glass",
    description:
      "Explore my development projects and see what I've been building.",
    url: "/projects",
  });
}

const META =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";
const META_ACID =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-acid";

export async function loader() {
  try {
    const projects = await listProjects();
    return { projects: Array.isArray(projects) ? projects : [], error: null };
  } catch (error: any) {
    console.error("[Projects] Failed to load:", {
      message: error?.message || String(error),
    });
    return { projects: [], error: error?.message || "Unknown error" };
  }
}

export default function Projects({ loaderData }: Route.ComponentProps) {
  const { projects, error } = loaderData;

  const count = projects.length;

  return (
    <div className="relative px-[18px] pb-6 pt-7 md:px-7 md:pt-9 xl:px-8 xl:pt-12">
      <div className="relative z-[2] mx-auto max-w-[1176px]">
        {/* Section label */}
        <div className="mb-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:mb-9">
          <span className={META}>§ 03 — WORK</span>
          <div className="hidden h-px flex-1 bg-sd-rule2 md:block" />
          <span className={META}>
            {count > 0
              ? `${String(count).padStart(2, "0")} SELECTED · MORE IN GITHUB`
              : "MORE IN GITHUB"}
          </span>
        </div>

        {/* Hero */}
        <h1 className="mb-12 font-sd-display text-[68px] font-bold leading-[0.9] tracking-[-0.03em] text-sd-fg md:mb-14 md:text-[120px] md:leading-[0.86] xl:text-[156px]">
          BUILT<span className="text-sd-acid">.</span>
        </h1>

        {projects.length === 0 ? (
          <div className="grid place-items-center border border-sd-rule2 py-16 text-center">
            <span className={META}>
              {error
                ? `LOAD FAILED — ${error.toUpperCase()}`
                : "NO PROJECTS YET"}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px border border-sd-rule bg-sd-rule xl:grid-cols-2">
            {projects.map((p: Project, i: number) => (
              <ProjectCard key={p._id} project={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cover = useMemo(() => {
    if (!project.mainImage) return null;
    try {
      return urlFor(project.mainImage).width(960).height(600).fit("crop").url();
    } catch {
      return null;
    }
  }, [project.mainImage]);

  const num = String(index + 1).padStart(2, "0");
  const yr = projectYear(project.publishedAt);
  const status = deriveStatus(project);

  // The whole card is one internal link. Live-site and source links used
  // to sit here and sent visitors off-domain before they'd read anything;
  // they now live on the case study itself.
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="group flex flex-col bg-sd-bg p-5 no-underline transition-colors duration-150 hover:bg-[#0e0e0e] md:flex-row md:gap-6 md:p-6 xl:flex-col xl:p-7"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border border-sd-rule2 bg-sd-panel md:w-[220px] md:shrink-0 md:self-start xl:w-full">
        {cover ? (
          <img
            src={cover}
            alt={project.mainImage?.alt || project.title}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-90"
          />
        ) : (
          <DiagonalStripePattern />
        )}
        <span className="absolute left-2.5 top-2.5 z-10 border border-sd-acid bg-sd-bg px-2 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-acid">
          FIG. {num}
        </span>
      </div>

      {/* Body */}
      <div className="mt-5 flex min-w-0 flex-1 flex-col md:mt-0 xl:mt-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className={`${META_ACID} font-semibold`}>№ {num}</span>
          {yr && <span className={META}>{yr}</span>}
          <span className="flex-1" />
          <span
            className={
              "inline-flex items-center border px-2.5 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] " +
              status.color
            }
          >
            {status.label}
          </span>
        </div>

        <h2 className="m-0 font-sd-display text-[28px] font-bold leading-[1] tracking-[-0.02em] text-sd-fg transition-colors group-hover:text-sd-acid md:text-[36px] xl:text-[44px]">
          {project.title}
        </h2>

        {project.description && (
          <p className="mt-5 line-clamp-4 text-[14px] leading-[1.6] text-sd-dim">
            {project.description}
          </p>
        )}

        {project.stack && project.stack.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <span
                key={s}
                className="inline-flex items-center border border-sd-rule2 px-2 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-dim"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center gap-2 pt-6">
          <span className={`${META_ACID} font-semibold`}>
            READ CASE STUDY →
          </span>
        </div>
      </div>
    </Link>
  );
}

function DiagonalStripePattern() {
  return (
    <svg
      viewBox="0 0 400 250"
      preserveAspectRatio="none"
      className="h-full w-full opacity-30"
      aria-hidden
    >
      <defs>
        <pattern
          id="sd-stripe"
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(35)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke="var(--sd-acid)"
            strokeWidth="0.6"
          />
        </pattern>
      </defs>
      <rect width="400" height="250" fill="url(#sd-stripe)" />
    </svg>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="relative px-[18px] pb-6 pt-7 md:px-7 md:pt-9 xl:px-8 xl:pt-12">
      <div className="relative z-[2] mx-auto max-w-[1176px]">
        <h1 className="mb-6 font-sd-display text-[56px] font-bold leading-[0.92] tracking-[-0.03em] text-sd-fg">
          BUILT<span className="text-sd-acid">.</span>
        </h1>
        <div className="border border-sd-acid p-5 font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-acid">
          LOAD FAILED — {error?.message || "UNKNOWN ERROR"}
        </div>
      </div>
    </div>
  );
}
