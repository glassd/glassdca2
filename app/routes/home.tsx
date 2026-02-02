import { useEffect, useState } from "react";
import Hero from "~/components/Hero";
import type { Route } from "./+types/home";
import TechStack from "~/components/TechStack";
import BlogGrid from "~/components/BlogGrid";
import SkeletonCard from "~/components/SkeletonCard";

type Tag = {
  _id: string;
  title: string;
  slug: string;
};

type Post = {
  _id: string;
  title: string;
  slug: string;
  mainImage?: unknown;
  publishedAt?: string;
  tags?: Tag[];
  snippet: string;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "David Glass' Awesome Portfolio" },
    { name: "glassd", content: "Whatever I want" },
  ];
}

export default function Home() {
  const [posts, setPosts] = useState<Post[] | null>(null);

  useEffect(() => {
    fetch("/api/blog/latest")
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error("[Home] Failed to fetch latest posts:", err));
  }, []);

  return (
    <div id="top" className="min-h-screen dark">
      <Hero />
      <TechStack />
      {posts === null ? (
        <section className="py-24 bg-secondary">
          <div className="container px-6">
            <div className="mb-12">
              <div className="h-4 w-28 animate-pulse rounded bg-muted mb-3" />
              <div className="h-9 w-48 animate-pulse rounded bg-muted" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <SkeletonCard
                  key={i}
                  className="animate-fade-in-up rounded-2xl"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        </section>
      ) : (
        <BlogGrid posts={posts} />
      )}
    </div>
  );
}
