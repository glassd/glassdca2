import { useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "./+types/blog";
import BlogCard from "../components/BlogCard";
import TagChips from "../components/TagChips";
import SkeletonCard from "../components/SkeletonCard";

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

type BlogResponse = {
  posts: Post[];
  nextOffset: number;
  hasMore: boolean;
  total: number;
};

const PAGE_SIZE = 10;

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(handle);
  }, [q]);

  // Load tags initially
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch(`/api/blog/tags`, {
          headers: { "Cache-Control": "no-store" },
        });
        if (!res.ok) throw new Error(`Failed to load tags (${res.status})`);
        const data: Tag[] = await res.json();
        if (!cancelled) setAvailableTags(data);
      } catch (e: any) {
        console.error("[Blog] Failed to load tags:", e?.message || e);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build query string for API
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("offset", String(nextOffset));
    params.set("limit", String(PAGE_SIZE));
    if (debouncedQ) params.set("q", debouncedQ);
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));
    return params.toString();
  }, [nextOffset, debouncedQ, selectedTags]);

  // Preserve current filters/search in post links so they carry to the detail view
  const linkSuffix = useMemo(() => {
    const p = new URLSearchParams();
    if (debouncedQ) p.set("q", debouncedQ);
    if (selectedTags.length > 0) p.set("tags", selectedTags.join(","));
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [debouncedQ, selectedTags]);

  // Load a page of posts
  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog?${queryString}`, {
        headers: { "Cache-Control": "no-store" },
      });
      if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
      const data: BlogResponse = await res.json();
      setPosts((prev) =>
        nextOffset === 0 ? data.posts : [...prev, ...data.posts],
      );
      setNextOffset(data.nextOffset);
      setHasMore(data.hasMore);
    } catch (e: any) {
      const msg = e?.message || "Unknown error";
      console.error("[Blog] Error fetching posts:", msg);
      setError(msg);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Reset and load when filters/search change
  useEffect(() => {
    // Reset
    setPosts([]);
    setNextOffset(0);
    setHasMore(true);
    setInitialLoading(true);
  }, [debouncedQ, selectedTags]);

  // When nextOffset resets to 0 (due to filter/search change), trigger initial load
  useEffect(() => {
    if (nextOffset === 0 && hasMore && initialLoading) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextOffset, hasMore, initialLoading, queryString]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    // Clean up any previous observer
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

  return (
    <div className="container mx-auto max-w-8xl px-4 py-20">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
        Blog
      </h1>

      {/* Layout: main content + right sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          {/* Content */}
          {initialLoading && posts.length === 0 ? (
            <div className="grid grid-cols-1 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-300">
              No posts found.
            </div>
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
            <div className="mt-4 text-sm text-red-600 dark:text-red-400">
              Error loading posts: {error}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-10" />

          {/* Loading indicator at bottom */}
          {loading && posts.length > 0 && (
            <div className="mt-4 text-gray-600 dark:text-gray-300">
              Loading more…
            </div>
          )}
        </div>

        {/* Sidebar */}
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
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Clear
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
