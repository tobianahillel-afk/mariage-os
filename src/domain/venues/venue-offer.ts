import {
  isCommercialBasisPoints,
  isCommercialCivilDate,
  isCommercialCurrency,
  isCommercialDayOffset,
  isCommercialLocalTime,
  isCommercialMoney,
  isCommercialNonNegativeInt32,
  isCommercialWeekday,
  isVenueCommercialUuid,
  normalizeCommercialOptionalText,
  normalizeCommercialRequiredText,
} from "./venue-commercial-values";

export const venueOfferStatuses = [
  "draft",
  "quoted",
  "accepted",
  "rejected",
  "expired",
  "superseded",
] as const;

export const venueOfferTaxModes = [
  "included",
  "excluded",
  "unknown",
  "not_applicable",
] as const;

export type VenueOfferStatus = (typeof venueOfferStatuses)[number];
export type VenueOfferTaxMode = (typeof venueOfferTaxModes)[number];
export type VenueOfferCreationStatus = "draft" | "quoted";

export interface VenueOfferTermsDraft {
  readonly name: string;
  readonly validFrom?: string | null;
  readonly validTo?: string | null;
  readonly weekday?: number | null;
  readonly baseAmountMinor?: number | null;
  readonly currency?: string;
  readonly taxMode?: string;
  readonly taxRateBasisPoints?: number | null;
  readonly includedGuestCount?: number | null;
  readonly extraGuestAmountMinor?: number | null;
  readonly depositAmountMinor?: number | null;
  readonly depositRefundable?: boolean | null;
  readonly securityDepositMinor?: number | null;
  readonly securityDepositRefundable?: boolean | null;
  readonly includedStartTime?: string | null;
  readonly includedEndTime?: string | null;
  readonly includedEndDayOffset?: number;
  readonly extraHourAmountMinor?: number | null;
  readonly sourceId?: string | null;
  readonly notes?: string | null;
}

export interface VenueOfferCreateDraft extends VenueOfferTermsDraft {
  readonly status: string;
}

export interface NormalizedVenueOfferTerms {
  readonly name: string;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly weekday: number | null;
  readonly baseAmountMinor: number | null;
  readonly currency: string;
  readonly taxMode: VenueOfferTaxMode;
  readonly taxRateBasisPoints: number | null;
  readonly includedGuestCount: number | null;
  readonly extraGuestAmountMinor: number | null;
  readonly depositAmountMinor: number | null;
  readonly depositRefundable: boolean | null;
  readonly securityDepositMinor: number | null;
  readonly securityDepositRefundable: boolean | null;
  readonly includedStartTime: string | null;
  readonly includedEndTime: string | null;
  readonly includedEndDayOffset: number;
  readonly extraHourAmountMinor: number | null;
  readonly sourceId: string | null;
  readonly notes: string | null;
}

export interface NormalizedVenueOfferCreate extends NormalizedVenueOfferTerms {
  readonly status: VenueOfferCreationStatus;
}

export type VenueOfferError =
  | "name_required_or_too_long"
  | "creation_status_invalid"
  | "date_invalid"
  | "date_range_invalid"
  | "weekday_invalid"
  | "money_invalid"
  | "currency_invalid"
  | "tax_mode_invalid"
  | "tax_rate_invalid"
  | "guest_count_invalid"
  | "time_invalid"
  | "day_offset_invalid"
  | "source_id_invalid"
  | "notes_too_long";

export type VenueOfferNormalization<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueOfferError };

type OfferFieldResult<T> = VenueOfferNormalization<T>;

interface OfferTextMetadata {
  readonly name: string;
  readonly sourceId: string | null;
  readonly notes: string | null;
}

interface OfferTaxMetadata {
  readonly currency: string;
  readonly taxMode: VenueOfferTaxMode;
}

function isVenueOfferCreationStatus(
  value: string,
): value is VenueOfferCreationStatus {
  return value === "draft" || value === "quoted";
}

export function isVenueOfferStatus(value: unknown): value is VenueOfferStatus {
  return (
    typeof value === "string" &&
    venueOfferStatuses.includes(value as VenueOfferStatus)
  );
}

export function isVenueOfferTaxMode(
  value: unknown,
): value is VenueOfferTaxMode {
  return (
    typeof value === "string" &&
    venueOfferTaxModes.includes(value as VenueOfferTaxMode)
  );
}

