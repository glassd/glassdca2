import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import { POST_REMARK_PLUGINS, POST_REHYPE_PLUGINS } from "./markdown";

// Renders markdown through the SAME plugin pipeline the blog post route
// uses, so these assertions track real behavior rather than a copy.
function render(md: string): string {
  return renderToStaticMarkup(
    <ReactMarkdown
      remarkPlugins={POST_REMARK_PLUGINS}
      rehypePlugins={POST_REHYPE_PLUGINS as any}
    >
      {md}
    </ReactMarkdown>,
  );
}

describe("post markdown rendering", () => {
  it("renders inline code as a <code> element", () => {
    const html = render("Use `bun install` to set up.");
    expect(html).toContain("<code>bun install</code>");
  });

  it("syntax-highlights a fenced code block with a language", () => {
    const html = render(
      [
        "```ts",
        "function greet(name: string) {",
        "  return name;",
        "}",
        "```",
      ].join("\n"),
    );
    // language class + highlight.js token wrappers survive sanitization
    expect(html).toContain('class="hljs language-ts"');
    expect(html).toContain('<span class="hljs-keyword">function</span>');
    expect(html).toContain('<span class="hljs-built_in">string</span>');
    // source text is preserved verbatim
    expect(html).toContain("greet");
    expect(html).toContain("return");
  });

  it("renders a fenced block without a language as a plain code block", () => {
    const html = render(["```", "no language here", "```"].join("\n"));
    expect(html).toContain("<pre>");
    expect(html).toContain("no language here");
  });

  it("escapes angle brackets in code instead of emitting live markup", () => {
    const html = render(["```html", "<b>bold</b>", "```"].join("\n"));
    expect(html).toContain("&lt;"); // brackets escaped
    expect(html).toContain("bold"); // text preserved
    expect(html).not.toContain("<b>bold</b>"); // no live element
  });

  it("strips a script injected via raw HTML in the markdown", () => {
    const html = render("text <script>alert('xss')</script> more");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("alert('xss')");
  });

  it("keeps the ==mark== extension as a <mark> tag", () => {
    const html = render("a ==highlighted== word");
    expect(html).toContain("<mark>highlighted</mark>");
  });
});
