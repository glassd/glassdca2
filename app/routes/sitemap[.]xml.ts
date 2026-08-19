import { client } from "../lib/sanity";
import { SITE_URL } from "../lib/seo";
import { listProjectSlugs } from "../lib/queries.server";

export async function loader() {
  const [slugs, projectSlugs] = await Promise.all([
    client.fetch<string[]>(
      `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) { "slug": slug.current }.slug`,
    ),
    listProjectSlugs(),
  ]);

  const staticPages = ["", "/about", "/projects", "/blog", "/contact"];

  const today = new Date().toISOString().split("T")[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (path) => `  <url>
    <loc>${SITE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join("\n")}
${projectSlugs
  .map(
    (slug) => `  <url>
    <loc>${SITE_URL}/projects/${slug}</loc>
  </url>`,
  )
  .join("\n")}
${slugs
  .map(
    (slug) => `  <url>
    <loc>${SITE_URL}/blog/${slug}</loc>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
