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

it("rejects malformed observation timestamps", () => {
  for (const observedAt of [42, "2026-09-07", "not-a-date"] as const) {
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
