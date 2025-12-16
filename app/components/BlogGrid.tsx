import { ArrowUpRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const posts = [
  {
    id: 1,
    title: "Building Scalable React Applications",
    excerpt:
      "Best practices and patterns for creating maintainable React codebases that grow with your team.",
    date: "Dec 10, 2025",
    category: "React",
    image:
      "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    featured: true,
  },
  {
    id: 2,
    title: "The Power of TypeScript",
    excerpt: "Why TypeScript should be your default choice for new projects.",
    date: "Dec 5, 2025",
    category: "TypeScript",
    image:
      "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop",
    featured: false,
  },
  {
    id: 3,
    title: "Modern CSS Techniques",
    excerpt: "Exploring CSS Grid, Container Queries, and CSS Variables.",
    date: "Dec 1, 2025",
    category: "CSS",
    image:
      "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop",
    featured: false,
  },
];

export default function BlogGrid() {
  return (
    <section className="py-24 bg-secondary">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Latest Posts
            </h2>
            <p className="text-3xl md:text-4xl font-display font-bold text-foreground">
              From the Blog
            </p>
          </div>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View all posts
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <article
              key={post.id}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 animate-fade-in-up opacity-0"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent" />
                <Badge
                  variant="secondary"
                  className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm"
                >
                  {post.category}
                </Badge>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  {post.date}
                </div>

                <h3 className="text-xl font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-muted-foreground text-sm line-clamp-2">
                  {post.excerpt}
                </p>

                {/* Hover arrow */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="p-2 rounded-full bg-primary text-primary-foreground">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
