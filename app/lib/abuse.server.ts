/**
 * Abuse/spam hardening utilities (server-only)
 *
 * Features:
 * - Per-IP sliding-window rate limiting (in-memory)
 * - Minimum fill-time check to block obvious bots
 * - Simple duplicate-submission throttle by hashed content
 * - User-Agent bot detection using `isbot`
 *
 * Notes:
 * - This implementation keeps counters in memory (per server process).
 *   For multi-instance deployments or serverless/edge, use a shared store (Redis/KV) instead.
 */

import { isbot } from "isbot";

/**
 * Configuration via environment variables (with sensible defaults).
 *
 * RATE_LIMIT_MAX:        maximum allowed actions per window (default: 3)
 * RATE_LIMIT_WINDOW_MS:  sliding window in milliseconds (default: 10 minutes)
 * MIN_SUBMIT_MS:         minimum time (ms) between form render and submit (default: 2500ms)
 */
export const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || "3");
export const RATE_LIMIT_WINDOW_MS = Number(
  process.env.RATE_LIMIT_WINDOW_MS || "600000",
); // 10m
export const MIN_SUBMIT_MS = Number(process.env.MIN_SUBMIT_MS || "2500"); // 2.5s

/**
 * In-memory per-IP counters and duplicate detection store.
 * The `expiresAt` timestamps allow opportunistic cleanup.
 */
type Bucket = { count: number; expiresAt: number };
type LastHash = { hash: string; expiresAt: number };

const ipBuckets: Map<string, Bucket> = new Map();
const ipLastHash: Map<string, LastHash> = new Map();

/**
 * Extract a best-effort client IP from a Request.
 * Priority: X-Forwarded-For (first), CF-Connecting-IP, X-Real-IP, else "unknown".
 */
export function getClientIp(req: Request): string {
  const xfwd = req.headers.get("x-forwarded-for");
  const cf = req.headers.get("cf-connecting-ip");
  const realIp =
    xfwd
      ?.split(",")
      .map((s) => s.trim())
      .shift() ||
    cf ||
    req.headers.get("x-real-ip");
  return realIp || "unknown";
}

/**
 * Basic bot detection based on User-Agent using `isbot`.
 */
export function looksLikeBot(req: Request): boolean {
  const ua = req.headers.get("user-agent") || "";

  // Handle different isbot export shapes without changing the import:
  // - default export is a function
  // - named export isbot
  // - default property holding the function (common in CJS/ESM interop)
  const impl = isbot as unknown as
    | ((ua: string) => boolean)
    | { default?: (ua: string) => boolean; isbot?: (ua: string) => boolean };

  try {
    if (typeof impl === "function") return impl(ua);
    if (impl && typeof impl.default === "function") return impl.default(ua);
    if (impl && typeof impl.isbot === "function") return impl.isbot(ua);
  } catch {
    // fall through to non-bot if detection fails
  }

  return false;
}

/**
 * Return true if the submission was made too quickly after render.
 * Provide `now` = Date.now() and `startedAt` from a hidden input set when rendering the form.
 */
export function isTooFast(now: number, startedAt: number): boolean {
  if (!startedAt || Number.isNaN(startedAt)) return true;
  return now - startedAt < MIN_SUBMIT_MS;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

/**
 * Sliding-window rate limiting per IP.
 * - Increments the counter for the given IP.
 * - Returns { ok: false, retryAfterMs } if limit exceeded.
 */
export function rateLimit(ip: string, now: number): RateLimitResult {
  const current = ipBuckets.get(ip);

  // Initialize or reset expired bucket
  if (!current || current.expiresAt <= now) {
    ipBuckets.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    // Opportunistic cleanup of a few expired entries to control growth
    cleanupExpired(ipBuckets, now);
    return { ok: true };
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfterMs: Math.max(0, current.expiresAt - now) };
  }

  current.count += 1;
  return { ok: true };
}

export type DuplicateResult = { ok: true } | { ok: false };

/**
 * Throttle exact duplicate submissions (by content hash) within the rate limit window.
 * - If the same IP submits the same hash within the window, returns { ok: false }.
 */
export function throttleDuplicates(
  ip: string,
  now: number,
  bodyHash: string,
): DuplicateResult {
  const prev = ipLastHash.get(ip);

  if (prev && prev.expiresAt > now && prev.hash === bodyHash) {
    return { ok: false };
  }

  ipLastHash.set(ip, { hash: bodyHash, expiresAt: now + RATE_LIMIT_WINDOW_MS });
  // Opportunistic cleanup
  cleanupExpired(ipLastHash, now);
  return { ok: true };
}

/**
 * Tiny non-cryptographic hash for duplicate detection.
 * Do NOT use for security sensitive contexts.
 */
export function hashContent(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return String(h >>> 0); // ensure non-negative string
}

/**
 * Validate a Referer/Origin header against an allowed site URL (optional hardening).
 * Provide your site URL (e.g., process.env.PUBLIC_SITE_URL).
 */
export function originAllowed(req: Request, siteUrl?: string): boolean {
  if (!siteUrl) return true; // no policy configured
  try {
    const origin = req.headers.get("origin") || req.headers.get("referer");
    if (!origin) return true; // allow when not provided (some clients strip it)
    const allowHost = new URL(siteUrl).host;
    const receivedHost = new URL(origin).host;
    return allowHost === receivedHost;
  } catch {
    return false;
  }
}

/**
 * Opportunistically remove expired entries from a Map store to bound memory usage.
 */
function cleanupExpired<T extends { expiresAt: number }>(
  store: Map<string, T>,
  now: number,
) {
  // Iterate over a limited number of entries to avoid heavy work on hot paths
  let scanned = 0;
  for (const [key, value] of store) {
    if (value.expiresAt <= now) {
      store.delete(key);
    }
    if (++scanned >= 50) break; // cap per invocation
  }
}
