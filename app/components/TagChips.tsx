import type { HTMLAttributes } from "react";
import { useId } from "react";

export type TagChip = {
  _id: string;
  title: string;
  slug: string;
};

export interface TagChipsProps extends Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  "onToggle"
> {
  tags: TagChip[];
  selected: string[];
  onToggle: (slug: string) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
  hideLabel?: boolean;
}

/**
 * TagChips
 * Accessible tag selector using checkbox semantics, styled as "chips".
 * - Keyboard accessible: Tab to a chip, Space/Enter toggles it
 * - Screen readers: Each chip is an actual checkbox with an accessible label
 * - Visual: Clear, focus-visible rings, selected vs unselected states
 */
export default function TagChips({
  tags,
  selected,
  onToggle,
  onClear,
  label = "Filter by tags",
  className = "",
  hideLabel = false,
  ...rest
}: TagChipsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const reactId = useId();
  const labelId = `tagchips-label-${reactId}`;
  const descId = `tagchips-desc-${reactId}`;
  const hasSelection = selected.length > 0;

  return (
    <fieldset
      className={`rounded-xl border border-border bg-card ${className}`}
      {...rest}
      aria-describedby={descId}
      aria-labelledby={labelId}
    >
      <legend
        id={labelId}
        className={
          hideLabel
            ? "sr-only"
            : "px-3 py-2 text-sm font-medium text-foreground"
        }
      >
        {label}
      </legend>

      <div className="px-3 pb-3 -mt-1">
        <p id={descId} className="sr-only">
          Use the arrow keys and spacebar to toggle one or more tags. Press
          Clear to reset.
        </p>

        {/* Controls row */}
        <div className="mb-3 flex items-center gap-2">
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              disabled={!hasSelection}
              className={`inline-flex items-center rounded-lg border px-2.5 py-1.5 text-xs font-medium transition
                ${
                  hasSelection
                    ? "border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                    : "border-border/50 text-muted-foreground/50 cursor-not-allowed"
                }`}
              aria-disabled={!hasSelection}
              aria-label="Clear selected tags"
            >
              Clear
            </button>
          )}
          {hasSelection && (
            <span
              className="text-xs text-muted-foreground"
              aria-live="polite"
            >
              {selected.length} selected
            </span>
          )}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const checked = selected.includes(t.slug);
            return (
              <label
                key={t._id}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm cursor-pointer transition
                  focus-within:outline-none focus-within:ring-2 focus-within:ring-primary
                  ${
                    checked
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => onToggle(t.slug)}
                  aria-label={`Filter by ${t.title}`}
                />
                <span aria-hidden="true">#{t.title}</span>
              </label>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
