import type { HTMLAttributes } from "react";

export interface SkeletonCardProps extends HTMLAttributes<HTMLElement> {
  className?: string;
  showImage?: boolean;
}

export default function SkeletonCard({
  className = "",
  showImage = true,
  ...rest
}: SkeletonCardProps) {
  return (
    <article
      aria-hidden="true"
      className={`rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm ${className}`}
      {...rest}
    >
      {showImage && (
        <div className="relative w-full h-48 overflow-hidden">
          <div className="h-full w-full animate-pulse bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800" />
        </div>
      )}

      <div className="p-4">
        {/* Title line */}
        <div className="h-5 w-3/4 animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />

        {/* Date line */}
        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

        {/* Tag chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-block h-5 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <span className="inline-block h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <span className="inline-block h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Snippet lines */}
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-3 w-10/12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </article>
  );
}
