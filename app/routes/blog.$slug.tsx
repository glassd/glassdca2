import { useEffect, useMemo, useRef, useState } from "react";
import { Link, data, useLoaderData } from "react-router";
import type { Route } from "./+types/blog.$slug";
import { client } from "../lib/sanity";
import { urlFor } from "../lib/sanity";
import {
  SITE_URL,
  SITE_NAME,
  TWITTER_HANDLE,
  DEFAULT_OG_IMAGE,
} from "~/lib/seo";
import ReactMarkdown from "react-markdown";
import { POST_REMARK_PLUGINS, POST_REHYPE_PLUGINS } from "../lib/markdown";
import {
  buildHeadings,
  buildImageIndex,
  estimateReadMinutes,
  useMarkdownComponents,
  wordCount,
} from "../lib/markdown-render";

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
  publishedAt?: string | null;
  tags?: Tag[];
  bodyMarkdown?: string | null;
  excerpt?: string | null;
  author?: { name?: string | null } | null;
};

type RelatedPost = {
  _id: string;
  title: string;
  slug: string;
};

type LoaderData = {
  post: Post;
  allTags: Tag[];
  relatedPosts: RelatedPost[];
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

  const postQuery = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    mainImage,
    publishedAt,
    "tags": tags[]->{ _id, title, "slug": slug.current },
    bodyMarkdown,
    excerpt,
    "author": author->{ name },
    "tagSlugs": tags[]->slug.current
  }`;

  const tagsQuery = `*[_type == "tag"] | order(title asc) { _id, title, "slug": slug.current }`;

  const [post, allTags] = await Promise.all([
    client.fetch<(Post & { tagSlugs?: string[] }) | null>(postQuery, { slug }),
    client.fetch<Tag[]>(tagsQuery),
  ]);

  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }

  const tagSlugs = post.tagSlugs ?? [];
  delete (post as any).tagSlugs;

  let relatedPosts: RelatedPost[] = [];
  if (tagSlugs.length > 0) {
    const relatedQuery = `*[
      _type == "post" &&
      defined(publishedAt) &&
      slug.current != $slug &&
      count(tags[@->slug.current in $tagSlugs]) > 0
    ] | order(publishedAt desc) [0...5] {
      _id,
      title,
      "slug": slug.current
    }`;
    relatedPosts = await client.fetch<RelatedPost[]>(relatedQuery, {
      slug,
      tagSlugs,
    });
  }

  return data(
    { post, allTags, relatedPosts },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    },
  );
}

export function meta({ data }: Route.MetaArgs) {
  const loaderData = data as { post: Post } | undefined;
  const post = loaderData?.post;
  const title = post?.title ? `${post.title} · Blog` : "Blog Post";
  const description = (post?.excerpt || "").trim() || "Read this blog post.";

  const canonical = `${SITE_URL}/blog/${post?.slug ?? ""}`;

  const rawImage = post?.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).fit("crop").url()
    : undefined;
  const ogImage = rawImage ?? DEFAULT_OG_IMAGE;

  const meta: any[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];

  if (ogImage) {
    meta.push({ property: "og:image", content: ogImage });
    meta.push({ name: "twitter:image", content: ogImage });
  }
  if (post?.publishedAt) {
    meta.push({
      property: "article:published_time",
      content: post.publishedAt,
    });
  }
  if (post?.tags && post.tags.length) {
    for (const t of post.tags) {
      if (t?.title) {
        meta.push({ property: "article:tag", content: t.title });
      }
    }
  }

  const blogPostingLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post?.title ?? title,
    description,
    url: canonical,
    author: { "@type": "Person", name: post?.author?.name || SITE_NAME },
  };
  if (post?.publishedAt) blogPostingLd.datePublished = post.publishedAt;
  if (ogImage) blogPostingLd.image = ogImage;
  meta.push({ "script:ld+json": blogPostingLd });

  meta.push({
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${SITE_URL}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post?.title ?? "Post",
          item: canonical,
        },
      ],
    },
  });

  return meta;
}

function formatBreadcrumbDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}

function formatPubDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

const META =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";

export default function BlogPostRoute() {
  const { post, relatedPosts } = useLoaderData<typeof loader>() as LoaderData;

  const hero = useMemo(() => {
    if (!post.mainImage) return null;
    try {
      return urlFor(post.mainImage).width(1600).height(685).fit("crop").url();
    } catch {
      return null;
    }
  }, [post.mainImage]);

  const md = post.bodyMarkdown || "";
  const headings = useMemo(() => buildHeadings(md), [md]);
  const headingNumById = useMemo(
    () => new Map(headings.map((h) => [h.id, h.num])),
    [headings],
  );
  const imgFigs = useMemo(() => buildImageIndex(md, hero ? 2 : 1), [md, hero]);

  const articleRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(
    headings[0]?.id ?? null,
  );
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = articleRef.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      setProgress(total > 0 ? Math.min(1, scrolled / total) : 0);

      let current: string | null = headings[0]?.id ?? null;
      for (const h of headings) {
        const node = document.getElementById(h.id);
        if (!node) continue;
        if (node.getBoundingClientRect().top - 120 <= 0) current = h.id;
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [headings]);

  const sectionsDone = useMemo(() => {
    if (!activeId) return 0;
    const idx = headings.findIndex((h) => h.id === activeId);
    return idx < 0 ? 0 : idx + 1;
  }, [activeId, headings]);
  const sectionsTotal = headings.length;

  const mdComponents = useMarkdownComponents(headingNumById, imgFigs);

  const year = formatBreadcrumbDate(post.publishedAt);
  const pubDate = formatPubDate(post.publishedAt);
  const readMin = estimateReadMinutes(md);
  const words = wordCount(md);
  const heroAlt = post.mainImage?.alt || post.title;
  const heroFigCaption = post.mainImage?.alt || post.title || "cover image";

  const authorName = post.author?.name || SITE_NAME;
  const initials =
    authorName
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "DG";

  const [prevPost, nextPost] = [
    relatedPosts[0] ?? null,
    relatedPosts[1] ?? null,
  ];

  return (
    <div className="relative px-[18px] pb-6 pt-5 md:px-7 md:pt-6 xl:px-8 xl:pt-7">
      <div className="relative z-[2]">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 md:gap-3.5">
          <Link
            to="/blog"
            className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-acid hover:underline"
          >
            ← BLOG
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
          {post.tags?.slice(0, 2).map((t) => (
            <span key={t._id} className="flex items-baseline gap-3 md:gap-3.5">
              <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-faint">
                /
              </span>
              <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-dim">
                {t.title}
              </span>
            </span>
          ))}
          <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-faint">
            /
          </span>
          <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-fg">
            {post.slug}.MD
          </span>
          <div className="ml-3 hidden h-px flex-1 bg-sd-rule2 xl:block" />
          <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-faint">
            § BLOG / POST
          </span>
        </div>

        {/* Mobile: collapsible TOC accordion */}
        {headings.length > 0 && (
          <details className="mb-6 border border-sd-rule2 xl:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-acid">
              <span>// CONTENTS</span>
              <span className="text-sd-faint">▾</span>
            </summary>
            <ol className="m-0 list-none p-0">
              {headings.map((h) => (
                <li key={h.id + h.num} className="border-t border-sd-rule">
                  <a
                    href={`#${h.id}`}
                    className={
                      "flex items-baseline gap-3 px-4 py-2.5 no-underline " +
                      (h.level === 3 ? "pl-10 " : "") +
                      (h.id === activeId ? "text-sd-fg" : "text-sd-dim")
                    }
                  >
                    <span
                      className={
                        "font-sd-mono text-[10px] tracking-[0.08em] " +
                        (h.id === activeId ? "text-sd-acid" : "text-sd-faint") +
                        (h.level === 3 ? " invisible" : "")
                      }
                    >
                      {h.num}
                    </span>
                    <span className="text-[13px]">{h.text}</span>
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        {/* Grid: TOC | article | meta — collapses by breakpoint */}
        <div className="mx-auto grid max-w-[1176px] grid-cols-1 items-start gap-8 md:grid-cols-[160px_minmax(0,1fr)] md:gap-10 xl:grid-cols-[180px_720px_180px] xl:gap-12">
          {/* Left: TOC (hidden on mobile, used at md+) */}
          <aside className="sticky top-6 hidden self-start md:block">
            <div className={`${META} text-sd-acid mb-3`}>// CONTENTS</div>
            <div>
              {headings.map((h) => {
                const active = h.id === activeId;
                const sub = h.level === 3;
                return (
                  <a
                    key={h.id + h.num}
                    href={`#${h.id}`}
                    className={
                      "grid cursor-pointer items-baseline gap-3 border-t border-sd-rule py-[9px] transition-colors duration-150 " +
                      (sub ? "pl-6 " : "") +
                      "grid-cols-[24px_1fr]"
                    }
                  >
                    <span
                      className={
                        "font-sd-mono text-[10px] tracking-[0.08em] " +
                        (active ? "text-sd-acid" : "text-sd-faint") +
                        (sub ? " invisible" : "")
                      }
                    >
                      {h.num}
                    </span>
                    <span
                      className={
                        "text-[13px] leading-[1.4] " +
                        (active ? "text-sd-fg" : "text-sd-dim")
                      }
                    >
                      {h.text}
                    </span>
                  </a>
                );
              })}
              <div className="border-t border-sd-rule" />
            </div>

            {sectionsTotal > 0 && (
              <div className="mt-[22px]">
                <div className={META}>READ PROGRESS</div>
                <div className="relative mt-2 h-1 bg-sd-rule">
                  <div
                    className="absolute inset-y-0 left-0 bg-sd-acid"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <div className={`${META} mt-2 text-sd-faint`}>
                  {Math.round(progress * 100)}% · {sectionsDone} of{" "}
                  {sectionsTotal} sections
                </div>
              </div>
            )}
          </aside>

          {/* Middle: article */}
          <div className="min-w-0">
            <header className="mb-8">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                {pubDate && (
                  <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-dim">
                    {pubDate}
                  </span>
                )}
                {post.tags?.map((t) => (
                  <span
                    key={t._id}
                    className="inline-flex items-center border border-sd-rule2 px-2.5 py-[5px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-dim"
                  >
                    {t.title}
                  </span>
                ))}
                <span className="flex-1" />
                {readMin != null && (
                  <span className={META}>
                    {readMin} MIN · {words.toLocaleString()} WORDS
                  </span>
                )}
              </div>

              <h1 className="mb-[22px] font-sd-display text-[44px] font-bold leading-[0.92] tracking-[-0.03em] text-sd-fg md:text-[60px] md:leading-[0.9] xl:text-[76px]">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="m-0 max-w-[680px] font-sd-display text-[20px] font-normal leading-[1.45] tracking-[-0.01em] text-sd-dim">
                  {post.excerpt}
                </p>
              )}
            </header>

            {hero && (
              <figure className="mb-10">
                <div className="relative aspect-[21/9] overflow-hidden border border-sd-rule2 bg-sd-panel">
                  <span className="absolute left-3 top-3 z-10 border border-sd-acid bg-sd-bg px-2 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-acid">
                    FIG. 01
                  </span>
                  <img
                    src={hero}
                    alt={heroAlt}
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                </div>
                <figcaption className="mt-[10px] flex gap-3 font-sd-mono text-[11px] uppercase tracking-[0.06em] text-sd-faint">
                  <span className="text-sd-acid">FIG. 01</span>
                  <span>{heroFigCaption}</span>
                </figcaption>
              </figure>
            )}

            <article ref={articleRef} className="sd-post-body">
              {post.bodyMarkdown ? (
                <ReactMarkdown
                  remarkPlugins={POST_REMARK_PLUGINS}
                  rehypePlugins={POST_REHYPE_PLUGINS as any}
                  components={mdComponents as any}
                >
                  {post.bodyMarkdown}
                </ReactMarkdown>
              ) : (
                <p>This post has no content yet.</p>
              )}
              <p
                className="mt-9 border-t border-sd-rule2 pt-[18px] font-sd-mono text-[13px] uppercase tracking-[0.06em] text-sd-faint"
                style={{ maxWidth: 680 }}
              >
                // END · POSTED FROM TORONTO · {words.toLocaleString()} WORDS
              </p>
            </article>

            {/* Prev / Next from related posts */}
            {(prevPost || nextPost) && (
              <div className="mt-14 grid grid-cols-2 gap-px border border-sd-rule bg-sd-rule">
                {prevPost ? (
                  <Link
                    to={`/blog/${prevPost.slug}`}
                    className="bg-sd-bg px-[22px] py-5 no-underline transition-colors duration-150 hover:bg-sd-panel"
                  >
                    <div className={META}>← PREV</div>
                    <div className="mt-[10px] font-sd-display text-[20px] font-semibold leading-[1.1] text-sd-fg">
                      {prevPost.title}
                    </div>
                  </Link>
                ) : (
                  <div className="bg-sd-bg" />
                )}
                {nextPost ? (
                  <Link
                    to={`/blog/${nextPost.slug}`}
                    className="bg-sd-bg px-[22px] py-5 text-right no-underline transition-colors duration-150 hover:bg-sd-panel"
                  >
                    <div className={META}>NEXT →</div>
                    <div className="mt-[10px] font-sd-display text-[20px] font-semibold leading-[1.1] text-sd-fg">
                      {nextPost.title}
                    </div>
                  </Link>
                ) : (
                  <div className="bg-sd-bg" />
                )}
              </div>
            )}
          </div>

          {/* Right: meta sidebar (desktop only) */}
          <aside className="sticky top-6 hidden self-start xl:block">
            <div className={`${META} text-sd-acid mb-3`}>// AUTHOR</div>
            <div className="flex items-center gap-3 border-y border-sd-rule2 py-3">
              <div className="flex h-10 w-10 items-center justify-center bg-sd-acid font-sd-display text-[18px] font-bold text-sd-bg">
                {initials}
              </div>
              <div>
                <div className="text-sm font-semibold text-sd-fg">
                  {authorName}
                </div>
                <div className={`${META} mt-[2px]`}>FULL-STACK · TORONTO</div>
              </div>
            </div>

            <div className={`${META} text-sd-acid mt-6 mb-3`}>// SHARE</div>
            <ShareButtons title={post.title} slug={post.slug} />

            {relatedPosts.length > 0 && (
              <>
                <div className={`${META} text-sd-acid mt-7 mb-3`}>
                  // READ NEXT
                </div>
                <ol className="m-0 list-none p-0 text-sm leading-[1.55] text-sd-dim">
                  {relatedPosts.map((p, i) => (
                    <li
                      key={p._id}
                      className="border-t border-sd-rule py-2 last:border-b"
                    >
                      <Link
                        to={`/blog/${p.slug}`}
                        className="flex items-baseline gap-2 text-sd-fg no-underline hover:underline"
                      >
                        <span className="font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-acid">
                          [{String(i + 1).padStart(2, "0")}]
                        </span>
                        <span className="text-[12px] text-sd-dim">
                          {p.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  // Always derive share URLs from the canonical site URL so SSR and
  // hydration produce identical href attributes. The clipboard "Copy
  // link" action reads window.location at click time instead.
  const url = `${SITE_URL}/blog/${slug}`;

  const onCopy = async () => {
    if (typeof navigator === "undefined") return;
    const href = typeof window !== "undefined" ? window.location.href : url;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const items: Array<{ label: string; href?: string; onClick?: () => void }> = [
    { label: copied ? "COPIED ✓" : "COPY LINK", onClick: onCopy },
    {
      label: "POST TO X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        title,
      )}&url=${encodeURIComponent(url)}`,
    },
    {
      label: "POST TO LINKEDIN",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url,
      )}`,
    },
    {
      label: "EMAIL A FRIEND",
      href: `mailto:?subject=${encodeURIComponent(
        title,
      )}&body=${encodeURIComponent(url)}`,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {items.map((it) =>
        it.href ? (
          <a
            key={it.label}
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-sd-rule2 px-[10px] py-2 font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-fg no-underline transition-colors hover:border-sd-acid hover:text-sd-acid"
          >
            {it.label} ↗
          </a>
        ) : (
          <button
            key={it.label}
            type="button"
            onClick={it.onClick}
            className="border border-sd-rule2 px-[10px] py-2 text-left font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-fg transition-colors hover:border-sd-acid hover:text-sd-acid"
          >
            {it.label} ↗
          </button>
        ),
      )}
    </div>
  );
}
