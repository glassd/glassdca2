import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("projects", "routes/projects.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
  route("contact", "routes/contact.tsx"),
  route("contact/sent", "routes/contact.sent.tsx"),
  route("api/blog", "routes/api/blog.ts"),
  route("sitemap.xml", "routes/sitemap[.]xml.ts"),
  route("rss.xml", "routes/rss[.]xml.ts"),
  route("robots.txt", "routes/robots[.]txt.ts"),
] satisfies RouteConfig;
