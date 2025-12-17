import { ArrowRight } from "lucide-react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-glow delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full" />
      </div>

      <div className="container relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in opacity-0"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-primary-foreground/80">
              Available for new projects
            </span>
          </div>

          {/* Main heading */}
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-6 animate-fade-in opacity-0"
            style={{ animationDelay: "0.2s" }}
          >
            <span className="text-primary-foreground">Hi, I'm </span>
            <span className="gradient-text">David Glass</span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl md:text-2xl text-primary-foreground/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in opacity-0"
            style={{ animationDelay: "0.3s" }}
          >
            A developer passionate about crafting{" "}
            <span className="text-primary-foreground font-medium">
              exceptional web experiences
            </span>{" "}
            with clean code and bold design.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in opacity-0"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              asChild
              size="lg"
              className="gradient-bg glow-primary text-primary-foreground font-semibold px-8 py-6 text-lg rounded-xl hover:scale-105 transition-transform"
            >
              <Link to="/projects">
                View Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-6 text-lg rounded-xl"
            >
              <Link to="/contact">Contact Me</Link>
            </Button>
          </div>

          {/* Social links */}
          <div
            className="flex items-center justify-center gap-6 animate-fade-in opacity-0"
            style={{ animationDelay: "0.5s" }}
          >
            <a
              href="https://github.com/glassd"
              className="p-3 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/20 transition-all"
            >
              <Icon icon="line-md:github" className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/daglassd"
              className="p-3 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/20 transition-all"
            >
              <Icon icon="ri:twitter-line" className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/glassd/"
              className="p-3 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground/20 transition-all"
            >
              <Icon icon="line-md:linkedin" className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float">
        <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 rounded-full bg-primary-foreground/50 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
