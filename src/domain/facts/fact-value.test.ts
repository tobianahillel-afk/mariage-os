import { describe, expect, it } from "vitest";
import { normalizeFactValue, type FactValueDefinition } from "./fact-value";

const definition = (
  valueType: FactValueDefinition["valueType"],
  optionsJson: FactValueDefinition["optionsJson"] = null,
): FactValueDefinition => ({ valueType, optionsJson });

const selectMetadata = {
  options: [
    { key: "low", labelKey: "criteria.low" },
    { key: "medium", labelKey: "criteria.medium" },
    { key: "high", labelKey: "criteria.high" },
  ],
} as const;

describe("canonical fact values", () => {
  it.each([
    [definition("boolean"), false, false],
    [definition("number"), 0, 0],
    [
      definition("money"),
      { minor: 0, currency: "EUR" },
      { minor: 0, currency: "EUR" },
    ],
    [definition("text"), "", ""],
    [definition("date"), "2028-02-29", "2028-02-29"],
    [
      definition("time"),
      { time: "01:30", dayOffset: 1 },
      { time: "01:30", dayOffset: 1 },
    ],
    [definition("rating"), 7.5, 7.5],
    [definition("select", selectMetadata), "medium", "medium"],
    [definition("duration"), 135, 135],
    [definition("distance"), 12_500, 12_500],
    [
      definition("url"),
      "https://example.invalid/path",
      "https://example.invalid/path",
    ],
  ] as const)("accepts canonical value %#", (factDefinition, raw, expected) => {
    expect(normalizeFactValue(factDefinition, raw)).toEqual({
      ok: true,
      value: expected,
    });
  });

  it("canonicalizes multiselect values by stable key order", () => {
    expect(
      normalizeFactValue(definition("multiselect", selectMetadata), [
        "high",
        "low",
      ]),
    ).toEqual({ ok: true, value: ["high", "low"] });
    expect(
      normalizeFactValue(definition("multiselect", selectMetadata), [
        "low",
        "high",
      ]),
    ).toEqual({ ok: true, value: ["high", "low"] });
    expect(
      normalizeFactValue(definition("multiselect", selectMetadata), []),
    ).toEqual({
      ok: true,
      value: [],
    });
  });
});

