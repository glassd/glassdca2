import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.svg";

export default function Footer() {
  return (
    <footer className="py-16 bg-card border-t border-border">
      <div className="container px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Description */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <img src={logo} alt="David Glass Logo" className="h-10 w-auto" />
              <span className="font-display font-semibold text-xl text-foreground">
                David Glass
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-m">
              Building exceptional web experiences with passion and precision.
            </p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/glassd"
              className="p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
            >
              <Icon icon="line-md:github" className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/daglassd"
              className="p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
            >
              <Icon icon="ri:twitter-line" className="h-5 w-5" />
            </a>
            <a
              href="https://www.linkedin.com/feed/"
              className="p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
            >
              <Icon icon="line-md:linkedin" className="h-5 w-5" />
            </a>
            <Link
              to="/contact"
              className="p-3 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground transition-all"
            >
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 David Glass. All rights reserved.
          </p>
          {/*
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </a>
          </div>
          */}
        </div>
      </div>
    </footer>
  );
}
