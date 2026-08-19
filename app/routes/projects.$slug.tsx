import { useMemo } from "react";
import { Link, data, useLoaderData } from "react-router";
import type { Route } from "./+types/projects.$slug";
import ReactMarkdown from "react-markdown";
import { urlFor } from "../lib/sanity";
import { getProject } from "~/lib/queries.server";
import {
  SITE_URL,
  SITE_NAME,
  TWITTER_HANDLE,
  DEFAULT_OG_IMAGE,
} from "~/lib/seo";
import { POST_REMARK_PLUGINS, POST_REHYPE_PLUGINS } from "../lib/markdown";
import {
  buildHeadings,
  buildImageIndex,
  useMarkdownComponents,
} from "../lib/markdown-render";
import { deriveStatus, projectYear, type ProjectDetail } from "../lib/projects";

type MoreProject = { _id: string; title: string; slug: string };

type LoaderData = {
  project: ProjectDetail;
  more: MoreProject[];
};

export function headers(_args: Route.HeadersArgs) {
  return {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
  };
}

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Missing slug", { status: 400 });
  }

  const result = await getProject(slug);
  if (!result) {
    throw new Response("Project not found", { status: 404 });
  }

  return data(result, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
    },
  });
}

export function meta({ data: loaderData }: Route.MetaArgs) {
  const project = (loaderData as LoaderData | undefined)?.project;
  const title = project?.title ? `${project.title} — Project` : "Project";
  const description =
    (project?.description || "").trim() ||
    "A project by David Glass — what it does, how it's built, and what it cost to get there.";
  const canonical = `${SITE_URL}/projects/${project?.slug ?? ""}`;

  let ogImage = DEFAULT_OG_IMAGE;
  if (project?.mainImage) {
    try {
      ogImage = urlFor(project.mainImage)
        .width(1200)
        .height(630)
        .fit("crop")
        .url();
    } catch {
      /* fall back to the site default */
    }
  }

  const meta: any[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:image", content: ogImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ];

  const workLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project?.title ?? title,
    description,
    url: project?.liveUrl || canonical,
    image: ogImage,
    applicationCategory: "WebApplication",
    author: { "@type": "Person", name: SITE_NAME, url: SITE_URL },
  };
  if (project?.stack?.length) {
    workLd.keywords = project.stack.join(", ");
  }
  if (project?.publishedAt) {
    workLd.datePublished = project.publishedAt;
  }
  meta.push({ "script:ld+json": workLd });

  meta.push({
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Projects",
          item: `${SITE_URL}/projects`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: project?.title ?? "Project",
          item: canonical,
        },
      ],
    },
  });

  return meta;
}

const META =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";
const META_ACID =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-acid";

