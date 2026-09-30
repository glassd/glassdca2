/**
 * Shared shape and presentation helpers for projects, used by the index
 * grid and the case-study detail page so the two can't disagree about
 * what a project is or what status it's in.
 */

export type ProjectCard = {
  _id: string;
  title: string;
  slug: string;
  mainImage?: any;
  description?: string;
  stack?: string[];
  liveUrl?: string;
  githubUrl?: string;
  publishedAt?: string;
  /** Year it shipped, set by hand. Wins over publishedAt for display. */
  year?: number | null;
  featured?: boolean;
  /** True when the project carries a case study rather than just a card. */
  hasWriteUp?: boolean;
};

export type ProjectDetail = ProjectCard & {
  seoDescription?: string;
  role?: string;
  timeframe?: string;
  outcome?: string;
  bodyMarkdown?: string;
  gallery?: Array<
    { _key?: string; alt?: string; caption?: string } & Record<string, any>
  >;
};

/**
 * Old project slugs that now live somewhere else. The two "Profile Page"
 * entries were merged into a single glassd.ca project, and both of their
 * URLs had been public.
 */
export const LEGACY_PROJECT_SLUGS: Record<string, string> = {
  "profile-page": "glassd-ca",
  "profile-page-v2": "glassd-ca",
};

export type ProjectStatus = {
  label: "LIVE" | "WIP" | "ARCHIVED";
  color: string;
};

/**
 * Status is derived rather than stored: a project with somewhere to visit
 * is live, one with only source is in progress, and one with neither is
 * archived. Keeps the studio from carrying a field that goes stale.
 */
export function deriveStatus(
  p: Pick<ProjectCard, "liveUrl" | "githubUrl">,
): ProjectStatus {
  if (p.liveUrl) return { label: "LIVE", color: "text-sd-acid border-sd-acid" };
  if (p.githubUrl) return { label: "WIP", color: "text-sd-fg border-sd-fg" };
  return { label: "ARCHIVED", color: "text-sd-faint border-sd-faint" };
}

/**
 * The year a project shipped. Write-ups often land long after the work,
 * so the publish date is only a fallback for when the year isn't set.
 */
export function projectYear(p: Pick<ProjectCard, "year" | "publishedAt">) {
  if (p.year) return String(p.year);
  if (!p.publishedAt) return null;
  const d = new Date(p.publishedAt);
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}
