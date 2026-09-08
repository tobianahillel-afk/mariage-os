import { expect, it } from "vitest";
import {
  isVenueOfferStatus,
  isVenueOfferTaxMode,
  isVenueOfferTransitionAllowed,
  normalizeVenueOfferCreate,
  normalizeVenueOfferTerms,
  type VenueOfferTermsDraft,
} from "./venue-offer";

const sourceId = "11111111-1111-4111-8111-111111111111";

function terms(
  overrides: Partial<VenueOfferTermsDraft> = {},
): VenueOfferTermsDraft {
  return {
    name: "Autumn quote",
    ...overrides,
  };
}

it("recognizes frozen venue offer status and tax vocabularies", () => {
  expect(isVenueOfferStatus("draft")).toBe(true);
  expect(isVenueOfferStatus("superseded")).toBe(true);
  expect(isVenueOfferStatus("pending")).toBe(false);
  expect(isVenueOfferStatus(1)).toBe(false);
  expect(isVenueOfferTaxMode("included")).toBe(true);
  expect(isVenueOfferTaxMode("not_applicable")).toBe(true);
  expect(isVenueOfferTaxMode("gross")).toBe(false);
  expect(isVenueOfferTaxMode(null)).toBe(false);
});

it("implements exactly the frozen venue offer transition graph", () => {
  expect(isVenueOfferTransitionAllowed("draft", "quoted")).toBe(true);
  expect(isVenueOfferTransitionAllowed("draft", "rejected")).toBe(true);
  expect(isVenueOfferTransitionAllowed("draft", "accepted")).toBe(false);

  expect(isVenueOfferTransitionAllowed("quoted", "accepted")).toBe(true);
  expect(isVenueOfferTransitionAllowed("quoted", "rejected")).toBe(true);
  expect(isVenueOfferTransitionAllowed("quoted", "expired")).toBe(true);
  expect(isVenueOfferTransitionAllowed("quoted", "superseded")).toBe(true);
  expect(isVenueOfferTransitionAllowed("quoted", "draft")).toBe(false);

  expect(isVenueOfferTransitionAllowed("accepted", "superseded")).toBe(true);
  expect(isVenueOfferTransitionAllowed("accepted", "rejected")).toBe(false);
  expect(isVenueOfferTransitionAllowed("rejected", "quoted")).toBe(false);
  expect(isVenueOfferTransitionAllowed("expired", "quoted")).toBe(false);
  expect(isVenueOfferTransitionAllowed("superseded", "quoted")).toBe(false);
});

it("normalizes complete venue offer commercial terms", () => {
  expect(
    normalizeVenueOfferTerms(
      terms({
        name: "  Autumn quote  ",
        validFrom: "2026-10-01",
        validTo: "2026-10-31",
        weekday: 6,
        baseAmountMinor: 1_250_000,
        currency: "EUR",
        taxMode: "included",
        taxRateBasisPoints: 2_000,
        includedGuestCount: 180,
        extraGuestAmountMinor: 8_500,
        depositAmountMinor: 250_000,
        depositRefundable: false,
        securityDepositMinor: 100_000,
        securityDepositRefundable: true,
        includedStartTime: "18:30",
        includedEndTime: "01:30",
        includedEndDayOffset: 1,
        extraHourAmountMinor: 75_000,
        sourceId,
        notes: "  includes furniture  ",
      }),
    ),
  ).toEqual({
    ok: true,
    value: {
      name: "Autumn quote",
      validFrom: "2026-10-01",
      validTo: "2026-10-31",
      weekday: 6,
      baseAmountMinor: 1_250_000,
      currency: "EUR",
      taxMode: "included",
      taxRateBasisPoints: 2_000,
      includedGuestCount: 180,
      extraGuestAmountMinor: 8_500,
      depositAmountMinor: 250_000,
      depositRefundable: false,
      securityDepositMinor: 100_000,
      securityDepositRefundable: true,
      includedStartTime: "18:30",
      includedEndTime: "01:30",
      includedEndDayOffset: 1,
      extraHourAmountMinor: 75_000,
      sourceId,
      notes: "includes furniture",
    },
  });
});

it("applies canonical venue offer defaults without inventing truth", () => {
  expect(normalizeVenueOfferTerms(terms())).toEqual({
    ok: true,
    value: {
      name: "Autumn quote",
      validFrom: null,
      validTo: null,
      weekday: null,
      baseAmountMinor: null,
      currency: "EUR",
      taxMode: "unknown",
      taxRateBasisPoints: null,
      includedGuestCount: null,
      extraGuestAmountMinor: null,
      depositAmountMinor: null,
      depositRefundable: null,
      securityDepositMinor: null,
      securityDepositRefundable: null,
      includedStartTime: null,
      includedEndTime: null,
      includedEndDayOffset: 0,
      extraHourAmountMinor: null,
      sourceId: null,
      notes: null,
    },
  });
});

it.each([
  [terms({ name: "   " }), "name_required_or_too_long"],
  [terms({ name: "x".repeat(241) }), "name_required_or_too_long"],
  [terms({ validFrom: "2026-02-30" }), "date_invalid"],
  [terms({ validTo: "2026-2-03" }), "date_invalid"],
  [
    terms({ validFrom: "2026-10-02", validTo: "2026-10-01" }),
    "date_range_invalid",
  ],
  [terms({ weekday: 7 }), "weekday_invalid"],
  [terms({ baseAmountMinor: -1 }), "money_invalid"],
  [terms({ extraGuestAmountMinor: 1.5 }), "money_invalid"],
  [terms({ currency: "eur" }), "currency_invalid"],
  [terms({ taxMode: "gross" }), "tax_mode_invalid"],
  [terms({ taxRateBasisPoints: 10_001 }), "tax_rate_invalid"],
  [terms({ includedGuestCount: 2_147_483_648 }), "guest_count_invalid"],
  [terms({ includedStartTime: "24:00" }), "time_invalid"],
  [terms({ includedEndTime: "10:00:00" }), "time_invalid"],
  [terms({ includedEndDayOffset: 3 }), "day_offset_invalid"],
  [terms({ sourceId: "bad" }), "source_id_invalid"],
  [terms({ notes: "x".repeat(5_001) }), "notes_too_long"],
] as const)("rejects invalid venue offer terms with %s", (draft, error) => {
  expect(normalizeVenueOfferTerms(draft)).toEqual({ ok: false, error });
});

it("accepts only draft or quoted venue offer creation states", () => {
  expect(
    normalizeVenueOfferCreate({ ...terms(), status: "draft" }),
  ).toMatchObject({
    ok: true,
    value: { status: "draft" },
  });
  expect(
    normalizeVenueOfferCreate({ ...terms(), status: "quoted" }),
  ).toMatchObject({ ok: true, value: { status: "quoted" } });
  expect(normalizeVenueOfferCreate({ ...terms(), status: "accepted" })).toEqual(
    { ok: false, error: "creation_status_invalid" },
  );
  expect(
    normalizeVenueOfferCreate({ ...terms({ name: "" }), status: "draft" }),
  ).toEqual({ ok: false, error: "name_required_or_too_long" });
});
