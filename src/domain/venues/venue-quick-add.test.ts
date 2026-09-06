import { describe, expect, it } from "vitest";
import { normalizeVenueQuickAdd } from "./venue-quick-add";

describe("normalizeVenueQuickAdd", () => {
  it("normalizes the minimal quick-add fields", () => {
    expect(
      normalizeVenueQuickAdd({
        name: "  Venue Alpha  ",
        code: " P2 ",
        websiteUrl: " https://example.invalid/venue ",
        city: " Paris ",
      }),
    ).toEqual({
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
    expect(
      normalizeVenueQuickAdd({ name: "Venue Alpha", code: "   " }),
    ).toEqual({
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
    expect(normalizeVenueQuickAdd({ name: "   " })).toEqual({
      ok: false,
      error: "name_required",
    });
  });

  it("enforces the name length limit", () => {
    expect(normalizeVenueQuickAdd({ name: "x".repeat(241) })).toEqual({
      ok: false,
      error: "name_too_long",
    });
  });

  it("enforces the code length limit", () => {
    expect(
      normalizeVenueQuickAdd({ name: "Venue", code: "x".repeat(41) }),
    ).toEqual({ ok: false, error: "code_too_long" });
  });

  it("rejects dangerous and malformed website URLs", () => {
    expect(
      normalizeVenueQuickAdd({ name: "Venue", websiteUrl: "javascript:x" }),
    ).toEqual({ ok: false, error: "website_url_invalid" });
    expect(
      normalizeVenueQuickAdd({ name: "Venue", websiteUrl: "not a url" }),
    ).toEqual({ ok: false, error: "website_url_invalid" });
  });

  it("enforces the website URL length limit before parsing", () => {
    expect(
      normalizeVenueQuickAdd({
        name: "Venue",
        websiteUrl: `https://example.invalid/${"x".repeat(2_100)}`,
      }),
    ).toEqual({ ok: false, error: "website_url_too_long" });
  });

  it("accepts legacy http navigation references but rejects other schemes", () => {
    expect(
      normalizeVenueQuickAdd({
        name: "Venue",
        websiteUrl: "http://example.invalid/venue",
      }).ok,
    ).toBe(true);
    expect(
      normalizeVenueQuickAdd({ name: "Venue", websiteUrl: "data:text/plain,x" }),
    ).toEqual({ ok: false, error: "website_url_invalid" });
  });

  it("enforces the city length limit", () => {
    expect(
      normalizeVenueQuickAdd({ name: "Venue", city: "x".repeat(161) }),
    ).toEqual({ ok: false, error: "city_too_long" });
  });
});
