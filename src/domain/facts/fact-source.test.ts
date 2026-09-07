import { expect, it } from "vitest";
import { normalizeFactSource } from "./fact-source";

const validDraft = {
  sourceType: "written_confirmation",
  title: " Venue email ",
  url: "https://venue.example/confirmation",
  evidenceLevel: "confirmed_for_event",
  observedAt: "2026-09-07T08:20:00+02:00",
  notes: "Email from the venue team",
  status: "active",
} as const;

it("normalizes fact source display title and timestamp without deriving evidence", () => {
  expect(normalizeFactSource(validDraft)).toEqual({
    ok: true,
    value: {
      sourceType: "written_confirmation",
      title: "Venue email",
      url: "https://venue.example/confirmation",
      evidenceLevel: "confirmed_for_event",
      observedAt: "2026-09-07T06:20:00.000Z",
      notes: "Email from the venue team",
      status: "active",
    },
  });
});

it("allows nullable optional fact source metadata", () => {
  expect(
    normalizeFactSource({
      ...validDraft,
      title: null,
      url: null,
      observedAt: null,
      notes: null,
    }),
  ).toMatchObject({
    ok: true,
    value: { title: null, url: null, observedAt: null, notes: null },
  });
});

it("rejects unknown fact source vocabulary", () => {
  expect(normalizeFactSource({ ...validDraft, sourceType: "email" })).toEqual(
    {
      ok: false,
      error: "invalid_source_type",
    },
  );
  expect(
    normalizeFactSource({ ...validDraft, evidenceLevel: "high" }),
  ).toEqual({
    ok: false,
    error: "invalid_evidence_level",
  });
  expect(normalizeFactSource({ ...validDraft, status: "deleted" })).toEqual({
    ok: false,
    error: "invalid_source_status",
  });
});

it("rejects malformed or empty fact source titles", () => {
  for (const title of [42, "   ", "x".repeat(241), "\ud800"] as const) {
    expect(normalizeFactSource({ ...validDraft, title })).toEqual({
      ok: false,
      error: "invalid_source_title",
    });
  }
});

it("rejects unsafe or malformed fact source URLs", () => {
  for (const url of [
    42,
    "javascript:alert(1)",
    "https://-bad.example",
  ] as const) {
    expect(normalizeFactSource({ ...validDraft, url })).toEqual({
      ok: false,
      error: "invalid_source_url",
    });
  }
});

it("rejects malformed fact source timestamps", () => {
  expect(
    normalizeFactSource({ ...validDraft, observedAt: "7 September 2026" }),
  ).toEqual({ ok: false, error: "invalid_source_observed_at" });
});

it("rejects invalid fact source notes", () => {
  for (const notes of [42, "x".repeat(5001), "\udc00"] as const) {
    expect(normalizeFactSource({ ...validDraft, notes })).toEqual({
      ok: false,
      error: "invalid_source_notes",
    });
  }
});
