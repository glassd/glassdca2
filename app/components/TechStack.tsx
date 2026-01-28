import ClientIcon from "@/components/ClientIcon";

const technologies = [
  { name: "React", Icon: "simple-icons:react" },
  { name: "TypeScript", Icon: "nonicons:typescript-16" },
  { name: "Next.js", Icon: "ri:nextjs-line" },
  { name: "Node.js", Icon: "devicon-plain:nodejs" },
  { name: "Tailwind", Icon: "teenyicons:tailwind-outline" },
  { name: "PostgreSQL", Icon: "simple-icons:postgresql" },
  { name: "GraphQL", Icon: "simple-icons:graphql" },
  { name: "AWS", Icon: "lineicons:aws" },
];

export default function TechStack() {
  return (
    <section className="py-20 bg-background">
      <div className="container px-6">
        <div className="text-center mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Tech Stack
          </h2>
          <p className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Technologies I work with
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {technologies.map((tech, index) => (
            <div
              key={tech.name}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:glow-primary transition-all duration-300 cursor-pointer animate-fade-in opacity-0"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-center">
                <div className="mb-3 flex justify-center group-hover:scale-110 transition-transform">
                  <ClientIcon
                    icon={tech.Icon}
                    className="h-9 w-9 text-foreground/80 group-hover:text-foreground"
                  />
                </div>
                <p className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  {tech.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
