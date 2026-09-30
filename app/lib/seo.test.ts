import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROJECT_DESCRIPTION,
  resolvePostSeo,
  resolveProjectDescription,
  SITE_URL,
} from "./seo";

describe("resolvePostSeo", () => {
  const base = { slug: "a-post", title: "A Post" };

  describe("title", () => {
    it("suffixes the post title when there is no override", () => {
      expect(resolvePostSeo(base).title).toBe("A Post · Blog");
    });

    it("uses the override verbatim, without the suffix", () => {
      expect(
        resolvePostSeo({ ...base, seoTitle: "Why I Use AI To Write Code" })
          .title,
      ).toBe("Why I Use AI To Write Code");
    });

    it("treats a whitespace-only override as unset", () => {
      expect(resolvePostSeo({ ...base, seoTitle: "   " }).title).toBe(
        "A Post · Blog",
      );
    });

    it("falls back when the post has no title at all", () => {
      expect(resolvePostSeo({ slug: "x" }).title).toBe("Blog Post");
      expect(resolvePostSeo(null).title).toBe("Blog Post");
    });
  });

  describe("description", () => {
    it("prefers the SEO description over the excerpt", () => {
      expect(
        resolvePostSeo({
          ...base,
          excerpt: "editorial teaser",
          seoDescription: "search pitch",
        }).description,
      ).toBe("search pitch");
    });

    it("falls back to the excerpt", () => {
      expect(
        resolvePostSeo({ ...base, excerpt: "editorial teaser" }).description,
      ).toBe("editorial teaser");
    });

    it("falls back past a blank SEO description rather than publishing it", () => {
      expect(
        resolvePostSeo({ ...base, excerpt: "teaser", seoDescription: "  " })
          .description,
      ).toBe("teaser");
    });

    it("uses the generic fallback only when nothing else exists", () => {
      expect(resolvePostSeo(base).description).toBe("Read this blog post.");
    });

    it("trims surrounding whitespace", () => {
      expect(
        resolvePostSeo({ ...base, seoDescription: "  padded  " }).description,
      ).toBe("padded");
    });
  });

  describe("canonical", () => {
    it("builds a site URL from the slug by default", () => {
      expect(resolvePostSeo(base).canonical).toBe(`${SITE_URL}/blog/a-post`);
    });

    it("uses an explicit canonical when the post ran elsewhere first", () => {
      expect(
        resolvePostSeo({
          ...base,
          canonicalUrl: "https://example.com/original",
        }).canonical,
      ).toBe("https://example.com/original");
    });

    it("ignores a blank canonical", () => {
      expect(resolvePostSeo({ ...base, canonicalUrl: "  " }).canonical).toBe(
        `${SITE_URL}/blog/a-post`,
      );
    });
  });

  describe("noindex", () => {
    it("is false unless explicitly true", () => {
      expect(resolvePostSeo(base).noindex).toBe(false);
      expect(resolvePostSeo({ ...base, noindex: null }).noindex).toBe(false);
      expect(resolvePostSeo({ ...base, noindex: false }).noindex).toBe(false);
    });

    it("is true when set", () => {
      expect(resolvePostSeo({ ...base, noindex: true }).noindex).toBe(true);
    });
  });
});

describe("resolveProjectDescription", () => {
  it("prefers the SEO description over the card description", () => {
    expect(
      resolveProjectDescription({
        description: "card copy",
        seoDescription: "search pitch",
      }),
    ).toBe("search pitch");
  });

  it("falls back past a blank override to the card description", () => {
    expect(
      resolveProjectDescription({
        description: "card copy",
        seoDescription: " ",
      }),
    ).toBe("card copy");
  });

  it("uses the generic line only when nothing else exists", () => {
    expect(resolveProjectDescription({})).toBe(DEFAULT_PROJECT_DESCRIPTION);
    expect(resolveProjectDescription(null)).toBe(DEFAULT_PROJECT_DESCRIPTION);
  });
});
