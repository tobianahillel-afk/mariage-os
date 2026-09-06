import { describe, expect, it } from "vitest";
import { normalizeFactEvaluationRule } from "./fact-evaluation-rule";
import { normalizeFactOptions } from "./fact-options";
import { normalizeFactValue } from "./fact-value";

describe("canonical fact boundary parity", () => {
  it("uses the same finite numeric envelope for options, rules and values", () => {
    expect(normalizeFactOptions("number", { min: -1e308, max: 1e308 }).ok).toBe(
      true,
    );
    expect(normalizeFactOptions("number", { max: 1.5e308 }).ok).toBe(false);

    expect(
      normalizeFactEvaluationRule("number", null, {
        type: "number_min",
        minimum: -1e308,
      }).ok,
    ).toBe(true);
    expect(
      normalizeFactEvaluationRule("number", null, {
        type: "number_max",
        maximum: 1.5e308,
      }).ok,
    ).toBe(false);

    expect(
      normalizeFactValue({ valueType: "number", optionsJson: null }, 1e308).ok,
    ).toBe(true);
    expect(
      normalizeFactValue({ valueType: "number", optionsJson: null }, 1.5e308)
        .ok,
    ).toBe(false);
  });

  it("validates proleptic Gregorian civil dates without the Date.UTC year-99 trap", () => {
    const definition = { valueType: "date", optionsJson: null } as const;

    expect(normalizeFactValue(definition, "0001-01-01").ok).toBe(true);
    expect(normalizeFactValue(definition, "0099-12-31").ok).toBe(true);
    expect(normalizeFactValue(definition, "0000-01-01").ok).toBe(false);
    expect(normalizeFactValue(definition, "1900-02-29").ok).toBe(false);
    expect(normalizeFactValue(definition, "2000-02-29").ok).toBe(true);
  });

  it("accepts only the canonical http/https URL subset shared with PostgreSQL", () => {
    const definition = { valueType: "url", optionsJson: null } as const;

    expect(
      normalizeFactValue(
        definition,
        "https://example.invalid:65535/path?x=1#section",
      ).ok,
    ).toBe(true);
    expect(normalizeFactValue(definition, "HTTPS://example.invalid").ok).toBe(
      true,
    );

    for (const raw of [
      "https://%",
      "https://user@example.invalid",
      "https://999.999.999.999",
      "https://example.invalid:65536",
      "https://[::1]",
    ]) {
      expect(normalizeFactValue(definition, raw).ok).toBe(false);
    }
  });
});
