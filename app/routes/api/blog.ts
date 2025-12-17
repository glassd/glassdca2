import type { Route } from "./+types/blog";
import { client } from "../../lib/sanity";

/**
 * Minimal Markdown stripper to generate readable snippets.
 * This avoids shipping a heavy dependency and covers the common cases:
 * - code blocks and inline code
 * - images and links
 * - markdown syntax chars
 * - extra newlines
 */
function stripMarkdown(md: string): string {
  if (!md) return "";
  return (
    md
      // fenced code blocks
      .replace(/```[\s\S]*?```/g, "")
      // inline code
      .replace(/`[^`]*`/g, "")
      // images ![alt](url)
      .replace(/!\[[^\]]*]\([^)]+\)/g, "")
      // links [text](url)
      .replace(/\[[^\]]*]\([^)]+\)/g, "$1")
      // headings, blockquotes, emphasis, lists, hr
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/(^|\s)[#>*_~\-]{1,}/g, " ")
      // multiple newlines -> space
      .replace(/\n{2,}/g, " ")
      // collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Truncate a string to a target length, attempting to cut at a word boundary.
 */
function truncateAtWord(s: string, max = 200, fallback = "…"): string {
  if (!s) return "";
  if (s.length <= max) return s;
  const sliced = s.slice(0, Math.max(0, max - 1));
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced) + fallback;
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  const offset = Math.max(0, Number(url.searchParams.get("offset") || "0"));
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("limit") || "10")),
  );
  const qRaw = (url.searchParams.get("q") || "").trim();
  const tagSlugs = (url.searchParams.get("tags") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Build GROQ filter conditions and params
  const filters: string[] = ['_type == "post"', "defined(publishedAt)"];
  const params: Record<string, any> = {};

  if (qRaw) {
    // GROQ match is case-insensitive. We wildcard the value for partial matches.
    params.q = `*${qRaw}*`;
    filters.push("(title match $q || bodyMarkdown match $q)");
  }

  if (tagSlugs.length > 0) {
    params.tagSlugs = tagSlugs;
    // Post has at least one tag whose slug is in $tagSlugs
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

  const listQuery = `*[
    ${where}
  ] | order(publishedAt desc, _id desc) [${offset}...${offset + limit}] ${projection}`;

  const countQuery = `count(*[${where}])`;

  try {
    const [posts, total] = await Promise.all([
      client.fetch<any[]>(listQuery, params),
      client.fetch<number>(countQuery, params),
    ]);

    // Compute snippet on the server: prefer explicit excerpt, else derive from markdown.
    const postsWithSnippet = posts.map((p) => {
      const base =
        typeof p.excerpt === "string" && p.excerpt.trim().length > 0
          ? p.excerpt.trim()
          : stripMarkdown(
              typeof p.bodyMarkdown === "string" ? p.bodyMarkdown : "",
            );
      const snippet = truncateAtWord(base, 200, "…");
      return { ...p, snippet };
    });

    const nextOffset = offset + posts.length;
    const hasMore = nextOffset < total;

    return Response.json(
      {
        posts: postsWithSnippet,
        nextOffset,
        hasMore,
        total,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  } catch (error: any) {
    console.error("[/api/blog] Failed to fetch posts:", {
      message: error?.message || String(error),
    });
    return Response.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
