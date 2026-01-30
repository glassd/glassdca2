import { useEffect, useMemo, useRef, useState } from "react";
import { data, useLoaderData, useSearchParams } from "react-router";
import type { Route } from "./+types/blog";
import BlogCard from "../components/BlogCard";
import TagChips from "../components/TagChips";
import { client } from "../lib/sanity";
import { stripMarkdown, truncateAtWord } from "../lib/utils";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Blog" },
    { name: "description", content: "Read my latest blog posts." },
  ];
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

type InitialData = {
  posts: Post[];
  tags: Tag[];
  total: number;
  hasMore: boolean;
  nextOffset: number;
};

const PAGE_SIZE = 10;

export function headers({}: Route.HeadersArgs) {
  return {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
  };
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const qRaw = (url.searchParams.get("q") || "").trim();
  const tagSlugs = (url.searchParams.get("tags") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const filters: string[] = ['_type == "post"', "defined(publishedAt)"];
  const params: Record<string, any> = {};

  if (qRaw) {
    params.q = `*${qRaw}*`;
    filters.push("(title match $q || bodyMarkdown match $q)");
  }

  if (tagSlugs.length > 0) {
    params.tagSlugs = tagSlugs;
    filters.push("count(tags[@->slug.current in $tagSlugs]) > 0");
  }

  const where = filters.join(" && ");

  const projection = `{
    _id,
    title,
    "slug": slug.current,
    mainImage,
    publishedAt,
    "tags": tags[]->{ _id, title, "slug": slug.current },
    bodyMarkdown,
    excerpt
  }`;

  const listQuery = `*[${where}] | order(publishedAt desc, _id desc) [0...${PAGE_SIZE}] ${projection}`;
  const countQuery = `count(*[${where}])`;
  const tagsQuery = `*[_type == "tag"] | order(title asc) { _id, title, "slug": slug.current }`;

  const [rawPosts, total, tags] = await Promise.all([
    client.fetch<any[]>(listQuery, params),
    client.fetch<number>(countQuery, params),
    client.fetch<Tag[]>(tagsQuery),
  ]);

  const posts: Post[] = rawPosts.map((p) => {
    const base =
      typeof p.excerpt === "string" && p.excerpt.trim().length > 0
        ? p.excerpt.trim()
        : stripMarkdown(typeof p.bodyMarkdown === "string" ? p.bodyMarkdown : "");
    const snippet = truncateAtWord(base, 200, "…");
    return {
      _id: p._id,
      title: p.title,
      slug: p.slug,
      mainImage: p.mainImage,
      publishedAt: p.publishedAt,
      tags: p.tags,
      snippet,
    };
  });

  const nextOffset = posts.length;
  const hasMore = nextOffset < total;

  return data(
    {
      posts,
      tags,
      total,
      hasMore,
      nextOffset,
      initialQ: qRaw,
      initialTags: tagSlugs,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    },
  );
}

function BlogContent({ data }: { data: InitialData & { initialQ: string; initialTags: string[] } }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState<Post[]>(data.posts);
  const [nextOffset, setNextOffset] = useState(data.nextOffset);
  const [hasMore, setHasMore] = useState(data.hasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableTags] = useState<Tag[]>(data.tags);
  const [selectedTags, setSelectedTags] = useState<string[]>(data.initialTags);
  const [q, setQ] = useState(data.initialQ);
  const [debouncedQ, setDebouncedQ] = useState(data.initialQ);

  const [filtersChanged, setFiltersChanged] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(handle);
  }, [q]);

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

  useEffect(() => {
    if (!filtersChanged) {
      const qChanged = debouncedQ !== data.initialQ;
      const tagsChanged =
        selectedTags.length !== data.initialTags.length ||
        selectedTags.some((t, i) => t !== data.initialTags[i]);

      if (qChanged || tagsChanged) {
        setFiltersChanged(true);
      } else {
        return;
      }
    }

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
  }, [debouncedQ, selectedTags, filtersChanged, data.initialQ, data.initialTags, setSearchParams]);

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
      { rootMargin: "200px 0px" }
    );
    observerRef.current.observe(sentinelRef.current);
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentinelRef.current, queryString, hasMore]);

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setQ("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3">
        {posts.length === 0 && !loading ? (
          <div className="text-muted-foreground">No posts found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {posts.map((p) => (
              <BlogCard
                key={p._id}
                title={p.title}
                slug={`${p.slug}${linkSuffix}`}
                mainImage={p.mainImage}
                tags={p.tags || []}
                snippet={p.snippet}
                publishedAt={p.publishedAt}
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-destructive">
            Error loading posts: {error}
          </div>
        )}

        <div ref={sentinelRef} className="h-10" />

        {loading && posts.length > 0 && (
          <div className="mt-4 text-muted-foreground">Loading more...</div>
        )}
      </div>

      <aside className="lg:col-span-1">
        <div className="sticky top-24 space-y-6">
          <div>
            <label htmlFor="blog-search" className="sr-only">
              Search posts
            </label>
            <input
              id="blog-search"
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search posts..."
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {availableTags.length > 0 && (
            <TagChips
              tags={availableTags}
              selected={selectedTags}
              onToggle={toggleTag}
              onClear={clearFilters}
              label="Filter by tags"
            />
          )}

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
          >
            Clear filters
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function Blog() {
  const { initialQ, initialTags, ...rest } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-24">
      <h1 className="text-4xl font-bold text-foreground mb-6">Blog</h1>
      <BlogContent data={{ ...rest, initialQ, initialTags }} />
    </div>
  );
}
