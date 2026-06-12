import type { Route } from "./+types/blog";
import { listPosts } from "../../lib/queries.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  const offset = Math.max(0, Number(url.searchParams.get("offset") || "0"));
  const limit = Math.min(
    50,
    Math.max(1, Number(url.searchParams.get("limit") || "10")),
  );
  const q = (url.searchParams.get("q") || "").trim();
  const tagSlugs = (url.searchParams.get("tags") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const page = await listPosts({ offset, limit, q, tagSlugs });

    return Response.json(page, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch (error: any) {
    console.error("[/api/blog] Failed to fetch posts:", {
      message: error?.message || String(error),
    });
    return Response.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
