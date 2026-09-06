import { describe, expect, it } from "vitest";
import { normalizeVenueSpaceDraft } from "./venue-space";

const fullDraft = {
  name: "  Orangerie  ",
  spaceType: "  reception_room  ",
  indoor: true,
  areaM2: 300,
  lengthM: 20,
  widthM: 15,
  heightM: 4,
  capacitySeated: 180,
  capacityCocktail: 240,
  sortOrder: 2,
  notes: "  Main dinner room  ",
} as const;

describe("normalizeVenueSpaceDraft", () => {
  it("normalizes complete physical-space data", () => {
    expect(normalizeVenueSpaceDraft(fullDraft)).toEqual({
      ok: true,
      value: {
        name: "Orangerie",
        spaceType: "reception_room",
        indoor: true,
        areaM2: 300,
        lengthM: 20,
        widthM: 15,
        heightM: 4,
        capacitySeated: 180,
        capacityCocktail: 240,
        sortOrder: 2,
        notes: "Main dinner room",
      },
    });
  });

  it("keeps optional physical data unknown instead of inventing zero/false", () => {
    expect(
      normalizeVenueSpaceDraft({ name: "Garden", spaceType: "outdoor" }),
    ).toEqual({
      ok: true,
      value: {
        name: "Garden",
        spaceType: "outdoor",
        indoor: null,
        areaM2: null,
        lengthM: null,
        widthM: null,
        heightM: null,
        capacitySeated: null,
        capacityCocktail: null,
        sortOrder: 0,
        notes: null,
      },
    });
  });

  it("normalizes explicit nulls and blank notes", () => {
    const result = normalizeVenueSpaceDraft({
      name: "Garden",
      spaceType: "outdoor",
      indoor: null,
      areaM2: null,
      lengthM: null,
      widthM: null,
      heightM: null,
      capacitySeated: null,
      capacityCocktail: null,
      notes: "   ",
    });

    expect(result.ok && result.value.notes).toBeNull();
  });

  it.each([
    [{ ...fullDraft, name: "   " }, "name_required"],
    [{ ...fullDraft, name: "x".repeat(161) }, "name_too_long"],
    [{ ...fullDraft, spaceType: "   " }, "space_type_required"],
    [{ ...fullDraft, spaceType: "x".repeat(81) }, "space_type_too_long"],
  ] as const)("rejects invalid required text %#", (draft, error) => {
    expect(normalizeVenueSpaceDraft(draft)).toEqual({ ok: false, error });
  });

  it.each([
    [{ ...fullDraft, areaM2: Number.NaN }, "measurement_invalid"],
    [{ ...fullDraft, areaM2: 0 }, "measurement_invalid"],
    [{ ...fullDraft, lengthM: -1 }, "measurement_invalid"],
    [{ ...fullDraft, widthM: 0 }, "measurement_invalid"],
    [{ ...fullDraft, heightM: Number.POSITIVE_INFINITY }, "measurement_invalid"],
  ] as const)("rejects invalid measurements %#", (draft, error) => {
    expect(normalizeVenueSpaceDraft(draft)).toEqual({ ok: false, error });
  });

  it.each([
    [{ ...fullDraft, capacitySeated: 1.5 }, "capacity_invalid"],
    [{ ...fullDraft, capacitySeated: -1 }, "capacity_invalid"],
    [{ ...fullDraft, capacityCocktail: 2.5 }, "capacity_invalid"],
    [{ ...fullDraft, capacityCocktail: -1 }, "capacity_invalid"],
  ] as const)("rejects invalid capacities %#", (draft, error) => {
    expect(normalizeVenueSpaceDraft(draft)).toEqual({ ok: false, error });
  });

  it("rejects non-integer sort order", () => {
    expect(normalizeVenueSpaceDraft({ ...fullDraft, sortOrder: 1.5 })).toEqual({
      ok: false,
      error: "sort_order_invalid",
    });
  });

  it("rejects oversized notes and accepts explicit null note", () => {
    expect(
      normalizeVenueSpaceDraft({ ...fullDraft, notes: "x".repeat(5_001) }),
    ).toEqual({ ok: false, error: "notes_too_long" });
    const result = normalizeVenueSpaceDraft({ ...fullDraft, notes: null });
    expect(result.ok && result.value.notes).toBeNull();
  });
});
