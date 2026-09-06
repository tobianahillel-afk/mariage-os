import { describe, expect, it } from "vitest";
import { normalizeFactOptions } from "./fact-options";

const selectOptions = {
  options: [
    { key: "low", labelKey: "criteria.low" },
    { key: "high", labelKey: "criteria.high" },
  ],
};

describe("numeric fact options", () => {
  it("accepts null and normalized numeric bounds", () => {
    expect(normalizeFactOptions("number", null)).toEqual({
      ok: true,
      value: null,
    });
    expect(
      normalizeFactOptions("number", { min: 0, max: 500, integer: true }),
    ).toEqual({
      ok: true,
      value: { min: 0, max: 500, integer: true },
    });
    expect(normalizeFactOptions("number", { integer: true }).ok).toBe(true);
    expect(
      normalizeFactOptions("number", { min: 1, integer: true }).ok,
    ).toBe(true);
    expect(
      normalizeFactOptions("number", { max: 1, integer: true }).ok,
    ).toBe(true);
    expect(normalizeFactOptions("rating", {})).toEqual({
      ok: true,
      value: {},
    });
    expect(normalizeFactOptions("duration", { min: 0 })).toEqual({
      ok: true,
      value: { min: 0 },
    });
    expect(normalizeFactOptions("distance", { max: 50_000 })).toEqual({
      ok: true,
      value: { max: 50_000 },
    });
    expect(normalizeFactOptions("rating", { min: 20, max: 30 }).ok).toBe(true);
  });

  it.each([
    ["number", []],
    ["number", { extra: true }],
    ["number", { min: "0" }],
    ["number", { max: Number.POSITIVE_INFINITY }],
    ["number", { integer: "yes" }],
    ["number", { min: 10, max: 1 }],
  ] as const)("rejects malformed numeric options %#", (type, raw) => {
    expect(normalizeFactOptions(type, raw)).toEqual({
      ok: false,
      error: "invalid_options",
    });
  });

  it.each([
    ["duration", { integer: false }],
    ["distance", { max: -1 }],
    ["duration", { min: 1e20 }],
    ["rating", { min: 20 }],
    ["rating", { max: -1 }],
    ["number", { min: 0.1, max: 0.9, integer: true }],
    ["rating", { min: 0.1, max: 0.9, integer: true }],
  ] as const)("rejects unsatisfiable numeric options %#", (type, raw) => {
    expect(normalizeFactOptions(type, raw)).toEqual({
      ok: false,
      error: "invalid_options",
    });
  });
});

describe("select and multiselect options", () => {
  it("normalizes declared option keys and labels", () => {
    expect(
      normalizeFactOptions("select", {
        options: [{ key: " low ", labelKey: " criteria.low " }],
      }),
    ).toEqual({
      ok: true,
      value: {
        options: [{ key: "low", labelKey: "criteria.low" }],
      },
    });
    expect(normalizeFactOptions("multiselect", selectOptions)).toEqual({
      ok: true,
      value: selectOptions,
    });
    expect(
      normalizeFactOptions("select", {
        options: [{ key: "ok", labelKey: "😀".repeat(160) }],
      }).ok,
    ).toBe(true);
  });

  it.each([
    null,
    [],
    {},
    { options: [] },
    { options: new Array(101).fill({ key: "low", labelKey: "x" }) },
    { options: [null] },
    { options: [{ key: "low", labelKey: "x", extra: true }] },
    { options: [{ key: 1, labelKey: "x" }] },
    { options: [{ key: "Bad Key", labelKey: "x" }] },
    { options: [{ key: "x".repeat(81), labelKey: "x" }] },
    { options: [{ key: "low", labelKey: "" }] },
    { options: [{ key: "low", labelKey: "x".repeat(161) }] },
    { options: [{ key: "low", labelKey: "😀".repeat(161) }] },
    {
      options: [
        { key: "low", labelKey: "criteria.low" },
        { key: "low", labelKey: "criteria.low_again" },
      ],
    },
  ])("rejects malformed select metadata %#", (raw) => {
    expect(normalizeFactOptions("select", raw)).toEqual({
      ok: false,
      error: "invalid_options",
    });
  });
});

describe("types without option metadata", () => {
  it("accepts null only", () => {
    expect(normalizeFactOptions("boolean", null)).toEqual({
      ok: true,
      value: null,
    });
    expect(normalizeFactOptions("money", {})).toEqual({
      ok: false,
      error: "invalid_options",
    });
  });
});
