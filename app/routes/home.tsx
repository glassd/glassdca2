import Hero from "~/components/Hero";
import type { Route } from "../+types/root";
import TechStack from "~/components/TechStack";
import BlogGrid from "~/components/BlogGrid";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "David Glass' Awesome Portfolio" },
    { name: "glassd", content: "Whatever I want" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen dark">
      <Hero />
      <TechStack />
      <BlogGrid />
    </div>
  );
}
