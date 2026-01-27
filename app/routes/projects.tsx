import { useEffect, useState } from "react";
import type { Route } from "./+types/projects";
import { urlFor } from "../lib/sanity";
import { ProjectCard } from "../components/ProjectCard";
import SkeletonCard from "../components/SkeletonCard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "My Projects" },
    { name: "description", content: "Check out my projects." },
  ];
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

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error(`Failed to fetch projects (${response.status})`);
        }
        const data = await response.json();
        setProjects(data);
      } catch (err: any) {
        const msg = err?.message || "Unknown error";
        console.error("Error fetching projects:", msg);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-center">
        My Projects
      </h1>

      {loading ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-xl text-destructive mb-4">
            Failed to load projects
          </p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">
            No projects found. Check back soon!
          </p>
        </div>
      ) : (
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
      )}
    </div>
  );
}
