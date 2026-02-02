import { useEffect, useState } from "react";
import type { Route } from "./+types/projects";
import { seoMeta } from "~/lib/seo";
import { urlFor } from "../lib/sanity";
import { ProjectCard } from "../components/ProjectCard";

export function meta({}: Route.MetaArgs) {
  return seoMeta({
    title: "Projects - David Glass",
    description: "Explore my development projects and see what I've been building.",
    url: "/projects",
  });
}

interface Project {
  _id: string;
  title: string;
  slug: { current: string };
  mainImage: any;
  description: string;
  liveUrl?: string;
  githubUrl?: string;
}

function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">
          No projects found. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          title={project.title}
          image={
            project.mainImage
              ? urlFor(project.mainImage).width(800).url()
              : ""
          }
          description={project.description}
          liveUrl={project.liveUrl}
          githubUrl={project.githubUrl}
        />
      ))}
    </div>
  );
}

function ProjectSkeleton({ index }: { index: number }) {
  return (
    <div
      aria-hidden="true"
      className="bg-card rounded-xl shadow-sm overflow-hidden border border-border flex flex-col h-full animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="h-48 overflow-hidden">
        <div className="h-full w-full animate-pulse bg-muted" />
      </div>
      <div className="p-6 flex flex-col grow">
        <div className="h-6 w-3/4 animate-pulse rounded-md bg-muted mb-2" />
        <div className="space-y-2 mb-4 grow">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex gap-4 mt-auto pt-4 border-t border-border">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[] | null>(null);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch((err) => console.error("[Projects] Failed to fetch:", err));
  }, []);

  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-center">
        My Projects
      </h1>

      {projects === null ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <ProjectSkeleton key={i} index={i} />
          ))}
        </div>
      ) : (
        <ProjectList projects={projects} />
      )}
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-center">
        My Projects
      </h1>
      <div className="text-center py-12">
        <p className="text-xl text-destructive mb-4">
          Failed to load projects
        </p>
        <p className="text-muted-foreground">{error?.message || "Unknown error"}</p>
      </div>
    </div>
  );
}
