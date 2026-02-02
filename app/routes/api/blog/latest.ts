import { client } from "../../../lib/sanity";
import { stripMarkdown, truncateAtWord } from "../../../lib/utils";

export async function loader() {
  const query = `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc, _id desc) [0...3] {
    _id,
    title,
    "slug": slug.current,
    mainImage,
    publishedAt,
    "tags": tags[]->{ _id, title, "slug": slug.current },
    "snippet": coalesce(excerpt, string::split(bodyMarkdown, "\\n")[0]),
  }`;

  try {
    const posts = await client.fetch<any[]>(query);

    const processed = posts.map((p) => ({
      _id: p._id,
      title: p.title,
      slug: p.slug,
      mainImage: p.mainImage,
      publishedAt: p.publishedAt,
      tags: p.tags,
      snippet: truncateAtWord(stripMarkdown(p.snippet ?? ""), 200, "…"),
    }));

    return Response.json(processed, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.error("[/api/blog/latest] Failed to fetch posts:", {
      message: error?.message || String(error),
    });
    return Response.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
