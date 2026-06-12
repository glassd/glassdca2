import { client } from "./sanity";
import { stripMarkdown, truncateAtWord } from "./utils";

const POST_PROJECTION = `{
  _id,
  title,
  "slug": slug.current,
  mainImage,
  publishedAt,
  "tags": tags[]->{ _id, title, "slug": slug.current },
  "snippet": coalesce(excerpt, string::split(bodyMarkdown, "\\n")[0]),
}`;

function withSnippet(p: any) {
  return {
    ...p,
    snippet: truncateAtWord(stripMarkdown(p.snippet ?? ""), 200, "…"),
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

export async function listProjects() {
  const query = `*[_type == "project"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    mainImage,
    description,
    stack,
    liveUrl,
    githubUrl,
    publishedAt
  }`;
  return client.fetch<any[]>(query);
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

const CODING_SINCE_YEAR = 2012;

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
    years: Math.max(0, new Date().getFullYear() - CODING_SINCE_YEAR),
    projects,
    posts,
  };
}
