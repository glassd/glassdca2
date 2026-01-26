import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
const isServer = typeof window === "undefined";

export const client = createClient({
  projectId: "anguo7xv",
  dataset: "production",
  useCdn: true, // Always use CDN for faster responses
  apiVersion: "2025-11-30",
  // Token not needed when using CDN for published content
});

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
