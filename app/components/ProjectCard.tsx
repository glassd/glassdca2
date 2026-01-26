interface ProjectCardProps {
  title: string;
  image: string;
  description: string;
  liveUrl?: string;
  githubUrl?: string;
}

export function ProjectCard({
  title,
  image,
  description,
  liveUrl,
  githubUrl,
}: ProjectCardProps) {
  return (
    <div className="bg-card rounded-xl shadow-sm overflow-hidden border border-border flex flex-col h-full hover:shadow-md hover:border-primary/30 transition-all">
      <div className="h-48 overflow-hidden bg-muted">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground">No Image</span>
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col grow">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground mb-4 grow line-clamp-3">
          {description}
        </p>
        <div className="flex gap-4 mt-auto pt-4 border-t border-border">
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline flex items-center"
            >
              Live Demo
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground font-medium hover:text-foreground flex items-center transition-colors"
            >
              GitHub
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
