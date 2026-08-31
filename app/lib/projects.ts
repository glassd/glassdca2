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
  featured?: boolean;
  /** True when the project carries a case study rather than just a card. */
  hasWriteUp?: boolean;
};

export type ProjectDetail = ProjectCard & {
  role?: string;
  timeframe?: string;
  outcome?: string;
  bodyMarkdown?: string;
  gallery?: Array<
    { _key?: string; alt?: string; caption?: string } & Record<string, any>
  >;
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

export function projectYear(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}
