/**
 * Thin wrapper over the Umami tracker.
 *
 * Every call is a no-op unless the script has actually loaded, so events
 * can be fired unconditionally from components — nothing here throws when
 * analytics is disabled (local dev, or a deploy with no UMAMI_* env set),
 * and no caller needs to guard.
 */

type UmamiEventData = Record<string, string | number | boolean>;

type UmamiGlobal = {
  track: (event: string, data?: UmamiEventData) => void;
};

function umami(): UmamiGlobal | null {
  if (typeof window === "undefined") return null;
  const u = (window as unknown as { umami?: UmamiGlobal }).umami;
  return typeof u?.track === "function" ? u : null;
}

export function track(event: string, data?: UmamiEventData) {
  try {
    umami()?.track(event, data);
  } catch {
    // Analytics must never break the page it is measuring.
  }
}

/** Events are named here so the dashboard can't drift from the source. */
export const EVENTS = {
  /** A visitor left for a project's live site or source. */
  projectOutbound: "project-outbound",
  /** A visitor started filling in the contact form. */
  contactStart: "contact-start",
  /** The contact form was submitted. */
  contactSubmit: "contact-submit",
  /** A reader passed a scroll-depth milestone on a post. */
  postDepth: "post-depth",
} as const;
