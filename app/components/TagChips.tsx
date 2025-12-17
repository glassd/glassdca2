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
      className={`rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 ${className}`}
      {...rest}
      aria-describedby={descId}
      aria-labelledby={labelId}
    >
      <legend
        id={labelId}
        className={
          hideLabel
            ? "sr-only"
            : "px-3 py-2 text-sm font-medium text-gray-900 dark:text-gray-100"
        }
      >
        {label}
      </legend>

      <div className="px-3 pb-2 -mt-1">
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
              className={`inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs font-medium transition
                ${
                  hasSelection
                    ? "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    : "border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
              aria-disabled={!hasSelection}
              aria-label="Clear selected tags"
            >
              Clear
            </button>
          )}
          {hasSelection && (
            <span
              className="text-xs text-gray-500 dark:text-gray-400"
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
                  focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500
                  ${
                    checked
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                      : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
