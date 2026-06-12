import { useLocation } from "react-router";

function sectionLabel(pathname: string): string {
  if (pathname === "/") return "§ HOME";
  if (pathname.startsWith("/about")) return "§ ABOUT";
  if (pathname.startsWith("/projects")) return "§ PROJECTS";
  if (pathname.startsWith("/blog/")) return "§ BLOG / POST";
  if (pathname.startsWith("/blog")) return "§ BLOG";
  if (pathname.startsWith("/contact")) return "§ CONTACT";
  return "§";
}

const META_CLASS =
  "font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint";

const SOCIALS: Array<{ label: string; href: string }> = [
  { label: "GITHUB", href: "https://github.com/glassd" },
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/glassd" },
  { label: "X", href: "https://x.com/daglassd" },
  { label: "RSS", href: "/rss.xml" },
];

export default function SDFooterMeta() {
  const { pathname } = useLocation();

  return (
    <footer className="relative z-10 flex flex-wrap items-center gap-x-[18px] gap-y-1 border-t border-sd-rule bg-sd-bg px-[18px] py-[10px] md:px-7 xl:px-8">
      <span className={META_CLASS}>
        <span className="text-sd-acid">●</span> ONLINE
      </span>
      <span className={META_CLASS}>{sectionLabel(pathname)}</span>
      <span className={`${META_CLASS} hidden md:inline`}>
        TORONTO · 43.65°N 79.38°W
      </span>
      <span className="flex-1" />
      {SOCIALS.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target={s.href.startsWith("http") ? "_blank" : undefined}
          rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
          className={`${META_CLASS} no-underline transition-colors duration-150 hover:text-sd-acid`}
        >
          {s.label} ↗
        </a>
      ))}
      <span className={`${META_CLASS} hidden md:inline`}>{pathname}</span>
    </footer>
  );
}
