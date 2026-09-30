import { describe, expect, it } from "vitest";
import { projectYear } from "./projects";

describe("projectYear", () => {
  it("uses the shipped year when it is set", () => {
    expect(
      projectYear({ year: 2024, publishedAt: "2025-12-17T00:09:00.000Z" }),
    ).toBe("2024");
  });

  it("falls back to the publish date", () => {
    expect(projectYear({ publishedAt: "2026-01-06T23:17:00.000Z" })).toBe(
      "2026",
    );
    expect(
      projectYear({ year: null, publishedAt: "2026-01-06T23:17:00.000Z" }),
    ).toBe("2026");
  });

  it("returns null when there is nothing usable", () => {
    expect(projectYear({})).toBeNull();
    expect(projectYear({ publishedAt: "not a date" })).toBeNull();
  });
});
