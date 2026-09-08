import { describe, expect, it } from "vitest";
import {
  isVenueOfferCalculationType,
  isVenueOfferComponentType,
  normalizeVenueOfferComponent,
  type VenueOfferComponentDraft,
} from "./venue-offer-component";

function component(
  overrides: Partial<VenueOfferComponentDraft> = {},
): VenueOfferComponentDraft {
  return {
    label: "Room rental",
    componentType: "included",
    calculationType: "fixed",
    ...overrides,
  };
}

describe("venue offer component domain", () => {
  it("recognizes frozen component vocabularies", () => {
    expect(isVenueOfferComponentType("included")).toBe(true);
    expect(isVenueOfferComponentType("mandatory_extra")).toBe(true);
    expect(isVenueOfferComponentType("optional")).toBe(true);
    expect(isVenueOfferComponentType("required")).toBe(false);
    expect(isVenueOfferComponentType(1)).toBe(false);

    expect(isVenueOfferCalculationType("fixed")).toBe(true);
    expect(isVenueOfferCalculationType("per_guest")).toBe(true);
    expect(isVenueOfferCalculationType("per_adult")).toBe(true);
    expect(isVenueOfferCalculationType("per_child")).toBe(true);
    expect(isVenueOfferCalculationType("per_table")).toBe(true);
    expect(isVenueOfferCalculationType("per_hour")).toBe(true);
    expect(isVenueOfferCalculationType("quantity_unit")).toBe(true);
    expect(isVenueOfferCalculationType("tiered")).toBe(false);
    expect(isVenueOfferCalculationType(null)).toBe(false);
  });

  it("normalizes complete component input", () => {
    expect(
      normalizeVenueOfferComponent(
        component({
          label: "  Furniture  ",
          componentType: "mandatory_extra",
          calculationType: "per_guest",
          unitAmountMinor: 1_500,
          quantity: 180.125,
          unitLabel: "  guest  ",
          currency: "EUR",
          taxMode: "excluded",
          taxRateBasisPoints: 2_000,
          notes: "  quoted extra  ",
        }),
      ),
    ).toEqual({
      ok: true,
      value: {
        label: "Furniture",
        componentType: "mandatory_extra",
        calculationType: "per_guest",
        unitAmountMinor: 1_500,
        quantity: 180.125,
        unitLabel: "guest",
        currency: "EUR",
        taxMode: "excluded",
        taxRateBasisPoints: 2_000,
        notes: "quoted extra",
      },
    });
  });

  it("uses neutral defaults without calculating totals", () => {
    expect(normalizeVenueOfferComponent(component())).toEqual({
      ok: true,
      value: {
        label: "Room rental",
        componentType: "included",
        calculationType: "fixed",
        unitAmountMinor: null,
        quantity: null,
        unitLabel: null,
        currency: "EUR",
        taxMode: "unknown",
        taxRateBasisPoints: null,
        notes: null,
      },
    });
  });

  it.each([
    [component({ label: "" }), "label_required_or_too_long"],
    [component({ label: "x".repeat(241) }), "label_required_or_too_long"],
    [component({ componentType: "required" }), "component_type_invalid"],
    [component({ calculationType: "tiered" }), "calculation_type_invalid"],
    [component({ unitAmountMinor: -1 }), "unit_amount_invalid"],
    [component({ quantity: 1.2345 }), "quantity_invalid"],
    [component({ unitLabel: "x".repeat(81) }), "unit_label_too_long"],
    [component({ currency: "eur" }), "currency_invalid"],
    [component({ taxMode: "gross" }), "tax_mode_invalid"],
    [component({ taxRateBasisPoints: -1 }), "tax_rate_invalid"],
    [component({ notes: "x".repeat(5_001) }), "notes_too_long"],
  ] as const)("rejects invalid component input with %s", (draft, error) => {
    expect(normalizeVenueOfferComponent(draft)).toEqual({ ok: false, error });
  });
});
