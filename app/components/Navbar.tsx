import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.svg";
import { Link, useLocation } from "react-router";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: "Home", to: "/" },
    { name: "About", to: "/about" },
    { name: "Projects", to: "/projects" },
    { name: "Blog", to: "/blog" },
    { name: "Contact", to: "/contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // If you navigate to "/#section", scroll to that section after navigation.
    if (location.hash) {
      const id = location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/#top" className="flex items-center gap-3">
            <img src={logo} alt="David Glass Logo" className="h-10 w-auto" />
            <span
              className={`font-display font-semibold text-xl ${scrolled ? "text-foreground" : "text-primary-foreground"}`}
            >
              David Glass
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                to={link.to}
                key={link.name}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  scrolled ? "text-foreground/70" : "text-primary-foreground/70"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              asChild
              className="gradient-bg glow-primary text-primary-foreground font-medium text-lg rounded-xl hover:scale-105 transition-transform"
            >
              <Link to="/contact">Let's Talk</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <X
                className={`h-6 w-6 ${scrolled ? "text-foreground" : "text-primary-foreground"}`}
              />
            ) : (
              <Menu
                className={`h-6 w-6 ${scrolled ? "text-foreground" : "text-primary-foreground"}`}
              />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-20 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border py-6 animate-fade-in">
            <div className="flex flex-col gap-4 px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className="text-foreground/80 hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Button
                asChild
                className="gradient-bg text-primary-foreground font-medium rounded-xl mt-4"
              >
                <Link to="/contact" onClick={() => setIsOpen(false)}>
                  Let's Talk
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
