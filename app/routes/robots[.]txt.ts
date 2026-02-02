export function loader() {
  const text = `User-agent: *
Allow: /
Sitemap: https://www.glassd.ca/sitemap.xml`;

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
