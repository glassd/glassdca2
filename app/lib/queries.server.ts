import { client } from "./sanity";
import { CAREER_START_YEAR } from "./site";
import { estimateReadMinutes, wordCount } from "./markdown-render";
import { stripMarkdown, truncateAtWord } from "./utils";

// bodyMarkdown is fetched only so the reading estimate can be computed
// from the real post rather than extrapolated from a snippet. withSnippet
// strips it before the list is returned, so it never reaches the client.
const POST_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  mainImage,
  publishedAt,
  "tags": tags[]->{ _id, title, "slug": slug.current },
  "snippet": coalesce(excerpt, string::split(bodyMarkdown, "\\n")[0]),
  bodyMarkdown,
}`;

function withSnippet(p: any) {
  const { bodyMarkdown, ...rest } = p;
  return {
    ...rest,
    snippet: truncateAtWord(stripMarkdown(p.snippet ?? ""), 200, "…"),
    words: wordCount(bodyMarkdown),
    readMinutes: estimateReadMinutes(bodyMarkdown),
  };
}

export type ListPostsOptions = {
  offset?: number;
  limit?: number;
  q?: string;
  tagSlugs?: string[];
};

export async function listPosts({
  offset = 0,
  limit = 10,
  q = "",
  tagSlugs = [],
}: ListPostsOptions = {}) {
  const filters: string[] = ['_type == "post"', "defined(publishedAt)"];
  const params: Record<string, any> = {};

  if (q) {
    // GROQ match is case-insensitive. We wildcard the value for partial matches.
    params.q = `*${q}*`;
    filters.push("(title match $q || bodyMarkdown match $q)");
  }

  if (tagSlugs.length > 0) {
    params.tagSlugs = tagSlugs;
    // Post has at least one tag whose slug is in $tagSlugs
    filters.push("count(tags[@->slug.current in $tagSlugs]) > 0");
  }

  const where = filters.join(" && ");

  const listQuery = `*[
    ${where}
  ] | order(publishedAt desc, _id desc) [${offset}...${offset + limit}] ${POST_PROJECTION}`;

  const countQuery = `count(*[${where}])`;

  const [posts, total] = await Promise.all([
    client.fetch<any[]>(listQuery, params),
    client.fetch<number>(countQuery, params),
  ]);

  const nextOffset = offset + posts.length;

  return {
    posts: posts.map(withSnippet),
    nextOffset,
    hasMore: nextOffset < total,
    total,
  };
}

export async function latestPosts(count = 3) {
  const query = `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc, _id desc) [0...${count}] ${POST_PROJECTION}`;
  const posts = await client.fetch<any[]>(query);
  return posts.map(withSnippet);
}

export async function listTags() {
  const query = `*[_type == "tag"] | order(title asc) {
    _id,
    title,
    "slug": slug.current
  }`;
  return client.fetch<any[]>(query);
}

// Card-level fields. Kept in one place so the projects index, the home
// page's featured strip, and the detail page's "more work" rail can't
// drift apart. Slug is flattened to a string here to match how posts are
// projected — the raw { current } shape only ever caused call-site noise.
const PROJECT_CARD_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  mainImage{ ..., "lqip": asset->metadata.lqip },
  description,
  stack,
  liveUrl,
  githubUrl,
  publishedAt,
  featured
}`;

export async function listProjects() {
  const query = `*[_type == "project" && defined(slug.current)]
    | order(publishedAt desc, _id desc) ${PROJECT_CARD_PROJECTION}`;
  return client.fetch<any[]>(query);
}

export async function featuredProjects(count = 2) {
  const query = `*[_type == "project" && defined(slug.current) && featured == true]
    | order(publishedAt desc, _id desc) [0...${count}] ${PROJECT_CARD_PROJECTION}`;
  return client.fetch<any[]>(query);
}

export async function listProjectSlugs() {
  const query = `*[_type == "project" && defined(slug.current)]
    | order(publishedAt desc, _id desc) { "slug": slug.current }.slug`;
  return client.fetch<string[]>(query);
}

/**
 * A project detail page plus the two neighbouring projects for the
 * prev/next rail. Returns null when the slug doesn't resolve so the
 * route can throw a proper 404 rather than rendering an empty shell.
 */
export async function getProject(slug: string) {
  const projectQuery = `*[_type == "project" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    mainImage{ ..., "lqip": asset->metadata.lqip },
    description,
    stack,
    liveUrl,
    githubUrl,
    publishedAt,
    featured,
    role,
    timeframe,
    outcome,
    bodyMarkdown,
    gallery
  }`;

  const project = await client.fetch<any | null>(projectQuery, { slug });
  if (!project) return null;

  const moreQuery = `*[_type == "project" && defined(slug.current) && slug.current != $slug]
    | order(publishedAt desc, _id desc) [0...2] {
      _id,
      title,
      "slug": slug.current
    }`;
  const more = await client.fetch<any[]>(moreQuery, { slug });

  return { project, more };
}

export type SiteSettings = {
  available: boolean;
  availabilityLabel: string;
  availabilityDetail: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  available: true,
  availabilityLabel: "AVAILABLE NOW",
  availabilityDetail: "OPEN TO NEW PROJECTS",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const s = await client.fetch<Partial<SiteSettings> | null>(
      `*[_type == "siteSettings"][0]{ available, availabilityLabel, availabilityDetail }`,
    );
    return {
      available: s?.available ?? DEFAULT_SETTINGS.available,
      availabilityLabel:
        s?.availabilityLabel || DEFAULT_SETTINGS.availabilityLabel,
      availabilityDetail:
        s?.availabilityDetail || DEFAULT_SETTINGS.availabilityDetail,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}



export async function siteStats() {
  const query = `{
    "projects": count(*[_type == "project"]),
    "posts": count(*[_type == "post" && defined(publishedAt)])
  }`;
  const { projects, posts } = await client.fetch<{
    projects: number;
    posts: number;
  }>(query);

  return {
    years: Math.max(0, new Date().getFullYear() - CAREER_START_YEAR),
    projects,
    posts,
  };
}
