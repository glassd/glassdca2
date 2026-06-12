import { describe, expect, it } from "vitest";
import { stripMarkdown, truncateAtWord } from "./utils";

describe("stripMarkdown", () => {
  it("returns empty string for empty input", () => {
    expect(stripMarkdown("")).toBe("");
  });

  it("removes fenced code blocks", () => {
    expect(stripMarkdown("before\n```js\nconst x = 1;\n```\nafter")).toBe(
      "before after",
    );
  });

  it("removes inline code", () => {
    expect(stripMarkdown("run `bun install` now")).toBe("run now");
  });

  it("removes images entirely", () => {
    expect(stripMarkdown("look ![a chart](img.png) here")).toBe("look here");
  });

  it("keeps link text and drops the URL", () => {
    expect(stripMarkdown("see [the docs](https://example.com) for more")).toBe(
      "see the docs for more",
    );
  });

  it("strips heading markers", () => {
    expect(stripMarkdown("## Section Title\n\nBody text.")).toBe(
      "Section Title Body text.",
    );
  });

  it("strips blockquote markers", () => {
    expect(stripMarkdown("> quoted line")).toBe("quoted line");
  });

  it("collapses multiple newlines and whitespace", () => {
    expect(stripMarkdown("one\n\n\ntwo   three")).toBe("one two three");
  });
});

describe("truncateAtWord", () => {
  it("returns short strings unchanged", () => {
    expect(truncateAtWord("short", 200)).toBe("short");
  });

  it("returns empty string for empty input", () => {
    expect(truncateAtWord("", 200)).toBe("");
  });

  it("cuts at a word boundary and appends the fallback", () => {
    const input = "the quick brown fox jumps over the lazy dog";
    const out = truncateAtWord(input, 20, "…");
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(20);
    // no mid-word cut: everything before the ellipsis is whole words
    expect(input.startsWith(out.slice(0, -1))).toBe(true);
    expect(input[out.length - 1]).toBe(" ");
  });

  it("hard-cuts when no usable word boundary exists", () => {
    const out = truncateAtWord("a".repeat(300), 50, "…");
    expect(out).toBe("a".repeat(49) + "…");
  });
});
