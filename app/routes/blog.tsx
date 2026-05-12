import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/blog";
import { seoMeta } from "~/lib/seo";
import { urlFor } from "~/lib/sanity";

export function meta({}: Route.MetaArgs) {
  return seoMeta({
    title: "Blog - David Glass",
    description:
      "Read my latest blog posts on software development, AI, technology, and more.",
    url: "/blog",
  });
}

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
  tags?: Tag[];
  snippet: string;
  publishedAt?: string | null;
};

const PAGE_SIZE = 10;

const META =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";
const META_DIM =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-dim";

function formatListDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function readMinutes(snippet?: string | null) {
  if (!snippet) return 1;
  const words = snippet.split(/\s+/).filter(Boolean).length;
  // snippet is ~200 chars / 30 words; scale up to a representative full-post estimate.
  return Math.max(2, Math.min(15, Math.round((words / 200) * 60)));
}

function BlogContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialQ = searchParams.get("q") || "";
  const initialTags = (searchParams.get("tags") || "")
    .split(",")
    .filter(Boolean);

  const [posts, setPosts] = useState<Post[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  const initialLoadDone = useRef(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(handle);
  }, [q]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams();
    params.set("offset", "0");
    params.set("limit", String(PAGE_SIZE));
    if (initialQ) params.set("q", initialQ);
    if (initialTags.length > 0) params.set("tags", initialTags.join(","));

    Promise.all([
      fetch(`/api/blog?${params.toString()}`).then((r) => r.json()),
      fetch("/api/blog/tags").then((r) => r.json()),
    ])
      .then(([blogData, tagsData]) => {
        if (cancelled) return;
        setPosts(blogData.posts);
        setNextOffset(blogData.nextOffset);
        setHasMore(blogData.hasMore);
        setAvailableTags(tagsData);
        setLoading(false);
        initialLoadDone.current = true;
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[Blog] Initial fetch failed:", err);
        setError(err?.message || "Unknown error");
        setLoading(false);
        initialLoadDone.current = true;
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("offset", String(nextOffset));
    params.set("limit", String(PAGE_SIZE));
    if (debouncedQ) params.set("q", debouncedQ);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    return params.toString();
  }, [nextOffset, debouncedQ, selectedTags]);

  const linkSuffix = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set("q", debouncedQ);
    if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [debouncedQ, selectedTags]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog?${queryString}`);
      if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
      const fetchedData = await res.json();
      setPosts((prev) => [...prev, ...fetchedData.posts]);
      setNextOffset(fetchedData.nextOffset);
      setHasMore(fetchedData.hasMore);
    } catch (e: any) {
      const msg = e?.message || "Unknown error";
      console.error("[Blog] Error fetching posts:", msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Filter changes (after initial load)
  useEffect(() => {
    if (!initialLoadDone.current) return;

    let cancelled = false;

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("offset", "0");
      params.set("limit", String(PAGE_SIZE));
      if (debouncedQ) params.set("q", debouncedQ);
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

      try {
        const res = await fetch(`/api/blog?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
        const fetchedData = await res.json();
        if (cancelled) return;
        setPosts(fetchedData.posts);
        setNextOffset(fetchedData.nextOffset);
        setHasMore(fetchedData.hasMore);
      } catch (e: any) {
        if (cancelled) return;
        const msg = e?.message || "Unknown error";
        console.error("[Blog] Error fetching posts:", msg);
        setError(msg);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    fetchPosts();

    const newParams = new URLSearchParams();
    if (debouncedQ) newParams.set("q", debouncedQ);
    if (selectedTags.length > 0) newParams.set("tags", selectedTags.join(","));
    setSearchParams(newParams, { replace: true });

    return () => {
      cancelled = true;
    };
  }, [debouncedQ, selectedTags, setSearchParams]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          loadMore();
        }
      },
      { rootMargin: "200px 0px" },
    );
    observerRef.current.observe(sentinelRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, queryString, hasMore]);

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setQ("");
  };

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <>
      {/* Filter bar */}
      <div className="mb-8 flex flex-wrap items-center gap-2 border-y border-sd-rule2 py-4">
        <span className={`${META} mr-2`}>FILTER →</span>
        <button
          type="button"
          onClick={clearFilters}
          className={
            "inline-flex items-center gap-1 border px-2.5 py-[5px] font-sd-mono text-[10px] uppercase tracking-[0.08em] transition-colors " +
            (selectedTags.length === 0 && !debouncedQ
              ? "border-sd-acid bg-sd-acid font-semibold text-sd-bg"
              : "border-sd-rule2 text-sd-dim hover:border-sd-fg hover:text-sd-fg")
          }
        >
          ALL
        </button>
        {availableTags.map((t) => {
          const active = selectedTags.includes(t.slug);
          return (
            <button
              key={t._id}
              type="button"
              onClick={() => toggleTag(t.slug)}
              className={
                "inline-flex items-center gap-1.5 border px-2.5 py-[5px] font-sd-mono text-[10px] uppercase tracking-[0.08em] transition-colors " +
                (active
                  ? "border-sd-acid bg-sd-acid font-semibold text-sd-bg"
                  : "border-sd-rule2 text-sd-dim hover:border-sd-fg hover:text-sd-fg")
              }
            >
              {!active && (
                <span className="inline-block h-1.5 w-1.5 bg-sd-acid" />
              )}
              {t.title.toUpperCase()}
            </button>
          );
        })}
        <div className="hidden flex-1 md:block" />
        <div className="ml-auto flex items-center gap-2 border border-sd-rule2 px-3 py-1.5 md:ml-0">
          <span className="font-sd-mono text-[12px] text-sd-faint">⌕</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search posts..."
            aria-label="Search posts"
            className="w-32 bg-transparent font-sd-mono text-[12px] text-sd-fg placeholder:text-sd-faint focus:outline-none md:w-44"
          />
        </div>
      </div>

      {/* Featured post */}
      {loading && posts.length === 0 ? (
        <FeaturedSkeleton />
      ) : featured ? (
        <FeaturedPost
          post={featured}
          number="001"
          linkSuffix={linkSuffix}
        />
      ) : null}

      {/* More posts list */}
      {rest.length > 0 && (
        <section className="mt-12">
          <div className="mb-[18px] flex items-baseline">
            <span className={`${META} text-sd-acid`}>// MORE POSTS</span>
            <div className="mx-[18px] h-px flex-1 bg-sd-rule2" />
            <span className={META}>{rest.length} ENTRIES</span>
          </div>

          <ol className="m-0 list-none p-0">
            {rest.map((p, i) => (
              <PostRow
                key={p._id}
                post={p}
                number={String(i + 2).padStart(3, "0")}
                linkSuffix={linkSuffix}
              />
            ))}
          </ol>
        </section>
      )}

      {posts.length === 0 && !loading && (
        <div className="mt-12 text-center font-sd-mono text-[12px] uppercase tracking-[0.08em] text-sd-dim">
          NO POSTS MATCH THE FILTER.
        </div>
      )}

      {error && (
        <div className="mt-4 font-sd-mono text-[12px] uppercase tracking-[0.08em] text-sd-acid">
          ERROR LOADING POSTS — {error}
        </div>
      )}

      <div ref={sentinelRef} className="h-10" />

      {loading && posts.length > 0 && (
        <div className={`${META} mt-4 text-center`}>LOADING…</div>
      )}
    </>
  );
}

