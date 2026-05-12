import { client } from "../../lib/sanity";

const CODING_SINCE_YEAR = 2012;

export async function loader() {
  const query = `{
    "projects": count(*[_type == "project"]),
    "posts": count(*[_type == "post" && defined(publishedAt)])
  }`;

  try {
    const { projects, posts } = await client.fetch<{
      projects: number;
      posts: number;
    }>(query);

    const years = Math.max(0, new Date().getFullYear() - CODING_SINCE_YEAR);

    return Response.json(
      { years, projects, posts },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        },
      },
    );
  } catch (error: any) {
    console.error("[/api/stats] Failed to fetch counts:", {
      message: error?.message || String(error),
    });
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