describe("numeric, rating, duration and distance validation", () => {
  it("applies configured numeric bounds and integer semantics", () => {
    const constrained = definition("number", {
      min: 0,
      max: 10,
      integer: true,
    });
    expect(normalizeFactValue(constrained, 10).ok).toBe(true);
    for (const raw of [
      Number.NaN,
      "1",
      1.5,
      -1,
      11,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(normalizeFactValue(constrained, raw)).toEqual({
        ok: false,
        error: "invalid_fact_value",
      });
    }
  });

  it("uses 0..10 as the default rating scale and honors overrides", () => {
    expect(normalizeFactValue(definition("rating"), 0).ok).toBe(true);
    expect(normalizeFactValue(definition("rating"), 10).ok).toBe(true);
    expect(normalizeFactValue(definition("rating"), -0.1).ok).toBe(false);
    expect(normalizeFactValue(definition("rating"), 10.1).ok).toBe(false);
    expect(
      normalizeFactValue(
        definition("rating", { min: 1, max: 5, integer: true }),
        3,
      ).ok,
    ).toBe(true);
    expect(
      normalizeFactValue(
        definition("rating", { min: 1, max: 5, integer: true }),
        3.5,
      ).ok,
    ).toBe(false);
  });

  it.each(["duration", "distance"] as const)(
    "requires non-negative safe integer %s values",
    (valueType) => {
      expect(
        normalizeFactValue(definition(valueType, { max: 20 }), 20).ok,
      ).toBe(true);
      for (const raw of [-1, 1.5, 21, Number.MAX_SAFE_INTEGER + 1]) {
        expect(
          normalizeFactValue(definition(valueType, { max: 20 }), raw).ok,
        ).toBe(false);
      }
    },
  );
});

describe("money, time, date and URL validation", () => {
  it.each([
    null,
    [],
    { minor: 1 },
    { minor: 1, currency: "EUR", extra: true },
    { minor: 1.5, currency: "EUR" },
    { minor: -1, currency: "EUR" },
    { minor: Number.MAX_SAFE_INTEGER + 1, currency: "EUR" },
    { minor: 1, currency: "eur" },
    { minor: 1, currency: 1 },
  ])("rejects malformed money %#", (raw) => {
    expect(normalizeFactValue(definition("money"), raw).ok).toBe(false);
  });

  it.each([
    null,
    { time: "22:00" },
    { time: "22:00", dayOffset: 0, extra: true },
    { time: 22, dayOffset: 0 },
    { time: "24:00", dayOffset: 0 },
    { time: "22:00", dayOffset: 0.5 },
    { time: "22:00", dayOffset: -1 },
    { time: "22:00", dayOffset: 3 },
  ])("rejects malformed time %#", (raw) => {
    expect(normalizeFactValue(definition("time"), raw).ok).toBe(false);
  });

  it("rejects malformed and impossible civil dates", () => {
    expect(normalizeFactValue(definition("date"), 20270101).ok).toBe(false);
    expect(normalizeFactValue(definition("date"), "2027-1-01").ok).toBe(false);
    expect(normalizeFactValue(definition("date"), "2027-02-29").ok).toBe(false);
    expect(normalizeFactValue(definition("date"), "2027-13-01").ok).toBe(false);
  });

  it("accepts http/https and rejects unsafe, malformed and oversized URLs", () => {
    expect(
      normalizeFactValue(definition("url"), "http://example.invalid").ok,
    ).toBe(true);
    expect(
      normalizeFactValue(definition("url"), "javascript:alert(1)").ok,
    ).toBe(false);
    expect(normalizeFactValue(definition("url"), "not a url").ok).toBe(false);
    expect(normalizeFactValue(definition("url"), 1).ok).toBe(false);
    expect(
      normalizeFactValue(
        definition("url"),
        "https://example.invalid/\u0000bad",
      ).ok,
    ).toBe(false);
    expect(
      normalizeFactValue(
        definition("url"),
        `https://example.invalid/${"x".repeat(2050)}`,
      ).ok,
    ).toBe(false);
  });
});

describe("text, select and multiselect validation", () => {
  it("bounds text without turning an empty string into unknown", () => {
    expect(normalizeFactValue(definition("text"), "x".repeat(5000)).ok).toBe(
      true,
    );
    expect(normalizeFactValue(definition("text"), "x".repeat(5001)).ok).toBe(
      false,
    );
    expect(normalizeFactValue(definition("text"), 1).ok).toBe(false);
  });

  it("counts text limits by Unicode code point", () => {
    const maximum = "😀".repeat(5000);
    const oversized = "😀".repeat(5001);

    expect(normalizeFactValue(definition("text"), maximum).ok).toBe(true);
    expect(normalizeFactValue(definition("text"), oversized).ok).toBe(false);
  });

  it("requires declared select options", () => {
    expect(normalizeFactValue(definition("select"), "low").ok).toBe(false);
    expect(normalizeFactValue(definition("select", selectMetadata), 1).ok).toBe(
      false,
    );
    expect(
      normalizeFactValue(definition("select", selectMetadata), "missing").ok,
    ).toBe(false);
  });

  it("rejects malformed, duplicate and unknown multiselect values", () => {
    expect(normalizeFactValue(definition("multiselect"), []).ok).toBe(false);
    expect(
      normalizeFactValue(definition("multiselect", selectMetadata), "low").ok,
    ).toBe(false);
    expect(
      normalizeFactValue(definition("multiselect", selectMetadata), ["low", 1])
        .ok,
    ).toBe(false);
    expect(
      normalizeFactValue(definition("multiselect", selectMetadata), [
        "low",
        "low",
      ]).ok,
    ).toBe(false);
    expect(
      normalizeFactValue(definition("multiselect", selectMetadata), ["missing"])
        .ok,
    ).toBe(false);
  });
});