function FeaturedPost({
  post,
  number,
  linkSuffix,
}: {
  post: Post;
  number: string;
  linkSuffix: string;
}) {
  const date = formatListDate(post.publishedAt);
  const cover = useMemo(() => {
    if (!post.mainImage) return null;
    try {
      return urlFor(post.mainImage).width(900).height(560).fit("crop").url();
    } catch {
      return null;
    }
  }, [post.mainImage]);

  return (
    <Link
      to={`/blog/${post.slug}${linkSuffix}`}
      className="group grid grid-cols-1 gap-6 border border-sd-rule2 p-5 no-underline transition-colors hover:border-sd-fg md:grid-cols-[1fr_1.1fr] md:gap-8 md:p-7"
    >
      <div className="relative aspect-[16/10] overflow-hidden border border-sd-rule2 bg-sd-panel">
        <span className="absolute left-3 top-3 z-10 border border-sd-acid bg-sd-bg px-2 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-acid">
          FEATURED
        </span>
        {cover ? (
          <img
            src={cover}
            alt={post.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-sd-mono text-[11px] uppercase tracking-[0.08em] text-sd-faint">
            NO COVER
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className="font-sd-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-sd-acid">
            № {number}
          </span>
          {date && (
            <span className="font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-dim">
              {date}
            </span>
          )}
          {post.tags?.slice(0, 2).map((t) => (
            <span
              key={t._id}
              className="inline-flex items-center border border-sd-rule2 px-2.5 py-[3px] font-sd-mono text-[10px] uppercase tracking-[0.08em] text-sd-dim"
            >
              {t.title}
            </span>
          ))}
        </div>
        <h2 className="m-0 font-sd-display text-[26px] font-semibold leading-[1.08] text-sd-fg transition-colors group-hover:text-sd-acid md:text-[30px]">
          {post.title}
        </h2>
        {post.snippet && (
          <p className="mt-4 line-clamp-3 text-[14px] leading-[1.65] text-sd-dim md:text-[15px]">
            {post.snippet}
          </p>
        )}
        <span className="mt-auto pt-5 font-sd-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-sd-acid">
          READ ↗
        </span>
      </div>
    </Link>
  );
}

function FeaturedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 border border-sd-rule2 p-5 md:grid-cols-[1fr_1.1fr] md:gap-8 md:p-7">
      <div className="aspect-[16/10] animate-pulse bg-sd-panel" />
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="h-3 w-12 animate-pulse bg-sd-rule" />
          <div className="h-3 w-20 animate-pulse bg-sd-rule" />
        </div>
        <div className="h-7 w-full animate-pulse bg-sd-rule" />
        <div className="h-7 w-3/4 animate-pulse bg-sd-rule" />
        <div className="mt-2 space-y-2">
          <div className="h-3 w-full animate-pulse bg-sd-rule" />
          <div className="h-3 w-5/6 animate-pulse bg-sd-rule" />
          <div className="h-3 w-2/3 animate-pulse bg-sd-rule" />
        </div>
      </div>
    </div>
  );
}

function PostRow({
  post,
  number,
  linkSuffix,
}: {
  post: Post;
  number: string;
  linkSuffix: string;
}) {
  const date = formatListDate(post.publishedAt);
  const tag = post.tags?.[0]?.title;
  const mins = readMinutes(post.snippet);

  return (
    <li className="border-b border-sd-rule">
      <Link
        to={`/blog/${post.slug}${linkSuffix}`}
        className="group grid grid-cols-[60px_1fr] items-baseline gap-x-4 gap-y-1 py-5 no-underline md:grid-cols-[60px_110px_1fr_100px_70px] md:gap-x-6 md:py-[22px]"
      >
        <span className="font-sd-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-sd-acid">
          № {number}
        </span>
        {date && (
          <span
            className={`font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint md:row-start-1 md:col-start-2`}
          >
            {date}
          </span>
        )}
        <h3 className="col-span-2 m-0 font-sd-display text-[22px] font-semibold leading-[1.05] text-sd-fg transition-colors group-hover:text-sd-acid md:col-span-1 md:col-start-3 md:row-start-1 md:text-[26px] xl:text-[28px]">
          {post.title}
        </h3>
        {tag && (
          <span className={`${META_DIM} hidden md:row-start-1 md:col-start-4 md:inline`}>
            {tag}
          </span>
        )}
        <span
          className={`${META} hidden text-right md:row-start-1 md:col-start-5 md:inline`}
        >
          {mins}M ↗
        </span>
      </Link>
    </li>
  );
}

export default function Blog() {
  return (
    <div className="relative px-[18px] pb-6 pt-7 md:px-7 md:pt-9 xl:px-8 xl:pt-12">
      <div className="relative z-[2] mx-auto max-w-[1176px]">
        {/* Section label */}
        <div className="mb-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:mb-9">
          <span className={META}>§ 04 — FIELD NOTES</span>
          <div className="hidden h-px flex-1 bg-sd-rule2 md:block" />
          <span className={META}>UPDATED MONTHLY · NO TRACKING</span>
        </div>

        {/* Hero */}
        <h1 className="mb-10 font-sd-display text-[56px] font-bold leading-[0.92] tracking-[-0.03em] text-sd-fg md:mb-14 md:text-[100px] md:leading-[0.86] xl:text-[156px]">
          WRITING<span className="text-sd-acid">/</span>
        </h1>

        <BlogContent />
      </div>
    </div>
  );
}
