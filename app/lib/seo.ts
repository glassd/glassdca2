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

export function seoMeta({ title, description, url, ogImage, type = "website" }: SeoMetaOptions) {
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
