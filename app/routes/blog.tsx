import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import type { Route } from "./+types/blog";
import BlogCard from "../components/BlogCard";
import SkeletonCard from "../components/SkeletonCard";
import TagChips from "../components/TagChips";

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

const PAGE_SIZE = 10;

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
        {loading && posts.length === 0 ? (
          <div className="grid grid-cols-1 gap-8">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard
                key={i}
                className="animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
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
  return (
    <div className="container mx-auto max-w-7xl px-4 py-24">
      <h1 className="text-4xl font-bold text-foreground mb-6">Blog</h1>
      <BlogContent />
    </div>
  );
}
