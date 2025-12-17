import { useLoaderData, useLocation } from "react-router";
import type { Route } from "./+types/blog.$slug";
import { client } from "../lib/sanity";
import { urlFor } from "../lib/sanity";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { useMemo, useEffect, useState } from "react";
import TagChips from "../components/TagChips";
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
};

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Missing slug", { status: 400 });
  }

  const query = `*[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    mainImage,
    publishedAt,
    "tags": tags[]->{ _id, title, "slug": slug.current },
    bodyMarkdown,
    excerpt
  }`;

  const post = await client.fetch<Post | null>(query, { slug });
  if (!post) {
    throw new Response("Post not found", { status: 404 });
  }

  return Response.json(post, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}

export function meta({ data }: Route.MetaArgs) {
  const post = data as Post | undefined;
  const title = post?.title ? `${post.title} · Blog` : "Blog Post";
  const description = (post?.excerpt || "").trim() || "Read this blog post.";

  // Build absolute canonical and image URLs when PUBLIC_SITE_URL is provided
  const path = post?.slug ? `/blog/${post.slug}` : "/blog";
  const site =
    (typeof process !== "undefined" &&
      (process as any).env &&
      (process as any).env.PUBLIC_SITE_URL) ||
    "";
  const canonical = site ? new URL(path, site).toString() : path;

  const rawImage = post?.mainImage
    ? urlFor(post.mainImage).width(1200).height(630).fit("crop").url()
    : undefined;
  const ogImage =
    rawImage && site ? new URL(rawImage, site).toString() : rawImage;

  const meta: any[] = [
    { title },
    { name: "description", content: description },
    // Canonical
    { tagName: "link", rel: "canonical", href: canonical },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:url", content: canonical },
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
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

  return meta;
}

export default function BlogPostRoute() {
  const post: Post = useLoaderData<typeof loader>();
  const prettyDate = formatDate(post.publishedAt);

  const hero = useMemo(() => {
    if (!post.mainImage) return null;
    try {
      return urlFor(post.mainImage).width(1200).height(600).fit("crop").url();
    } catch {
      return null;
    }
  }, [post.mainImage]);

  // Helpers for heading anchors and query param handling
  const location = useLocation();
  const initialParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  const [q, setQ] = useState<string>(initialParams.get("q") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    (initialParams.get("tags") || "").split(",").filter(Boolean),
  );

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/blog/tags`, {
          headers: { "Cache-Control": "no-store" },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setAvailableTags(data || []);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const backLink = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (selectedTags.length) p.set("tags", selectedTags.join(","));
    const s = p.toString();
    return s ? `/blog?${s}` : "/blog";
  }, [q, selectedTags]);

  const linkSuffix = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (selectedTags.length) p.set("tags", selectedTags.join(","));
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [q, selectedTags]);

  function slugify(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }
  function extractText(node: any): string {
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (typeof node === "string") return node;
    if (node && typeof node === "object" && "props" in node) {
      return extractText((node as any).props?.children);
    }
    return "";
  }

  type TocItem = { id: string; text: string; level: number };
  const toc: TocItem[] = useMemo(() => {
    const items: TocItem[] = [];
    const md = post.bodyMarkdown || "";
    for (const line of md.split("\n")) {
      const m = line.match(/^(#{1,6})\s+(.*)$/);
      if (m) {
        const level = m[1].length;
        const raw = m[2].replace(/#+\s*$/, "").trim();
        if (!raw) continue;
        items.push({ id: slugify(raw), text: raw, level });
      }
    }
    return items;
  }, [post.bodyMarkdown]);

  const [readNext, setReadNext] = useState<Post[]>([]);
  useEffect(() => {
    const tagsForNext =
      selectedTags.length > 0
        ? selectedTags
        : (post.tags || []).map((t) => t.slug);
    const params = new URLSearchParams();
    params.set("offset", "0");
    params.set("limit", "5");
    if (tagsForNext.length) params.set("tags", tagsForNext.join(","));
    (async () => {
      try {
        const res = await fetch(`/api/blog?${params.toString()}`, {
          headers: { "Cache-Control": "no-store" },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list: Post[] = (data?.posts || []).filter(
          (p: Post) => p.slug !== post.slug,
        );
        setReadNext(list);
      } catch {}
    })();
  }, [post.slug, post.tags, selectedTags]);

  const mdComponents = useMemo(
    () => ({
      h1: (props: any) => {
        const id = slugify(extractText(props.children || ""));
        return (
          <h1
            {...props}
            id={id || undefined}
            className="mt-8 text-3xl font-bold text-gray-900 dark:text-white"
          />
        );
      },
      h2: (props: any) => {
        const id = slugify(extractText(props.children || ""));
        return (
          <h2
            {...props}
            id={id || undefined}
            className="mt-8 text-2xl font-semibold text-gray-900 dark:text-white"
          />
        );
      },
      h3: (props: any) => {
        const id = slugify(extractText(props.children || ""));
        return (
          <h3
            {...props}
            id={id || undefined}
            className="mt-6 text-xl font-semibold text-gray-900 dark:text-white"
          />
        );
      },
      p: (props: any) => (
        <p
          {...props}
          className="my-4 leading-7 text-gray-800 dark:text-gray-200"
        />
      ),
      ul: (props: any) => (
        <ul
          {...props}
          className="my-4 list-disc pl-6 space-y-1 text-gray-800 dark:text-gray-200"
        />
      ),
      ol: (props: any) => (
        <ol
          {...props}
          className="my-4 list-decimal pl-6 space-y-1 text-gray-800 dark:text-gray-200"
        />
      ),
      li: (props: any) => <li {...props} className="leading-7" />,
      code: (props: any) => (
        <code
          {...props}
          className="rounded bg-gray-100 dark:bg-gray-800 px-1 py-0.5 text-sm text-gray-900 dark:text-gray-100"
        />
      ),
      pre: (props: any) => (
        <pre
          {...props}
          className="my-4 overflow-x-auto rounded-md bg-gray-900 p-4 text-gray-100"
        />
      ),
      a: (props: any) => {
        const isExternal =
          typeof props.href === "string" && /^https?:\/\//.test(props.href);
        return (
          <a
            {...props}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="text-indigo-600 underline decoration-indigo-300 hover:decoration-indigo-500 dark:text-indigo-400"
          />
        );
      },
      img: (props: any) => (
        // Images embedded via the Markdown plugin will often be Sanity CDN URLs
        // We just give them nice defaults.
        <img
          {...props}
          loading="lazy"
          className="my-6 max-h-[600px] w-full rounded-md object-contain"
          alt={props.alt || ""}
        />
      ),
      blockquote: (props: any) => (
        <blockquote
          {...props}
          className="my-6 border-l-4 border-indigo-300/60 pl-4 italic text-gray-700 dark:text-gray-300"
        />
      ),
      hr: (props: any) => (
        <hr {...props} className="my-8 border-gray-200 dark:border-gray-800" />
      ),
      table: (props: any) => (
        <div className="my-6 overflow-x-auto">
          <table {...props} className="min-w-full border-collapse text-sm" />
        </div>
      ),
      th: (props: any) => (
        <th
          {...props}
          className="border-b border-gray-300 bg-gray-50 px-3 py-2 text-left font-medium dark:border-gray-700 dark:bg-gray-800"
        />
      ),
      td: (props: any) => (
        <td
          {...props}
          className="border-b border-gray-200 px-3 py-2 align-top dark:border-gray-800"
        />
      ),
    }),
    [],
  );

  return (
    <article className="container mx-auto max-w-8xl px-4 py-20">
      <nav className="mb-6 text-sm">
        <a
          href={backLink}
          className="inline-flex items-center text-indigo-600 hover:underline dark:text-indigo-400"
        >
          ← Back to Blog
        </a>
        <div className="mt-2 text-gray-500 dark:text-gray-400">
          <a href={backLink} className="hover:underline">
            Blog
          </a>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-300">{post.title}</span>
        </div>
      </nav>
      {/* Content + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {/* Title + meta */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold leading-tight text-gray-900 dark:text-white">
              {post.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {prettyDate && (
                <time className="text-gray-500 dark:text-gray-400">
                  {prettyDate}
                </time>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <a
                      key={t._id}
                      href={`/blog?tags=${encodeURIComponent(t.slug)}`}
                      className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      #{t.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Hero image */}
          {hero && (
            <div className="mb-8 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              <img
                src={hero}
                alt={post.title}
                className="h-auto w-full object-cover"
                loading="eager"
              />
            </div>
          )}
          <section className="prose prose-indigo max-w-none dark:prose-invert">
            {post.bodyMarkdown ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={mdComponents as any}
              >
                {post.bodyMarkdown}
              </ReactMarkdown>
            ) : (
              <p className="text-gray-700 dark:text-gray-300">
                This post has no content yet.
              </p>
            )}
          </section>
        </div>
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-8">
            <div>
              <label htmlFor="post-search" className="sr-only">
                Search posts
              </label>
              <input
                id="post-search"
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search posts..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <a
                href={backLink}
                className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View results →
              </a>
            </div>

            <div>
              <TagChips
                tags={availableTags}
                selected={selectedTags}
                onToggle={(slug) =>
                  setSelectedTags((prev) =>
                    prev.includes(slug)
                      ? prev.filter((s) => s !== slug)
                      : [...prev, slug],
                  )
                }
                onClear={() => {
                  setSelectedTags([]);
                  setQ("");
                }}
                label="Filter by tags"
              />
            </div>

            {toc.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Table of contents
                </h2>
                <ul className="space-y-1 text-sm">
                  {toc.map((item, idx) => (
                    <li
                      key={idx}
                      style={{
                        paddingLeft: `${Math.min(item.level - 1, 3) * 12}px`,
                      }}
                    >
                      <a
                        href={`#${item.id}`}
                        className="text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {readNext.length > 0 && (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Read next
                </h2>
                <ul className="space-y-2">
                  {readNext.map((p) => (
                    <li key={p._id}>
                      <a
                        href={`/blog/${p.slug}${linkSuffix}`}
                        className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        {p.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
