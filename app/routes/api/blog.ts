import type { Route } from "./+types/blog";
import { client } from "../../lib/sanity";
import { stripMarkdown, truncateAtWord } from "../../lib/utils";

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
    "snippet": coalesce(excerpt, string::split(bodyMarkdown, "\\n")[0]),
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

    const postsWithSnippet = posts.map((p) => ({
      ...p,
      snippet: truncateAtWord(stripMarkdown(p.snippet ?? ""), 200, "…"),
    }));

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
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
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
