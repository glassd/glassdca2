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
 * - Counters live in Postgres when DATABASE_URL is set, so they survive a
 *   deploy and hold across instances. Without it — and whenever a query
 *   fails — they fall back to per-process memory, which is the original
 *   behaviour. The contact form must never fail closed because the
 *   database is unreachable.
 */

import { isbot } from "isbot";
import { ensureSchema, getSql } from "./db.server";

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
export function rateLimitInMemory(ip: string, now: number): RateLimitResult {
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

/**
 * Sliding-window rate limiting per IP, durable when a database is
 * configured. The counter is incremented and read in a single atomic
 * upsert so concurrent submissions can't both slip under the limit.
 */
export async function rateLimit(
  ip: string,
  now: number,
): Promise<RateLimitResult> {
  const db = getSql();
  if (!db) return rateLimitInMemory(ip, now);

  try {
    await ensureSchema(db);
    const expiresAt = new Date(now + RATE_LIMIT_WINDOW_MS);
    const nowTs = new Date(now);

    const [row] = await db<{ count: number; expires_at: Date }[]>`
      INSERT INTO rate_limit (key, count, expires_at)
      VALUES (${ip}, 1, ${expiresAt})
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limit.expires_at <= ${nowTs} THEN 1
          ELSE rate_limit.count + 1
        END,
        expires_at = CASE
          WHEN rate_limit.expires_at <= ${nowTs} THEN ${expiresAt}
          ELSE rate_limit.expires_at
        END
      RETURNING count, expires_at
    `;

    if (row && row.count > RATE_LIMIT_MAX) {
      return {
        ok: false,
        retryAfterMs: Math.max(0, row.expires_at.getTime() - now),
      };
    }
    return { ok: true };
  } catch (error) {
    console.error("[abuse] rateLimit query failed, using memory:", {
      message: (error as Error)?.message || String(error),
    });
    return rateLimitInMemory(ip, now);
  }
}

export type DuplicateResult = { ok: true } | { ok: false };

/**
 * Throttle exact duplicate submissions (by content hash) within the rate limit window.
 * - If the same IP submits the same hash within the window, returns { ok: false }.
 */
export function throttleDuplicatesInMemory(
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
 * Throttle exact duplicate submissions (by content hash) within the
 * window, durable when a database is configured.
 */
export async function throttleDuplicates(
  ip: string,
  now: number,
  bodyHash: string,
): Promise<DuplicateResult> {
  const db = getSql();
  if (!db) return throttleDuplicatesInMemory(ip, now, bodyHash);

  try {
    await ensureSchema(db);
    const expiresAt = new Date(now + RATE_LIMIT_WINDOW_MS);
    const nowTs = new Date(now);

    // Only rows that are still live and carry a different hash may be
    // overwritten; a live row with the same hash leaves nothing updated,
    // which is exactly the duplicate case.
    const rows = await db<{ key: string }[]>`
      INSERT INTO submission_hash (key, hash, expires_at)
      VALUES (${ip}, ${bodyHash}, ${expiresAt})
      ON CONFLICT (key) DO UPDATE SET
        hash = ${bodyHash},
        expires_at = ${expiresAt}
      WHERE submission_hash.expires_at <= ${nowTs}
         OR submission_hash.hash <> ${bodyHash}
      RETURNING key
    `;

    return rows.length > 0 ? { ok: true } : { ok: false };
  } catch (error) {
    console.error("[abuse] throttleDuplicates query failed, using memory:", {
      message: (error as Error)?.message || String(error),
    });
    return throttleDuplicatesInMemory(ip, now, bodyHash);
  }
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
