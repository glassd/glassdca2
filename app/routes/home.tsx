import { Suspense } from "react";
import { useLoaderData, Await } from "react-router";
import Hero from "~/components/Hero";
import type { Route } from "./+types/home";
import TechStack from "~/components/TechStack";
import BlogGrid from "~/components/BlogGrid";
import { client } from "../lib/sanity";
import { stripMarkdown, truncateAtWord } from "../lib/utils";

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

async function fetchAndProcessPosts(): Promise<Post[]> {
  const query = `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc, _id desc) [0...3] {
    _id,
    title,
    "slug": slug.current,
    mainImage,
    publishedAt,
    "tags": tags[]->{ _id, title, "slug": slug.current },
    bodyMarkdown,
    excerpt
  }`;

  const posts = await client.fetch<any[]>(query);

  return posts.map((p) => {
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
}

export async function loader({}: Route.LoaderArgs) {
  const posts = fetchAndProcessPosts();
  return { posts };
}

function BlogGridSkeleton() {
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
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-muted" />
              <div className="p-6 space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div id="top" className="min-h-screen dark">
      <Hero />
      <TechStack />
      <Suspense fallback={<BlogGridSkeleton />}>
        <Await resolve={posts}>
          {(resolved) => <BlogGrid posts={resolved} />}
        </Await>
      </Suspense>
    </div>
  );
}
