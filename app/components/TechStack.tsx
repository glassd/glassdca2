const technologies = [
  { name: "React", icon: "⚛️" },
  { name: "TypeScript", icon: "📘" },
  { name: "Next.js", icon: "▲" },
  { name: "Node.js", icon: "🟢" },
  { name: "Tailwind", icon: "🎨" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "GraphQL", icon: "◈" },
  { name: "AWS", icon: "☁️" },
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
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                  {tech.icon}
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
