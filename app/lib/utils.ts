/**
 * Minimal Markdown stripper to generate readable snippets.
 * This avoids shipping a heavy dependency and covers the common cases:
 * - code blocks and inline code
 * - images and links
 * - markdown syntax chars
 * - extra newlines
 */
export function stripMarkdown(md: string): string {
  if (!md) return "";
  return (
    md
      // fenced code blocks
      .replace(/```[\s\S]*?```/g, "")
      // inline code
      .replace(/`[^`]*`/g, "")
      // images ![alt](url)
      .replace(/!\[[^\]]*]\([^)]+\)/g, "")
      // links [text](url) -> text
      .replace(/\[([^\]]*)]\([^)]+\)/g, "$1")
      // headings, blockquotes, emphasis, lists, hr
      .replace(/^\s{0,3}>\s?/gm, "")
      .replace(/(^|\s)[#>*_~-]{1,}/g, " ")
      // multiple newlines -> space
      .replace(/\n{2,}/g, " ")
      // collapse whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Truncate a string to a target length, attempting to cut at a word boundary.
 */
export function truncateAtWord(s: string, max = 200, fallback = "…"): string {
  if (!s) return "";
  if (s.length <= max) return s;
  const sliced = s.slice(0, Math.max(0, max - 1));
  const lastSpace = sliced.lastIndexOf(" ");
  return (lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced) + fallback;
}
