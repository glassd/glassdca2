import { describe, expect, it } from "vitest";
import {
  buildHeadings,
  buildImageIndex,
  estimateReadMinutes,
  slugify,
  wordCount,
} from "./markdown-render";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("How Did We Get Here")).toBe("how-did-we-get-here");
  });

  it("drops punctuation that would break an anchor", () => {
    expect(slugify("What's next? (probably)")).toBe("whats-next-probably");
  });

  it("collapses runs of whitespace", () => {
    expect(slugify("  spaced   out  ")).toBe("spaced-out");
  });
});

describe("buildHeadings", () => {
  it("numbers H2s sequentially with zero padding", () => {
    const md = "## First\n\ntext\n\n## Second\n\n## Third";
    expect(buildHeadings(md).map((h) => h.num)).toEqual(["01", "02", "03"]);
  });

  it("numbers H3s against their parent H2 with a letter suffix", () => {
    const md = "## Parent\n\n### One\n\n### Two\n\n## Next\n\n### Three";
    expect(buildHeadings(md).map((h) => h.num)).toEqual([
      "01",
      "01a",
      "01b",
      "02",
      "02a",
    ]);
  });

  it("leaves an H3 that precedes any H2 unnumbered rather than mislabelling it", () => {
    const heads = buildHeadings("### Orphan\n\n## Real");
    expect(heads[0]).toMatchObject({ level: 3, num: "" });
    expect(heads[1]).toMatchObject({ level: 2, num: "01" });
  });

  it("ignores H1 and H4, which the TOC does not render", () => {
    const md = "# Title\n\n## Section\n\n#### Deep";
    expect(buildHeadings(md).map((h) => h.text)).toEqual(["Section"]);
  });

  it("does not treat a '#' inside a fenced block as a heading", () => {
    const md = "## Real\n\n```sh\n## not a heading\n```";
    expect(buildHeadings(md).map((h) => h.text)).toEqual(["Real"]);
  });

  it("handles tilde fences and indented fences", () => {
    const md = "## Real\n\n~~~\n## nope\n~~~\n\n  ```\n## also nope\n  ```";
    expect(buildHeadings(md).map((h) => h.text)).toEqual(["Real"]);
  });

  it("still numbers headings that follow a closed fence", () => {
    const md = "## One\n\n```js\n// x\n```\n\n## Two";
    expect(buildHeadings(md).map((h) => h.num)).toEqual(["01", "02"]);
  });

  it("derives an anchor id that matches slugify", () => {
    expect(buildHeadings("## What's Next?")[0]).toMatchObject({
      id: "whats-next",
      num: "01",
    });
  });
});

describe("buildImageIndex", () => {
  it("numbers images in document order from the given start", () => {
    const md = "![a](/one.png)\n\n![b](/two.png)";
    const idx = buildImageIndex(md, 2);
    expect(idx.get("/one.png")).toBe(2);
    expect(idx.get("/two.png")).toBe(3);
  });

  it("gives a repeated src the same figure number", () => {
    const md = "![a](/one.png)\n\n![b](/two.png)\n\n![c](/one.png)";
    const idx = buildImageIndex(md, 1);
    expect(idx.get("/one.png")).toBe(1);
    expect(idx.get("/two.png")).toBe(2);
    expect(idx.size).toBe(2);
  });

  it("ignores a title attribute when keying on src", () => {
    const idx = buildImageIndex('![a](/one.png "A caption")', 1);
    expect(idx.get("/one.png")).toBe(1);
  });

  it("returns an empty index for a body with no images", () => {
    expect(buildImageIndex("just text", 1).size).toBe(0);
  });
});

describe("reading estimates", () => {
  it("counts words in the raw markdown", () => {
    expect(wordCount("one two three")).toBe(3);
  });

  it("treats empty or missing bodies as zero words and no estimate", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount(null)).toBe(0);
    expect(estimateReadMinutes(null)).toBeNull();
    expect(estimateReadMinutes("")).toBeNull();
  });

  it("never rounds a short body down to zero minutes", () => {
    expect(estimateReadMinutes("a few words only")).toBe(1);
  });

  it("scales at roughly 220 words per minute", () => {
    const md = Array.from({ length: 660 }, () => "word").join(" ");
    expect(estimateReadMinutes(md)).toBe(3);
  });
});
