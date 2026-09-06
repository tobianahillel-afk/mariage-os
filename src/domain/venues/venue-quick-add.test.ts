import { describe, expect, it } from "vitest";
import { normalizeVenueQuickAdd } from "./venue-quick-add";

describe("normalizeVenueQuickAdd normalization", () => {
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
});

describe("normalizeVenueQuickAdd validation", () => {
  it("validates required name and field length limits", () => {
    const blankName = normalizeVenueQuickAdd({ name: "   " });
    const longName = normalizeVenueQuickAdd({ name: "x".repeat(241) });
    const longCode = normalizeVenueQuickAdd({
      name: "Venue",
      code: "x".repeat(41),
    });
    const longCity = normalizeVenueQuickAdd({
      name: "Venue",
      city: "x".repeat(161),
    });

    expect(blankName).toEqual({ ok: false, error: "name_required" });
    expect(longName).toEqual({ ok: false, error: "name_too_long" });
    expect(longCode).toEqual({ ok: false, error: "code_too_long" });
    expect(longCity).toEqual({ ok: false, error: "city_too_long" });
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

  it("enforces website length before parsing", () => {
    const websiteUrl = `https://example.invalid/${"x".repeat(2_100)}`;
    const result = normalizeVenueQuickAdd({ name: "Venue", websiteUrl });

    expect(result).toEqual({ ok: false, error: "website_url_too_long" });
  });

  it("accepts http and rejects unsupported schemes", () => {
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
});
