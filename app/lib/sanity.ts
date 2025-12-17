import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
const isServer = typeof window === "undefined";

export const client = createClient({
  projectId: "anguo7xv",
  dataset: "production",
  // Use the CDN in the browser, but bypass CDN on the server for fresh + tokened reads
  useCdn: !isServer,
  apiVersion: "2025-11-30", // use current date (YYYY-MM-DD) to target the latest API version
  // Only include the read token on the server to keep it secure
  token: isServer ? process.env.SANITY_READ_TOKEN : undefined,
});

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
