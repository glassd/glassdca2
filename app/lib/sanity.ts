import { createClient } from "@sanity/client";
import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID;
const dataset = import.meta.env.VITE_SANITY_DATASET || "production";
const token =
  typeof window === "undefined" ? process.env.SANITY_READ_TOKEN : undefined;

export const client = createClient({
  projectId,
  dataset,
  useCdn: !token, // Use CDN when no token, API when token present (for drafts)
  apiVersion: "2025-11-30",
  token,
});

const builder = createImageUrlBuilder({ projectId, dataset });

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
