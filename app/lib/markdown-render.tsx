import { useMemo } from "react";

/**
 * Shared rendering layer for Markdown bodies (blog posts and project case
 * studies). The plugin pipeline lives in ./markdown; this module owns the
 * react-markdown component mapping and the heading/figure numbering that
 * the "System Diagram" treatment depends on.
 */

export type Heading = { id: string; text: string; level: 2 | 3; num: string };

const LETTERS = "abcdefghijklmnopqrstuvwxyz";

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractText(node: any): string {
  if (node == null) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (typeof node === "object" && "props" in node) {
    return extractText((node as any).props?.children);
  }
  return "";
}

/**
 * H2s number 01, 02, 03…; H3s take their parent's number plus a letter
 * (01a, 01b). An H3 before any H2 gets no number rather than a broken one.
 */
export function buildHeadings(md: string): Heading[] {
  const items: Heading[] = [];
  let h2Count = 0;
  let h3LetterIdx = 0;
  let inFence = false;
  let fenceMarker = "";
  for (const rawLine of md.split("\n")) {
    const line = rawLine.trimEnd();

    // A "## comment" inside a fenced block is code, not a section. Track
    // fences so those don't become phantom entries in the contents rail.
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceMarker = fence[1][0];
      } else if (fence[1][0] === fenceMarker) {
        inFence = false;
        fenceMarker = "";
      }
      continue;
    }
    if (inFence) continue;

    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].replace(/#+\s*$/, "").trim();
    if (!text) continue;
    let num = "";
    if (level === 2) {
      h2Count += 1;
      h3LetterIdx = 0;
      num = String(h2Count).padStart(2, "0");
    } else if (h2Count > 0) {
      num = `${String(h2Count).padStart(2, "0")}${LETTERS[h3LetterIdx] ?? ""}`;
      h3LetterIdx += 1;
    }
    items.push({ id: slugify(text), text, level, num });
  }
  return items;
}

/**
 * Maps each distinct image src to a FIG. number. `startAt` lets the caller
 * reserve earlier numbers for images rendered outside the markdown body
 * (a hero, for instance).
 */
export function buildImageIndex(
  md: string,
  startAt: number,
): Map<string, number> {
  const map = new Map<string, number>();
  const re = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let m: RegExpExecArray | null;
  let n = startAt;
  while ((m = re.exec(md))) {
    if (!map.has(m[1])) {
      map.set(m[1], n);
      n += 1;
    }
  }
  return map;
}

export function useMarkdownComponents(
  headingNumById: Map<string, string>,
  imgFigs: Map<string, number>,
) {
  return useMemo(
    () => ({
      h1: ({ node: _n, children, ...props }: any) => {
        const id = slugify(extractText(children));
        return (
          <h1 {...props} id={id || undefined}>
            {children}
          </h1>
        );
      },
      h2: ({ node: _n, children, ...props }: any) => {
        const text = extractText(children);
        const id = slugify(text);
        const num = headingNumById.get(id);
        return (
          <h2 {...props} id={id || undefined}>
            {num ? <span className="sd-num">§ {num}</span> : null}
            <span>{children}</span>
          </h2>
        );
      },
      h3: ({ node: _n, children, ...props }: any) => {
        const id = slugify(extractText(children));
        return (
          <h3 {...props} id={id || undefined}>
            {children}
          </h3>
        );
      },
      p: ({ node, children, ...props }: any) => {
        // A paragraph wrapping only an image would nest <figure> inside
        // <p>, which is invalid; unwrap so the img mapping can emit one.
        const kids = node?.children;
        if (
          Array.isArray(kids) &&
          kids.length === 1 &&
          kids[0]?.type === "element" &&
          kids[0]?.tagName === "img"
        ) {
          return <>{children}</>;
        }
        return <p {...props}>{children}</p>;
      },
      a: ({ node: _n, href, children, ...props }: any) => {
        const isExternal =
          typeof href === "string" && /^https?:\/\//.test(href);
        return (
          <a
            {...props}
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
          >
            {children}
          </a>
        );
      },
      img: ({ node: _n, src, alt }: any) => {
        const fig = (src && imgFigs.get(src)) ?? null;
        const padded = fig != null ? String(fig).padStart(2, "0") : null;
        return (
          <figure>
            <img src={src} alt={alt || ""} loading="lazy" />
            {(alt || padded) && (
              <figcaption>
                {padded && <span className="sd-fig">FIG. {padded}</span>}
                {alt && <span>{alt}</span>}
              </figcaption>
            )}
          </figure>
        );
      },
      pre: ({ node: _n, children, ...props }: any) => {
        let lang: string | null = null;
        const child = Array.isArray(children) ? children[0] : children;
        const className = child?.props?.className;
        if (typeof className === "string") {
          const m = className.match(/language-([\w-]+)/);
          if (m) lang = m[1];
        }
        return (
          <pre {...props}>
            {children}
            {lang && <span className="sd-pre-label">{lang.toUpperCase()}</span>}
          </pre>
        );
      },
    }),
    [headingNumById, imgFigs],
  );
}

export function estimateReadMinutes(md: string | null | undefined) {
  if (!md) return null;
  const words = md.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function wordCount(md: string | null | undefined) {
  if (!md) return 0;
  return md.split(/\s+/).filter(Boolean).length;
}
