export const SITE_URL = "https://glassd.ca";
export const SITE_NAME = "David Glass";
export const TWITTER_HANDLE = "@daglassd";

type SeoMetaOptions = {
  title: string;
  description: string;
  url: string;
  ogImage?: string;
  type?: string;
};

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export function seoMeta({
  title,
  description,
  url,
  ogImage,
  type = "website",
}: SeoMetaOptions) {
  const canonical = `${SITE_URL}${url}`;
  const image = ogImage || DEFAULT_OG_IMAGE;
  const meta: any[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: canonical },
    { property: "og:site_name", content: SITE_NAME },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:site", content: TWITTER_HANDLE },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { property: "og:image", content: image },
    { name: "twitter:image", content: image },
  ];

  return meta;
}

type PostSeoSource = {
  slug?: string | null;
  title?: string | null;
  excerpt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean | null;
};

export type ResolvedPostSeo = {
  title: string;
  description: string;
  canonical: string;
  noindex: boolean;
};

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const v of values) {
    const trimmed = (v || "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/**
 * Resolve what a post should tell search engines.
 *
 * Each value prefers an explicit SEO override, then the editorial field,
 * then a generic fallback. A whitespace-only override counts as unset, so
 * clearing a field in the studio restores the default rather than
 * publishing a blank description.
 */
export function resolvePostSeo(post: PostSeoSource | null | undefined): ResolvedPostSeo {
  const title =
    firstNonEmpty(post?.seoTitle) ||
    (firstNonEmpty(post?.title) ? `${firstNonEmpty(post?.title)} · Blog` : "") ||
    "Blog Post";

  const description =
    firstNonEmpty(post?.seoDescription, post?.excerpt) || "Read this blog post.";

  // A canonical pointing elsewhere means the post ran somewhere else
  // first, and the original should get the credit.
  const canonical =
    firstNonEmpty(post?.canonicalUrl) ||
    `${SITE_URL}/blog/${post?.slug ?? ""}`;

  return { title, description, canonical, noindex: post?.noindex === true };
}
