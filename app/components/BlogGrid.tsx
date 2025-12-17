import { ArrowUpRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { urlFor } from "../lib/sanity";

type ApiTag = {
  _id: string;
  title: string;
  slug: string;
};

type ApiPost = {
  _id: string;
  title: string;
  slug: string;
  mainImage?: unknown;
  publishedAt?: string;
  tags?: ApiTag[];
  snippet?: string;
};

type BlogApiResponse = {
  posts: ApiPost[];
  nextOffset: number;
  hasMore: boolean;
  total: number;
};

function formatDate(dateString?: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogGrid() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/blog?limit=3");
        if (!res.ok)
          throw new Error(`Failed to fetch blog posts (${res.status})`);

        const data = (await res.json()) as BlogApiResponse;
        if (cancelled) return;

        setPosts(Array.isArray(data.posts) ? data.posts : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load blog posts");
        setPosts([]);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const cardPosts = useMemo(() => posts.slice(0, 3), [posts]);

  return (
    <section className="py-24 bg-secondary">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Latest Posts
            </h2>
            <p className="text-3xl md:text-4xl font-display font-bold text-foreground">
              From the Blog
            </p>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View all posts
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <article
                key={index}
                className="relative overflow-hidden rounded-2xl bg-card border border-border animate-fade-in-up opacity-0"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="h-48 bg-muted/40" />
                <div className="p-6 space-y-3">
                  <div className="h-4 w-28 bg-muted/40 rounded" />
                  <div className="h-6 w-3/4 bg-muted/40 rounded" />
                  <div className="h-4 w-full bg-muted/40 rounded" />
                  <div className="h-4 w-5/6 bg-muted/40 rounded" />
                </div>
              </article>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-foreground font-medium mb-2">
              Couldn’t load posts
            </p>
            <p className="text-muted-foreground text-sm mb-4">{error}</p>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
              onClick={() => {
                setLoading(true);
                setError(null);
                fetch("/api/blog?limit=3")
                  .then((res) => {
                    if (!res.ok)
                      throw new Error(
                        `Failed to fetch blog posts (${res.status})`,
                      );
                    return res.json();
                  })
                  .then((data: BlogApiResponse) => {
                    setPosts(Array.isArray(data.posts) ? data.posts : []);
                  })
                  .catch((e: any) => {
                    setError(e?.message || "Failed to load blog posts");
                    setPosts([]);
                  })
                  .finally(() => setLoading(false));
              }}
            >
              Retry
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardPosts.map((post, index) => {
              const category =
                post.tags && post.tags.length > 0 ? post.tags[0].title : "Post";
              const dateLabel = formatDate(post.publishedAt) || "";
              const excerpt = post.snippet || "";

              const tags = (post.tags || []).slice(0, 2);
              const imageUrl = post.mainImage
                ? urlFor(post.mainImage as any)
                    .width(800)
                    .height(450)
                    .fit("crop")
                    .url()
                : "";

              return (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted/40" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />

                    {/* Tags */}
                    <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 max-w-[calc(100%-2rem)]">
                      {tags.length > 0 ? (
                        tags.map((t) => (
                          <Badge
                            key={t._id}
                            variant="secondary"
                            className="bg-background/80 backdrop-blur-sm"
                          >
                            {t.title}
                          </Badge>
                        ))
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-background/80 backdrop-blur-sm"
                        >
                          {category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {dateLabel ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4" />
                        {dateLabel}
                      </div>
                    ) : null}

                    <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {excerpt}
                    </p>

                    {/* Hover arrow */}
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 rounded-full bg-primary text-primary-foreground">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