export function isVenueOfferTransitionAllowed(
  current: VenueOfferStatus,
  target: VenueOfferStatus,
): boolean {
  if (current === "draft") {
    return target === "quoted" || target === "rejected";
  }
  if (current === "quoted") {
    return (
      target === "accepted" ||
      target === "rejected" ||
      target === "expired" ||
      target === "superseded"
    );
  }
  return current === "accepted" && target === "superseded";
}

function nullableCivilDate(
  value: string | null | undefined,
): string | null | undefined {
  if (value === null || value === undefined) return null;
  return isCommercialCivilDate(value) ? value : undefined;
}

function nullableNumber(
  value: number | null | undefined,
  validator: (candidate: unknown) => boolean,
): number | null | undefined {
  if (value === null || value === undefined) return null;
  return validator(value) ? value : undefined;
}

function nullableTime(
  value: string | null | undefined,
): string | null | undefined {
  if (value === null || value === undefined) return null;
  return isCommercialLocalTime(value) ? value : undefined;
}

function validateDates(
  draft: VenueOfferTermsDraft,
): OfferFieldResult<Pick<NormalizedVenueOfferTerms, "validFrom" | "validTo">> {
  const validFrom = nullableCivilDate(draft.validFrom);
  const validTo = nullableCivilDate(draft.validTo);
  if (validFrom === undefined || validTo === undefined) {
    return { ok: false, error: "date_invalid" };
  }
  if (validFrom !== null && validTo !== null && validFrom > validTo) {
    return { ok: false, error: "date_range_invalid" };
  }
  return { ok: true, value: { validFrom, validTo } };
}

function allOptionalNumbersValid(
  values: readonly (number | null | undefined)[],
  validator: (candidate: unknown) => boolean,
): boolean {
  return values.every(
    (value) => value === null || value === undefined || validator(value),
  );
}

function validateWeekday(
  value: number | null | undefined,
): OfferFieldResult<number | null> {
  const weekday = nullableNumber(value, isCommercialWeekday);
  return weekday === undefined
    ? { ok: false, error: "weekday_invalid" }
    : { ok: true, value: weekday };
}

function validateMoneyAmounts(
  draft: VenueOfferTermsDraft,
): OfferFieldResult<
  Pick<
    NormalizedVenueOfferTerms,
    | "baseAmountMinor"
    | "extraGuestAmountMinor"
    | "depositAmountMinor"
    | "securityDepositMinor"
    | "extraHourAmountMinor"
  >
> {
  const amounts = [
    draft.baseAmountMinor,
    draft.extraGuestAmountMinor,
    draft.depositAmountMinor,
    draft.securityDepositMinor,
    draft.extraHourAmountMinor,
  ] as const;
  if (!allOptionalNumbersValid(amounts, isCommercialMoney)) {
    return { ok: false, error: "money_invalid" };
  }
  return {
    ok: true,
    value: {
      baseAmountMinor: draft.baseAmountMinor ?? null,
      extraGuestAmountMinor: draft.extraGuestAmountMinor ?? null,
      depositAmountMinor: draft.depositAmountMinor ?? null,
      securityDepositMinor: draft.securityDepositMinor ?? null,
      extraHourAmountMinor: draft.extraHourAmountMinor ?? null,
    },
  };
}

function validateTaxRate(
  value: number | null | undefined,
): OfferFieldResult<number | null> {
  const taxRateBasisPoints = nullableNumber(value, isCommercialBasisPoints);
  return taxRateBasisPoints === undefined
    ? { ok: false, error: "tax_rate_invalid" }
    : { ok: true, value: taxRateBasisPoints };
}

function validateGuestCount(
  value: number | null | undefined,
): OfferFieldResult<number | null> {
  const includedGuestCount = nullableNumber(
    value,
    isCommercialNonNegativeInt32,
  );
  return includedGuestCount === undefined
    ? { ok: false, error: "guest_count_invalid" }
    : { ok: true, value: includedGuestCount };
}

