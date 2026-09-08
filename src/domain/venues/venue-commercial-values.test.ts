import { expect, it } from "vitest";
import {
  isCommercialBasisPoints,
  isCommercialCivilDate,
  isCommercialCurrency,
  isCommercialDayOffset,
  isCommercialLocalTime,
  isCommercialMoney,
  isCommercialNonNegativeInt32,
  isCommercialQuantity,
  isCommercialWeekday,
  isVenueCommercialUuid,
  normalizeCommercialOptionalText,
  normalizeCommercialProviderTime,
  normalizeCommercialRequiredText,
} from "./venue-commercial-values";

it("validates venue commercial UUID, currency and bounded text", () => {
  expect(isVenueCommercialUuid("11111111-1111-4111-8111-111111111111")).toBe(
    true,
  );
  expect(isVenueCommercialUuid("not-a-uuid")).toBe(false);
  expect(isVenueCommercialUuid(42)).toBe(false);
  expect(isCommercialCurrency("EUR")).toBe(true);
  expect(isCommercialCurrency("eur")).toBe(false);
  expect(isCommercialCurrency(42)).toBe(false);
  expect(normalizeCommercialRequiredText("  Offer  ", 10)).toBe("Offer");
  expect(normalizeCommercialRequiredText("   ", 10)).toBeNull();
  expect(normalizeCommercialRequiredText("abcdef", 5)).toBeNull();
  expect(normalizeCommercialRequiredText("\ud800", 10)).toBeNull();
});

it("normalizes optional commercial text without truncation", () => {
  expect(normalizeCommercialOptionalText(undefined, 5)).toBeNull();
  expect(normalizeCommercialOptionalText(null, 5)).toBeNull();
  expect(normalizeCommercialOptionalText("  ", 5)).toBeNull();
  expect(normalizeCommercialOptionalText(" ok ", 5)).toBe("ok");
  expect(normalizeCommercialOptionalText("abcdef", 5)).toBeUndefined();
  expect(normalizeCommercialOptionalText("\udc00", 5)).toBeUndefined();
});

it("validates safe integer commercial boundaries", () => {
  expect(isCommercialMoney(0)).toBe(true);
  expect(isCommercialMoney(Number.MAX_SAFE_INTEGER)).toBe(true);
  expect(isCommercialMoney(-1)).toBe(false);
  expect(isCommercialMoney(1.5)).toBe(false);
  expect(isCommercialMoney(Number.MAX_SAFE_INTEGER + 1)).toBe(false);

  expect(isCommercialNonNegativeInt32(0)).toBe(true);
  expect(isCommercialNonNegativeInt32(2_147_483_647)).toBe(true);
  expect(isCommercialNonNegativeInt32(-1)).toBe(false);
  expect(isCommercialNonNegativeInt32(2_147_483_648)).toBe(false);
  expect(isCommercialNonNegativeInt32(1.5)).toBe(false);

  expect(isCommercialBasisPoints(0)).toBe(true);
  expect(isCommercialBasisPoints(10_000)).toBe(true);
  expect(isCommercialBasisPoints(-1)).toBe(false);
  expect(isCommercialBasisPoints(10_001)).toBe(false);
  expect(isCommercialBasisPoints(0.5)).toBe(false);

  expect(isCommercialWeekday(0)).toBe(true);
  expect(isCommercialWeekday(6)).toBe(true);
  expect(isCommercialWeekday(-1)).toBe(false);
  expect(isCommercialWeekday(7)).toBe(false);
  expect(isCommercialWeekday(1.5)).toBe(false);

  expect(isCommercialDayOffset(0)).toBe(true);
  expect(isCommercialDayOffset(2)).toBe(true);
  expect(isCommercialDayOffset(-1)).toBe(false);
  expect(isCommercialDayOffset(3)).toBe(false);
  expect(isCommercialDayOffset(1.5)).toBe(false);
});

it("validates strict commercial civil dates including leap years", () => {
  expect(isCommercialCivilDate("2028-02-29")).toBe(true);
  expect(isCommercialCivilDate("2027-02-29")).toBe(false);
  expect(isCommercialCivilDate("2000-02-29")).toBe(true);
  expect(isCommercialCivilDate("1900-02-29")).toBe(false);
  expect(isCommercialCivilDate("2026-04-30")).toBe(true);
  expect(isCommercialCivilDate("2026-04-31")).toBe(false);
  expect(isCommercialCivilDate("0000-01-01")).toBe(false);
  expect(isCommercialCivilDate("2026-00-01")).toBe(false);
  expect(isCommercialCivilDate("2026-13-01")).toBe(false);
  expect(isCommercialCivilDate("2026-01-00")).toBe(false);
  expect(isCommercialCivilDate("2026-1-01")).toBe(false);
  expect(isCommercialCivilDate(20260908)).toBe(false);
});

it("validates commercial local times and canonicalizes provider seconds", () => {
  expect(isCommercialLocalTime("00:00")).toBe(true);
  expect(isCommercialLocalTime("23:59")).toBe(true);
  expect(isCommercialLocalTime("24:00")).toBe(false);
  expect(isCommercialLocalTime(1200)).toBe(false);
  expect(normalizeCommercialProviderTime(null)).toBeNull();
  expect(normalizeCommercialProviderTime("12:34")).toBe("12:34");
  expect(normalizeCommercialProviderTime("12:34:00")).toBe("12:34");
  expect(normalizeCommercialProviderTime("12:34:01")).toBeNull();
  expect(normalizeCommercialProviderTime(1234)).toBeNull();
});

it("validates exact numeric(12,3) component quantities", () => {
  expect(isCommercialQuantity(0)).toBe(true);
  expect(isCommercialQuantity(12.345)).toBe(true);
  expect(isCommercialQuantity(999_999_999.999)).toBe(true);
  expect(isCommercialQuantity(-0.001)).toBe(false);
  expect(isCommercialQuantity(1_000_000_000)).toBe(false);
  expect(isCommercialQuantity(1.2345)).toBe(false);
  expect(isCommercialQuantity(Number.NaN)).toBe(false);
  expect(isCommercialQuantity("1.000")).toBe(false);
});
