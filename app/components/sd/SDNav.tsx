import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);

  // Close overlay on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while overlay is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = open ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <nav className="relative z-10 flex items-center border-b border-sd-rule bg-sd-bg px-[18px] py-[14px] md:px-7 md:py-4 xl:px-8 xl:py-[18px]">
      <Link
        to="/"
        className="flex items-center gap-[10px] font-sd-display text-[20px] font-bold tracking-[-0.04em] text-sd-fg md:text-[22px]"
      >
        <span aria-hidden className="inline-block h-[10px] w-[10px] bg-sd-acid" />
        <span>
          GLASSD<span className="text-sd-acid">/</span>CA
        </span>
      </Link>

      {/* Desktop / tablet nav links */}
      <ul className="ml-7 hidden gap-1 md:flex xl:ml-14">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.to, pathname);
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                className={
                  "inline-flex items-center px-2.5 py-1.5 font-sd-mono text-[12px] uppercase tracking-[0.05em] transition-colors duration-150 xl:px-3 xl:text-[13px] " +
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

      {/* Desktop / tablet CTA */}
      <Link
        to="/contact"
        className="ml-auto hidden items-center gap-2 bg-sd-acid px-4 py-[9px] font-sd-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-sd-bg transition-colors duration-150 hover:bg-sd-fg md:inline-flex"
      >
        LET&apos;S TALK <span aria-hidden>↗</span>
      </Link>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ml-auto inline-flex h-10 w-10 items-center justify-center border border-sd-rule2 text-sd-fg transition-colors hover:border-sd-acid hover:text-sd-acid md:hidden"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-sd-bg md:hidden">
          <div className="flex items-center border-b border-sd-rule2 px-[18px] py-[14px]">
            <Link
              to="/"
              className="flex items-center gap-[10px] font-sd-display text-[20px] font-bold tracking-[-0.04em] text-sd-fg"
              onClick={() => setOpen(false)}
            >
              <span
                aria-hidden
                className="inline-block h-[10px] w-[10px] bg-sd-acid"
              />
              <span>
                GLASSD<span className="text-sd-acid">/</span>CA
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto inline-flex h-10 w-10 items-center justify-center border border-sd-rule2 text-sd-fg transition-colors hover:border-sd-acid hover:text-sd-acid"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          </div>
          <ul className="flex flex-1 flex-col border-t border-sd-rule2 px-[18px]">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to, pathname);
              return (
                <li
                  key={item.label}
                  className="border-b border-sd-rule2"
                >
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={
                      "flex items-baseline gap-4 py-5 font-sd-display text-[32px] font-semibold tracking-[-0.02em] " +
                      (active ? "text-sd-acid" : "text-sd-fg")
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={
                        "w-7 shrink-0 font-sd-mono text-[11px] uppercase tracking-[0.08em] " +
                        (active ? "text-sd-acid" : "text-sd-faint")
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
            onClick={() => setOpen(false)}
            className="m-[18px] inline-flex items-center justify-center gap-2 bg-sd-acid px-4 py-[14px] font-sd-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-sd-bg"
          >
            LET&apos;S TALK <span aria-hidden>↗</span>
          </Link>
        </div>
      )}
    </nav>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="16"
      height="14"
      viewBox="0 0 16 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <line x1="0" y1="1" x2="16" y2="1" />
      <line x1="0" y1="7" x2="16" y2="7" />
      <line x1="0" y1="13" x2="16" y2="13" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <line x1="1" y1="1" x2="13" y2="13" />
      <line x1="13" y1="1" x2="1" y2="13" />
    </svg>
  );
}
