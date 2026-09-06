import { describe, expect, it } from "vitest";
import { normalizeVenueQuickAdd } from "./venue-quick-add";

describe("normalizeVenueQuickAdd", () => {
  it("normalizes the minimal quick-add fields", () => {
    const result = normalizeVenueQuickAdd({
      name: "  Venue Alpha  ",
      code: " P2 ",
      websiteUrl: " https://example.invalid/venue ",
      city: " Paris ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: "Venue Alpha",
        code: "P2",
        websiteUrl: "https://example.invalid/venue",
        city: "Paris",
      },
    });
  });

  it("normalizes omitted and blank optional fields to null", () => {
    const result = normalizeVenueQuickAdd({
      name: "Venue Alpha",
      code: "   ",
    });

    expect(result).toEqual({
      ok: true,
      value: {
        name: "Venue Alpha",
        code: null,
        websiteUrl: null,
        city: null,
      },
    });
  });

  it("requires a nonblank name", () => {
    const result = normalizeVenueQuickAdd({ name: "   " });

    expect(result).toEqual({
      ok: false,
      error: "name_required",
    });
  });

  it("enforces the name length limit", () => {
    const result = normalizeVenueQuickAdd({ name: "x".repeat(241) });

    expect(result).toEqual({
      ok: false,
      error: "name_too_long",
    });
  });

  it("enforces the code length limit", () => {
    const result = normalizeVenueQuickAdd({
      name: "Venue",
      code: "x".repeat(41),
    });

    expect(result).toEqual({ ok: false, error: "code_too_long" });
  });

  it("rejects dangerous and malformed website URLs", () => {
    const dangerous = normalizeVenueQuickAdd({
      name: "Venue",
      websiteUrl: "javascript:x",
    });
    const malformed = normalizeVenueQuickAdd({
      name: "Venue",
      websiteUrl: "not a url",
    });

    expect(dangerous).toEqual({ ok: false, error: "website_url_invalid" });
    expect(malformed).toEqual({ ok: false, error: "website_url_invalid" });
  });

  it("enforces the website URL length limit before parsing", () => {
    const websiteUrl = `https://example.invalid/${"x".repeat(2_100)}`;
    const result = normalizeVenueQuickAdd({ name: "Venue", websiteUrl });

    expect(result).toEqual({ ok: false, error: "website_url_too_long" });
  });

  it("accepts legacy http navigation references but rejects other schemes", () => {
    const httpResult = normalizeVenueQuickAdd({
      name: "Venue",
      websiteUrl: "http://example.invalid/venue",
    });
    const dataResult = normalizeVenueQuickAdd({
      name: "Venue",
      websiteUrl: "data:text/plain,x",
    });

    expect(httpResult.ok).toBe(true);
    expect(dataResult).toEqual({ ok: false, error: "website_url_invalid" });
  });

  it("enforces the city length limit", () => {
    const result = normalizeVenueQuickAdd({
      name: "Venue",
      city: "x".repeat(161),
    });

    expect(result).toEqual({ ok: false, error: "city_too_long" });
  });
});
