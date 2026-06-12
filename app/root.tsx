import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import "./index.css";
import SDNav from "./components/sd/SDNav";
import SDGrid from "./components/sd/SDGrid";
import SDFooterMeta from "./components/sd/SDFooterMeta";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
  { rel: "manifest", href: "/site.webmanifest" },
  {
    rel: "alternate",
    type: "application/rss+xml",
    title: "David Glass — RSS",
    href: "/rss.xml",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1 viewport-fit=cover"
        />
        <meta name="theme-color" content="#0a0a0a" />
        <Meta />
        <Links />
      </head>
      <body className="bg-sd-bg text-sd-fg font-sd-sans">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-sd-bg text-sd-fg">
      <SDGrid />
      <SDNav />
      <main className="relative z-[1] grow">
        <Outlet />
      </main>
      <SDFooterMeta />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let status: string | number = "ERROR";
  let title = "Something broke.";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    status = error.status;
    if (error.status === 404) {
      title = "Page not found.";
      details =
        "The page you were looking for doesn't exist — or it moved without telling anyone.";
    } else {
      title = error.statusText || "Something broke.";
      details = error.statusText || details;
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-sd-bg text-sd-fg">
      <SDGrid />
      <SDNav />
      <main className="relative z-[1] grow px-[18px] pb-6 pt-12 md:px-7 md:pt-16 xl:px-8 xl:pt-20">
        <div className="relative z-[2] mx-auto max-w-[1176px]">
          <div className="mb-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:mb-9">
            <span className="font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint">
              § {String(status)} — FAULT
            </span>
            <div className="hidden h-px flex-1 bg-sd-rule2 md:block" />
            <span className="font-sd-mono text-[10px] uppercase tracking-[0.1em] text-sd-faint">
              STAY CALM
            </span>
          </div>

          <h1 className="mb-6 font-sd-display text-[56px] font-bold leading-[0.92] tracking-[-0.03em] text-sd-fg md:text-[88px] xl:text-[120px]">
            {String(status)}
            <span className="text-sd-acid">.</span>
          </h1>

          <p className="mb-3 max-w-[680px] font-sd-display text-[20px] font-medium leading-[1.3] text-sd-fg md:text-[24px]">
            {title}
          </p>
          <p className="mb-10 max-w-[680px] text-[15px] leading-[1.65] text-sd-dim md:text-[16px]">
            {details}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-sd-acid px-[22px] py-[14px] font-sd-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-sd-bg transition-colors duration-150 hover:bg-sd-fg"
            >
              BACK TO HOME ↗
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center border border-sd-fg bg-transparent px-[22px] py-[14px] font-sd-mono text-[12px] uppercase tracking-[0.08em] text-sd-fg transition-colors duration-150 hover:bg-sd-fg hover:text-sd-bg"
            >
              READ THE BLOG
            </Link>
          </div>

          {stack && (
            <pre className="mt-10 w-full overflow-x-auto border border-sd-rule2 bg-sd-panel p-5 font-sd-mono text-[12px] leading-[1.55] text-sd-dim">
              <code>{stack}</code>
            </pre>
          )}
        </div>
      </main>
      <SDFooterMeta />
    </div>
  );
}