function validateMoneyAndCounts(
  draft: VenueOfferTermsDraft,
): OfferFieldResult<
  Pick<
    NormalizedVenueOfferTerms,
    | "weekday"
    | "baseAmountMinor"
    | "taxRateBasisPoints"
    | "includedGuestCount"
    | "extraGuestAmountMinor"
    | "depositAmountMinor"
    | "securityDepositMinor"
    | "extraHourAmountMinor"
  >
> {
  const weekday = validateWeekday(draft.weekday);
  if (!weekday.ok) return weekday;
  const money = validateMoneyAmounts(draft);
  if (!money.ok) return money;
  const taxRate = validateTaxRate(draft.taxRateBasisPoints);
  if (!taxRate.ok) return taxRate;
  const guestCount = validateGuestCount(draft.includedGuestCount);
  if (!guestCount.ok) return guestCount;

  return {
    ok: true,
    value: {
      weekday: weekday.value,
      ...money.value,
      taxRateBasisPoints: taxRate.value,
      includedGuestCount: guestCount.value,
    },
  };
}

function validateTimes(
  draft: VenueOfferTermsDraft,
): OfferFieldResult<
  Pick<
    NormalizedVenueOfferTerms,
    "includedStartTime" | "includedEndTime" | "includedEndDayOffset"
  >
> {
  const includedStartTime = nullableTime(draft.includedStartTime);
  const includedEndTime = nullableTime(draft.includedEndTime);
  if (includedStartTime === undefined || includedEndTime === undefined) {
    return { ok: false, error: "time_invalid" };
  }
  const includedEndDayOffset = draft.includedEndDayOffset ?? 0;
  if (!isCommercialDayOffset(includedEndDayOffset)) {
    return { ok: false, error: "day_offset_invalid" };
  }
  return {
    ok: true,
    value: { includedStartTime, includedEndTime, includedEndDayOffset },
  };
}

function validateTextMetadata(
  draft: VenueOfferTermsDraft,
): OfferFieldResult<OfferTextMetadata> {
  const name = normalizeCommercialRequiredText(draft.name, 240);
  if (name === null) {
    return { ok: false, error: "name_required_or_too_long" };
  }
  const sourceId = draft.sourceId ?? null;
  if (sourceId !== null && !isVenueCommercialUuid(sourceId)) {
    return { ok: false, error: "source_id_invalid" };
  }
  const notes = normalizeCommercialOptionalText(draft.notes, 5_000);
  if (notes === undefined) return { ok: false, error: "notes_too_long" };
  return { ok: true, value: { name, sourceId, notes } };
}

function validateTaxMetadata(
  draft: VenueOfferTermsDraft,
): OfferFieldResult<OfferTaxMetadata> {
  const currency = draft.currency ?? "EUR";
  if (!isCommercialCurrency(currency)) {
    return { ok: false, error: "currency_invalid" };
  }
  const taxMode = draft.taxMode ?? "unknown";
  if (!isVenueOfferTaxMode(taxMode)) {
    return { ok: false, error: "tax_mode_invalid" };
  }
  return { ok: true, value: { currency, taxMode } };
}

export function normalizeVenueOfferTerms(
  draft: VenueOfferTermsDraft,
): VenueOfferNormalization<NormalizedVenueOfferTerms> {
  const text = validateTextMetadata(draft);
  if (!text.ok) return text;
  const dates = validateDates(draft);
  if (!dates.ok) return dates;
  const commercial = validateMoneyAndCounts(draft);
  if (!commercial.ok) return commercial;
  const tax = validateTaxMetadata(draft);
  if (!tax.ok) return tax;
  const times = validateTimes(draft);
  if (!times.ok) return times;

  return {
    ok: true,
    value: {
      ...text.value,
      ...dates.value,
      ...commercial.value,
      ...tax.value,
      depositRefundable: draft.depositRefundable ?? null,
      securityDepositRefundable: draft.securityDepositRefundable ?? null,
      ...times.value,
    },
  };
}

export function normalizeVenueOfferCreate(
  draft: VenueOfferCreateDraft,
): VenueOfferNormalization<NormalizedVenueOfferCreate> {
  if (!isVenueOfferCreationStatus(draft.status)) {
    return { ok: false, error: "creation_status_invalid" };
  }
  const terms = normalizeVenueOfferTerms(draft);
  return terms.ok
    ? { ok: true, value: { status: draft.status, ...terms.value } }
    : terms;
}
