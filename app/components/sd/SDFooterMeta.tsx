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

export default function SDFooterMeta() {
  const { pathname } = useLocation();

  return (
    <footer className="relative z-10 flex items-center gap-[18px] border-t border-sd-rule bg-sd-bg px-8 py-[10px]">
      <span className={META_CLASS}>
        <span className="text-sd-acid">●</span> ONLINE
      </span>
      <span className={META_CLASS}>{sectionLabel(pathname)}</span>
      <span className={META_CLASS}>TORONTO · 43.65°N 79.38°W</span>
      <span className="flex-1" />
      <span className={META_CLASS}>{pathname}</span>
    </footer>
  );
}