export default function ProjectDetailRoute() {
  const { project, more } = useLoaderData<typeof loader>() as LoaderData;

  const hero = useMemo(() => {
    if (!project.mainImage) return null;
    try {
      return urlFor(project.mainImage)
        .width(1600)
        .height(900)
        .fit("crop")
        .url();
    } catch {
      return null;
    }
  }, [project.mainImage]);

  const gallery = useMemo(() => {
    if (!project.gallery?.length) return [];
    return project.gallery
      .map((img, i) => {
        try {
          return {
            key: img._key ?? String(i),
            src: urlFor(img).width(1600).height(1000).fit("crop").url(),
            alt: img.alt || "",
            caption: img.caption || img.alt || "",
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<{
      key: string;
      src: string;
      alt: string;
      caption: string;
    }>;
  }, [project.gallery]);

  const md = project.bodyMarkdown || "";
  const headings = useMemo(() => buildHeadings(md), [md]);
  const headingNumById = useMemo(
    () => new Map(headings.map((h) => [h.id, h.num])),
    [headings],
  );
  // The hero takes FIG. 01 when present, so body images start after it.
  const imgFigs = useMemo(() => buildImageIndex(md, hero ? 2 : 1), [md, hero]);
  const mdComponents = useMarkdownComponents(headingNumById, imgFigs);

  // Gallery plates continue the sequence after the hero and any body images.
  const galleryFigStart = (hero ? 1 : 0) + imgFigs.size + 1;

  const status = deriveStatus(project);
  const year = projectYear(project.publishedAt);
  const heroAlt = project.mainImage?.alt || project.title;

  const specs: Array<[string, string]> = [];
  if (project.role) specs.push(["ROLE", project.role]);
  if (project.timeframe) specs.push(["TIMEFRAME", project.timeframe]);
  if (year) specs.push(["YEAR", year]);
  specs.push(["STATUS", status.label]);

  return (
    <div className="relative px-[18px] pb-6 pt-5 md:px-7 md:pt-6 xl:px-8 xl:pt-7">
      <div className="relative z-[2] mx-auto max-w-[1176px]">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 md:gap-3.5">
          <Link
            to="/projects"
            className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-acid hover:underline"
          >
            ← PROJECTS
          </Link>
          {year && (
            <>
              <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-faint">
                /
              </span>
              <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-dim">
                {year}
              </span>
            </>
          )}
          <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-faint">
            /
          </span>
          <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-fg">
            {project.slug}
          </span>
          <div className="ml-3 hidden h-px flex-1 bg-sd-rule2 xl:block" />
          <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-faint">
            § PROJECTS / CASE STUDY
          </span>
        </div>

        {/* Header */}
        <header className="mb-9">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className={
                "inline-flex items-center border px-2.5 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] " +
                status.color
              }
            >
              {status.label}
            </span>
            {project.timeframe && (
              <span className={META}>{project.timeframe}</span>
            )}
          </div>

          <h1 className="mb-[22px] font-sd-display text-[44px] font-bold leading-[0.92] tracking-[-0.03em] text-sd-fg md:text-[60px] md:leading-[0.9] xl:text-[76px]">
            {project.title}
          </h1>

          {project.description && (
            <p className="m-0 max-w-[680px] font-sd-display text-[20px] font-normal leading-[1.45] tracking-[-0.01em] text-sd-dim">
              {project.description}
            </p>
          )}
        </header>

        {/* Hero */}
        {hero && (
          <figure className="mb-10">
            <div className="relative aspect-[16/9] overflow-hidden border border-sd-rule2 bg-sd-panel">
              <span className="absolute left-3 top-3 z-10 border border-sd-acid bg-sd-bg px-2 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-acid">
                FIG. 01
              </span>
              <img
                src={hero}
                alt={heroAlt}
                className="h-full w-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <figcaption className="mt-[10px] flex gap-3 font-sd-mono text-[11px] uppercase tracking-[0.06em] text-sd-faint">
              <span className="text-sd-acid">FIG. 01</span>
              <span>{project.mainImage?.alt || project.title}</span>
            </figcaption>
          </figure>
        )}

        {/* Body + spec sidebar */}
        <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[minmax(0,1fr)_280px] xl:gap-14">
          <div className="min-w-0">
            {project.bodyMarkdown ? (
              <article className="sd-post-body">
                <ReactMarkdown
                  remarkPlugins={POST_REMARK_PLUGINS}
                  rehypePlugins={POST_REHYPE_PLUGINS as any}
                  components={mdComponents as any}
                >
                  {project.bodyMarkdown}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="border border-sd-rule2 p-6">
                <div className={`${META_ACID} mb-3`}>// WRITE-UP PENDING</div>
                <p className="m-0 max-w-[560px] text-[15px] leading-[1.65] text-sd-dim">
                  The full case study for this one isn&apos;t written yet. The
                  spec and links are below in the meantime.
                </p>
              </div>
            )}

            {project.outcome && (
              <section className="mt-12 border-t border-sd-rule2 pt-7">
                <div className={`${META_ACID} mb-4`}>// OUTCOME</div>
                <p className="m-0 max-w-[680px] font-sd-display text-[22px] font-medium leading-[1.35] tracking-[-0.01em] text-sd-fg">
                  {project.outcome}
                </p>
              </section>
            )}

            {/* Gallery */}
            {gallery.length > 0 && (
              <section className="mt-12 border-t border-sd-rule2 pt-7">
                <div className={`${META_ACID} mb-5`}>// GALLERY</div>
                <div className="flex flex-col gap-9">
                  {gallery.map((img, i) => {
                    const fig = String(galleryFigStart + i).padStart(2, "0");
                    return (
                      <figure key={img.key} className="m-0">
                        <div className="relative overflow-hidden border border-sd-rule2 bg-sd-panel">
                          <span className="absolute left-3 top-3 z-10 border border-sd-acid bg-sd-bg px-2 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-acid">
                            FIG. {fig}
                          </span>
                          <img
                            src={img.src}
                            alt={img.alt}
                            loading="lazy"
                            className="block h-auto w-full"
                          />
                        </div>
                        {img.caption && (
                          <figcaption className="mt-[10px] flex gap-3 font-sd-mono text-[11px] uppercase tracking-[0.06em] text-sd-faint">
                            <span className="text-sd-acid">FIG. {fig}</span>
                            <span>{img.caption}</span>
                          </figcaption>
                        )}
                      </figure>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Spec sheet — external links live here rather than as the
              primary action, so the case study gets read first. */}
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <div className={`${META_ACID} mb-3`}>// SPEC</div>
            <dl className="m-0 grid grid-cols-1 gap-px border border-sd-rule bg-sd-rule">
              {specs.map(([k, v]) => (
                <div key={k} className="bg-sd-bg px-4 py-3">
                  <dt className={META}>{k}</dt>
                  <dd className="m-0 mt-1.5 text-[14px] leading-[1.45] text-sd-fg">
                    {v}
                  </dd>
                </div>
              ))}
            </dl>

            {project.stack && project.stack.length > 0 && (
              <>
                <div className={`${META_ACID} mb-3 mt-7`}>// STACK</div>
                <div className="flex flex-wrap gap-1.5">
                  {project.stack.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center border border-sd-rule2 px-2 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-dim"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </>
            )}

            {(project.liveUrl || project.githubUrl) && (
              <>
                <div className={`${META_ACID} mb-3 mt-7`}>// ELSEWHERE</div>
                <div className="flex flex-col gap-2">
                  {project.liveUrl && (
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-sd-rule2 px-[10px] py-2 font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-fg no-underline transition-colors hover:border-sd-acid hover:text-sd-acid"
                    >
                      VISIT LIVE SITE ↗
                    </a>
                  )}
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-sd-rule2 px-[10px] py-2 font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-fg no-underline transition-colors hover:border-sd-acid hover:text-sd-acid"
                    >
                      READ THE SOURCE ↗
                    </a>
                  )}
                </div>
              </>
            )}

            <div className={`${META_ACID} mb-3 mt-7`}>// WORK WITH ME</div>
            <Link
              to="/contact"
              className="inline-flex w-full items-center justify-center bg-sd-acid px-4 py-[11px] font-sd-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-sd-bg no-underline transition-colors duration-150 hover:bg-sd-fg"
            >
              GET IN TOUCH ↗
            </Link>
          </aside>
        </div>

        {/* More work */}
        {more.length > 0 && (
          <div className="mt-16 grid grid-cols-1 gap-px border border-sd-rule bg-sd-rule md:grid-cols-2">
            {more.map((p, i) => (
              <Link
                key={p._id}
                to={`/projects/${p.slug}`}
                className="bg-sd-bg px-[22px] py-5 no-underline transition-colors duration-150 hover:bg-sd-panel"
              >
                <div className={META}>
                  MORE WORK — {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-[10px] font-sd-display text-[20px] font-semibold leading-[1.1] text-sd-fg">
                  {p.title}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
