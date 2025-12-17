import type { Route } from "./+types/tags";
import { client } from "../../../lib/sanity";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();

    const params: Record<string, any> = {};
    if (q) params.q = `*${q}*`;

    const query = `*[_type == "tag"${q ? " && title match $q" : ""}] | order(title asc) {
      _id,
      title,
      "slug": slug.current
    }`;

    const tags = await client.fetch(query, params);

    return Response.json(tags, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[/api/blog/tags] Failed to fetch tags:", {
      message: error?.message || String(error),
    });
    return Response.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
