import { data, useLoaderData } from "react-router";
import type { Route } from "./+types/projects";
import { client, urlFor } from "../lib/sanity";
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

export function headers({}: Route.HeadersArgs) {
  return {
    "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
  };
}

export async function loader({}: Route.LoaderArgs) {
  const query = `*[_type == "project"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    mainImage,
    description,
    liveUrl,
    githubUrl,
    publishedAt
  }`;

  const projects = await client.fetch<Project[]>(query);

  return data(
    { projects },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    },
  );
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

export default function Projects() {
  const { projects } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-4xl font-bold text-foreground mb-8 text-center">
        My Projects
      </h1>

      <ProjectList projects={projects} />
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
