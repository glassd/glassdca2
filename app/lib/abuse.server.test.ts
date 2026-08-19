import { describe, expect, it } from "vitest";
import {
  getClientIp,
  hashContent,
  isTooFast,
  MIN_SUBMIT_MS,
  originAllowed,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  rateLimit,
  rateLimitInMemory,
  throttleDuplicates,
  throttleDuplicatesInMemory,
} from "./abuse.server";

function req(headers: Record<string, string>) {
  return new Request("https://example.com/contact", { headers });
}

describe("getClientIp", () => {
  it("prefers the first X-Forwarded-For entry", () => {
    expect(getClientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe(
      "1.2.3.4",
    );
  });

  it("falls back to CF-Connecting-IP then X-Real-IP", () => {
    expect(getClientIp(req({ "cf-connecting-ip": "9.9.9.9" }))).toBe("9.9.9.9");
    expect(getClientIp(req({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
  });

  it("returns 'unknown' when no headers are present", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });
});

describe("isTooFast", () => {
  it("flags submissions faster than the minimum fill time", () => {
    const now = 1_000_000;
    expect(isTooFast(now, now - MIN_SUBMIT_MS + 1)).toBe(true);
    expect(isTooFast(now, now - MIN_SUBMIT_MS)).toBe(false);
  });

  it("flags missing or invalid start timestamps", () => {
    expect(isTooFast(1_000_000, 0)).toBe(true);
    expect(isTooFast(1_000_000, NaN)).toBe(true);
  });
});

describe("rateLimit", () => {
  it("allows up to RATE_LIMIT_MAX submissions per window", () => {
    const ip = "rate-limit-test-1";
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(rateLimitInMemory(ip, now + i).ok).toBe(true);
    }
    const blocked = rateLimitInMemory(ip, now + RATE_LIMIT_MAX);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(RATE_LIMIT_WINDOW_MS);
    }
  });

  it("resets the bucket after the window expires", () => {
    const ip = "rate-limit-test-2";
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMIT_MAX + 1; i++) rateLimitInMemory(ip, now);
    expect(rateLimitInMemory(ip, now + RATE_LIMIT_WINDOW_MS + 1).ok).toBe(true);
  });
});

describe("throttleDuplicates", () => {
  it("blocks an identical resubmission within the window", () => {
    const ip = "dup-test-1";
    const now = 1_000_000;
    const hash = hashContent("hello there");
    expect(throttleDuplicatesInMemory(ip, now, hash).ok).toBe(true);
    expect(throttleDuplicatesInMemory(ip, now + 1000, hash).ok).toBe(false);
  });

  it("allows different content from the same IP", () => {
    const ip = "dup-test-2";
    const now = 1_000_000;
    expect(throttleDuplicatesInMemory(ip, now, hashContent("first")).ok).toBe(true);
    expect(throttleDuplicatesInMemory(ip, now + 1, hashContent("second")).ok).toBe(
      true,
    );
  });

  it("allows the same content after the window expires", () => {
    const ip = "dup-test-3";
    const now = 1_000_000;
    const hash = hashContent("again");
    expect(throttleDuplicatesInMemory(ip, now, hash).ok).toBe(true);
    expect(
      throttleDuplicatesInMemory(ip, now + RATE_LIMIT_WINDOW_MS + 1, hash).ok,
    ).toBe(true);
  });
});

describe("hashContent", () => {
  it("is deterministic and non-negative", () => {
    expect(hashContent("abc")).toBe(hashContent("abc"));
    expect(Number(hashContent("some longer content"))).toBeGreaterThanOrEqual(
      0,
    );
  });

  it("differs for different content", () => {
    expect(hashContent("abc")).not.toBe(hashContent("abd"));
  });
});

describe("originAllowed", () => {
  const site = "https://glassd.ca";

  it("allows when no policy is configured", () => {
    expect(originAllowed(req({ origin: "https://evil.example" }))).toBe(true);
  });

  it("allows matching origin and blocks mismatched origin", () => {
    expect(originAllowed(req({ origin: "https://glassd.ca" }), site)).toBe(
      true,
    );
    expect(originAllowed(req({ origin: "https://evil.example" }), site)).toBe(
      false,
    );
  });

  it("falls back to referer and allows missing headers", () => {
    expect(
      originAllowed(req({ referer: "https://glassd.ca/contact" }), site),
    ).toBe(true);
    expect(originAllowed(req({}), site)).toBe(true);
  });
});


// Production runs without DATABASE_URL until Postgres is stood up, and any
// query failure takes the same path, so the fallback is the branch that
// most needs to be right.
describe("rate limiting without a database", () => {
  it("delegates to the in-memory limiter and allows up to the max", async () => {
    const ip = "203.0.113.77";
    const now = Date.now();
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await expect(rateLimit(ip, now)).resolves.toEqual({ ok: true });
    }
  });

  it("blocks past the max and reports a positive retry delay", async () => {
    const ip = "203.0.113.78";
    const now = Date.now();
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await rateLimit(ip, now);
    }
    const blocked = await rateLimit(ip, now);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
      expect(blocked.retryAfterMs).toBeLessThanOrEqual(RATE_LIMIT_WINDOW_MS);
    }
  });

  it("allows again once the window has elapsed", async () => {
    const ip = "203.0.113.79";
    const now = Date.now();
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await rateLimit(ip, now);
    }
    expect((await rateLimit(ip, now)).ok).toBe(false);
    const later = now + RATE_LIMIT_WINDOW_MS + 1;
    expect((await rateLimit(ip, later)).ok).toBe(true);
  });

  it("keeps separate counters per IP", async () => {
    const now = Date.now();
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      await rateLimit("203.0.113.80", now);
    }
    expect((await rateLimit("203.0.113.80", now)).ok).toBe(false);
    expect((await rateLimit("203.0.113.81", now)).ok).toBe(true);
  });
});

describe("duplicate throttling without a database", () => {
  it("rejects the same content twice from one IP inside the window", async () => {
    const ip = "203.0.113.90";
    const now = Date.now();
    const hash = hashContent("hello@example.com|Subject|Body");
    await expect(throttleDuplicates(ip, now, hash)).resolves.toEqual({
      ok: true,
    });
    await expect(throttleDuplicates(ip, now, hash)).resolves.toEqual({
      ok: false,
    });
  });

  it("allows different content from the same IP", async () => {
    const ip = "203.0.113.91";
    const now = Date.now();
    await throttleDuplicates(ip, now, hashContent("first"));
    expect((await throttleDuplicates(ip, now, hashContent("second"))).ok).toBe(
      true,
    );
  });

  it("allows the same content once the window has elapsed", async () => {
    const ip = "203.0.113.92";
    const now = Date.now();
    const hash = hashContent("same message");
    await throttleDuplicates(ip, now, hash);
    expect((await throttleDuplicates(ip, now, hash)).ok).toBe(false);
    const later = now + RATE_LIMIT_WINDOW_MS + 1;
    expect((await throttleDuplicates(ip, later, hash)).ok).toBe(true);
  });
});
