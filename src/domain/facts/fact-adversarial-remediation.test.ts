import { describe, expect, it } from "vitest";
import { normalizeFactDefinition } from "./fact-definition";
import { normalizeFactOptions } from "./fact-options";
import { hasCodePointLengthBetween } from "./fact-text-length";
import { normalizeFactValue } from "./fact-value";
import { isCanonicalFactUrl } from "./fact-url";

const emoji = "😀";
const selectOptions = {
  options: [
    { key: "zeta", labelKey: "criteria.zeta" },
    { key: "alpha", labelKey: "criteria.alpha" },
  ],
} as const;

describe("WP-2.3 adversarial numeric metadata remediation", () => {
  it.each([
    ["duration", { integer: false }],
    ["distance", { max: -1 }],
    ["duration", { min: 1e20 }],
    ["rating", { min: 20 }],
    ["rating", { max: -1 }],
    ["number", { min: 0.1, max: 0.9, integer: true }],
    ["rating", { min: 0.1, max: 0.9, integer: true }],
  ] as const)("rejects unsatisfiable %s metadata %#", (valueType, options) => {
    expect(normalizeFactOptions(valueType, options)).toEqual({
      ok: false,
      error: "invalid_options",
    });
  });

  it("accepts representable custom numeric domains", () => {
    expect(normalizeFactOptions("rating", { min: 20, max: 30 }).ok).toBe(true);
    expect(
      normalizeFactOptions("duration", { min: 0, integer: true }).ok,
    ).toBe(true);
    expect(
      normalizeFactOptions("number", {
        min: Number.MIN_SAFE_INTEGER,
        max: Number.MIN_SAFE_INTEGER,
        integer: true,
      }).ok,
    ).toBe(true);
  });
});

describe("WP-2.3 Unicode character-length parity", () => {
  it("counts Unicode code points rather than UTF-16 code units", () => {
    expect(hasCodePointLengthBetween(emoji.repeat(2), 2, 2)).toBe(true);
    expect(hasCodePointLengthBetween(emoji.repeat(3), 0, 2)).toBe(false);
    expect(hasCodePointLengthBetween("", 1, 10)).toBe(false);
  });

  it("matches PostgreSQL character bounds for definitions and retained text", () => {
    const base = {
      key: "unicode_label",
      valueType: "text",
      unit: null,
      priority: "important",
      weight: 1,
      freshnessPolicy: null,
      optionsJson: null,
      evaluationRuleJson: null,
    } as const;
    expect(
      normalizeFactDefinition({ ...base, label: emoji.repeat(240) }).ok,
    ).toBe(true);
    expect(
      normalizeFactDefinition({ ...base, label: emoji.repeat(241) }).ok,
    ).toBe(false);
    expect(
      normalizeFactValue(
        { valueType: "text", optionsJson: null },
        emoji.repeat(5000),
      ).ok,
    ).toBe(true);
    expect(
      normalizeFactValue(
        { valueType: "text", optionsJson: null },
        emoji.repeat(5001),
      ).ok,
    ).toBe(false);
  });

  it("uses code-point bounds for option labels and optional metadata", () => {
    expect(
      normalizeFactOptions("select", {
        options: [{ key: "ok", labelKey: emoji.repeat(160) }],
      }).ok,
    ).toBe(true);
    expect(
      normalizeFactOptions("select", {
        options: [{ key: "bad", labelKey: emoji.repeat(161) }],
      }).ok,
    ).toBe(false);
  });
});

describe("WP-2.3 stable multiselect canonical order", () => {
  it("is independent of mutable definition option order", () => {
    const first = normalizeFactValue(
      { valueType: "multiselect", optionsJson: selectOptions },
      ["zeta", "alpha"],
    );
    const reordered = normalizeFactValue(
      {
        valueType: "multiselect",
        optionsJson: { options: [...selectOptions.options].reverse() },
      },
      ["zeta", "alpha"],
    );
    expect(first).toEqual({ ok: true, value: ["alpha", "zeta"] });
    expect(reordered).toEqual(first);
  });
});

describe("WP-2.3 canonical URL parity", () => {
  it.each([
    "https://example.invalid",
    "HTTPS://sub.example.invalid:65535/path?x=1#part",
    "https://singlelabel",
  ])("accepts canonical external URL %s", (value) => {
    expect(isCanonicalFactUrl(value)).toBe(true);
  });

  it.each([
    "",
    "https://999.999.999.999",
    "https://a.0",
    "https://xn--",
    "https://bad_name.example",
    "https://-bad.example",
    "https://bad-.example",
    "https://a..example",
    "https://example.invalid:65536",
    "https://user@example.invalid",
    "https://[::1]",
    "https://example.invalid/\u0000bad",
    `https://${"a".repeat(64)}.invalid`,
    `https://${"a.".repeat(126)}a.invalid`,
  ])("rejects noncanonical URL %s", (value) => {
    expect(isCanonicalFactUrl(value)).toBe(false);
  });

  it("rejects overlong URLs before parsing", () => {
    expect(
      isCanonicalFactUrl(`https://example.invalid/${"x".repeat(2050)}`),
    ).toBe(false);
  });
});
