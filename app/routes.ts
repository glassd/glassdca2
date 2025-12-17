import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("about", "routes/about.tsx"),
  route("projects", "routes/projects.tsx"),
  route("blog", "routes/blog.tsx"),
  route("blog/:slug", "routes/blog.$slug.tsx"),
  route("contact", "routes/contact.tsx"),
  route("contact/sent", "routes/contact.sent.tsx"),
  route("api/projects", "routes/api/projects.ts"),
  route("api/blog", "routes/api/blog.ts"),
  route("api/blog/tags", "routes/api/blog/tags.ts"),
] satisfies RouteConfig;
