import { Link, useLocation } from "react-router";

const NAV_ITEMS = [
  { num: "01", label: "HOME", to: "/" },
  { num: "02", label: "ABOUT", to: "/about" },
  { num: "03", label: "PROJECTS", to: "/projects" },
  { num: "04", label: "BLOG", to: "/blog" },
  { num: "05", label: "CONTACT", to: "/contact" },
] as const;

function isActive(itemTo: string, pathname: string) {
  if (itemTo === "/") return pathname === "/";
  return pathname === itemTo || pathname.startsWith(itemTo + "/");
}

export default function SDNav() {
  const { pathname } = useLocation();

  return (
    <nav className="relative z-10 flex items-center border-b border-sd-rule bg-sd-bg px-8 py-[18px]">
      <Link
        to="/"
        className="flex items-center gap-[10px] font-sd-display text-[22px] font-bold tracking-[-0.04em] text-sd-fg"
      >
        <span aria-hidden className="inline-block h-[10px] w-[10px] bg-sd-acid" />
        <span>
          GLASSD<span className="text-sd-acid">/</span>CA
        </span>
      </Link>

      <ul className="ml-14 flex gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to, pathname);
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                className={
                  "inline-flex items-center px-3 py-1.5 font-sd-mono text-[13px] uppercase tracking-[0.05em] transition-colors duration-150 " +
                  (active
                    ? "bg-sd-acid text-sd-bg"
                    : "text-sd-dim hover:text-sd-fg")
                }
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={
                    "mr-1.5 " +
                    (active ? "text-sd-bg opacity-[0.55]" : "text-sd-faint")
                  }
                >
                  {item.num}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        to="/contact"
        className="ml-auto inline-flex items-center gap-2 bg-sd-acid px-4 py-[9px] font-sd-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-sd-bg transition-colors duration-150 hover:bg-sd-fg"
      >
        LET&apos;S TALK <span aria-hidden>↗</span>
      </Link>
    </nav>
  );
}
