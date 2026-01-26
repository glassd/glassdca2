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
      className={`rounded-xl border border-border bg-card overflow-hidden shadow-sm ${className}`}
      {...rest}
    >
      {showImage && (
        <div className="relative w-full h-48 overflow-hidden">
          <div className="h-full w-full animate-pulse bg-muted" />
        </div>
      )}

      <div className="p-6">
        {/* Title line */}
        <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />

        {/* Date line */}
        <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted" />

        {/* Tag chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-block h-5 w-16 animate-pulse rounded-full bg-muted" />
          <span className="inline-block h-5 w-12 animate-pulse rounded-full bg-muted" />
          <span className="inline-block h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>

        {/* Snippet lines */}
        <div className="mt-3 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-3 w-10/12 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </article>
  );
}
