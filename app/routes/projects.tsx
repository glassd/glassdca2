import { useEffect, useState } from "react";
import type { Route } from "./+types/projects";
import { urlFor } from "../lib/sanity";
import { ProjectCard } from "../components/ProjectCard";

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

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-40 text-center">
        <p className="text-gray-600 dark:text-gray-300">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-40">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
        My Projects
      </h1>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 dark:text-gray-300">
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
