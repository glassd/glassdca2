export const SITE_URL = "https://www.glassd.ca";
export const SITE_NAME = "David Glass";
export const TWITTER_HANDLE = "@daglassd";

type SeoMetaOptions = {
  title: string;
  description: string;
  url: string;
  ogImage?: string;
  type?: string;
};

export function seoMeta({ title, description, url, ogImage, type = "website" }: SeoMetaOptions) {
  const canonical = `${SITE_URL}${url}`;
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
  ];

  if (ogImage) {
    meta.push({ property: "og:image", content: ogImage });
    meta.push({ name: "twitter:image", content: ogImage });
  }

  return meta;
}
