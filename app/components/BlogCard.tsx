import { urlFor } from "../lib/sanity";

export interface BlogCardTag {
  _id: string;
  title: string;
  slug: string;
}

export interface BlogCardProps {
  title: string;
  slug: string;
  mainImage?: any;
  tags?: BlogCardTag[];
  snippet: string;
  publishedAt?: string | null;
  className?: string;
}

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default function BlogCard({
  title,
  slug,
  mainImage,
  tags = [],
  snippet,
  publishedAt,
  className = "",
}: BlogCardProps) {
  const img = mainImage
    ? urlFor(mainImage).width(800).height(450).fit("crop").url()
    : null;

  const prettyDate = formatDate(publishedAt);

  return (
    <article
      className={`group rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <a
        href={`/blog/${slug}`}
        className="block focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {img && (
          <div className="relative w-full h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={img}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <div className="p-4">
          <header className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">
              {title}
            </h3>
            {prettyDate && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {prettyDate}
              </p>
            )}
          </header>

          {tags?.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t._id}
                  className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
                >
                  {t.title}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {snippet}
          </p>
        </div>
      </a>
    </article>
  );
}
