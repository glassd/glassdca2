import { SITE_URL } from "~/lib/seo";

export function loader() {
  const text = `User-agent: *
Allow: /
Sitemap: ${SITE_URL}/sitemap.xml`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
