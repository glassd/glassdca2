import { data, useLoaderData } from "react-router";
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

export function headers({}: Route.HeadersArgs) {
  return {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
  };
}

export async function loader({}: Route.LoaderArgs) {
  const posts = await fetchAndProcessPosts();
  return data(
    { posts },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    },
  );
}

export default function Home() {
  const { posts } = useLoaderData<typeof loader>();

  return (
    <div id="top" className="min-h-screen dark">
      <Hero />
      <TechStack />
      <BlogGrid posts={posts} />
    </div>
  );
}
