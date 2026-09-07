import { expect, it } from "vitest";
import type { FactValueDefinition } from "./fact-value";
import {
  normalizeFactInstant,
  normalizeFactObservation,
} from "./fact-observation";

const booleanDefinition: FactValueDefinition = {
  valueType: "boolean",
  optionsJson: null,
};

const validDraft = {
  value: false,
  rawValueText: "Non, confirmé par email",
  evidenceLevel: "confirmed_for_event",
  confidence: "high",
  observedAt: "2026-09-07T08:15:30+02:00",
  note: "Configuration du couple confirmée",
} as const;

it("preserves known false and keeps evidence separate from confidence", () => {
  expect(normalizeFactObservation(booleanDefinition, validDraft)).toEqual({
    ok: true,
    value: {
      value: false,
      rawValueText: "Non, confirmé par email",
      evidenceLevel: "confirmed_for_event",
      confidence: "high",
      observedAt: "2026-09-07T06:15:30.000Z",
      note: "Configuration du couple confirmée",
    },
  });
});

it("allows observation evidence with no normalized value and nullable context", () => {
  expect(
    normalizeFactObservation(booleanDefinition, {
      ...validDraft,
      value: null,
      rawValueText: null,
      note: null,
    }),
  ).toMatchObject({
    ok: true,
    value: { value: null, rawValueText: null, note: null },
  });
});

it("rejects an observation value incompatible with its definition", () => {
  expect(
    normalizeFactObservation(booleanDefinition, {
      ...validDraft,
      value: "false",
    }),
  ).toEqual({ ok: false, error: "invalid_observation_value" });
});

it("rejects invalid raw observation evidence text", () => {
  for (const rawValueText of [42, "x".repeat(5001), "\ud800"] as const) {
    expect(
      normalizeFactObservation(booleanDefinition, {
        ...validDraft,
        rawValueText,
      }),
    ).toEqual({ ok: false, error: "invalid_raw_value_text" });
  }
});

it("rejects evidence level and confidence independently", () => {
  expect(
    normalizeFactObservation(booleanDefinition, {
      ...validDraft,
      evidenceLevel: "high",
    }),
  ).toEqual({ ok: false, error: "invalid_evidence_level" });
  expect(
    normalizeFactObservation(booleanDefinition, {
      ...validDraft,
      confidence: "contractual",
    }),
  ).toEqual({ ok: false, error: "invalid_confidence" });
});

it("normalizes PostgreSQL microsecond precision to canonical milliseconds", () => {
  expect(normalizeFactInstant("2026-09-07T06:15:30.123456Z")).toBe(
    "2026-09-07T06:15:30.123Z",
  );
  expect(normalizeFactInstant("2026-09-07T08:15:30.654321+02:00")).toBe(
    "2026-09-07T06:15:30.654Z",
  );
  expect(
    normalizeFactObservation(booleanDefinition, {
      ...validDraft,
      observedAt: "2026-09-07T06:15:30.987654+00:00",
    }),
  ).toMatchObject({
    ok: true,
    value: { observedAt: "2026-09-07T06:15:30.987Z" },
  });
});

it("rejects malformed, over-precision and non-finite observation timestamps", () => {
  for (const observedAt of [
    42,
    "2026-09-07",
    "not-a-date",
    "2026-09-07T06:15:30.1234567Z",
    "infinity",
    "-infinity",
  ] as const) {
    expect(
      normalizeFactObservation(booleanDefinition, {
        ...validDraft,
        observedAt,
      }),
    ).toEqual({ ok: false, error: "invalid_observed_at" });
  }
  expect(normalizeFactInstant("2026-09-07T06:15:30Z")).toBe(
    "2026-09-07T06:15:30.000Z",
  );
  expect(normalizeFactInstant("2026-13-99T06:15:30Z")).toBeNull();
});

it("rejects impossible Gregorian calendar and clock components", () => {
  for (const observedAt of [
    "0000-01-01T00:00:00Z",
    "2026-00-01T00:00:00Z",
    "2026-13-01T00:00:00Z",
    "2026-01-00T00:00:00Z",
    "2026-04-31T00:00:00Z",
    "1900-02-29T00:00:00Z",
    "2026-01-01T24:00:00Z",
    "2026-01-01T23:60:00Z",
    "2026-01-01T23:59:60Z",
  ]) {
    expect(normalizeFactInstant(observedAt)).toBeNull();
  }
  expect(normalizeFactInstant("2000-02-29T23:59:59Z")).toBe(
    "2000-02-29T23:59:59.000Z",
  );
  expect(normalizeFactInstant("0099-12-31T23:59:59Z")).toBe(
    "0099-12-31T23:59:59.000Z",
  );
});

it("enforces bounded offsets and the four-digit canonical UTC domain", () => {
  expect(normalizeFactInstant("2026-01-01T12:00:00+14:00")).toBe(
    "2025-12-31T22:00:00.000Z",
  );
  expect(normalizeFactInstant("2026-01-01T12:00:00-14:00")).toBe(
    "2026-01-02T02:00:00.000Z",
  );
  for (const observedAt of [
    "2026-01-01T12:00:00+00:60",
    "2026-01-01T12:00:00+14:01",
    "2026-01-01T12:00:00-14:01",
    "2026-01-01T12:00:00+15:00",
    "10000-01-01T00:00:00Z",
    "0001-01-01T00:00:00+14:00",
    "9999-12-31T23:59:59-14:00",
  ]) {
    expect(normalizeFactInstant(observedAt)).toBeNull();
  }
  expect(normalizeFactInstant("0001-01-01T00:00:00Z")).toBe(
    "0001-01-01T00:00:00.000Z",
  );
  expect(normalizeFactInstant("9999-12-31T23:59:59.999999Z")).toBe(
    "9999-12-31T23:59:59.999Z",
  );
});

it("rejects invalid bounded observation notes", () => {
  for (const note of [42, "x".repeat(5001)] as const) {
    expect(
      normalizeFactObservation(booleanDefinition, {
        ...validDraft,
        note,
      }),
    ).toEqual({ ok: false, error: "invalid_observation_note" });
  }
});
