import {
  isCommercialBasisPoints,
  isCommercialCurrency,
  isCommercialMoney,
  isCommercialQuantity,
  normalizeCommercialOptionalText,
  normalizeCommercialRequiredText,
} from "./venue-commercial-values";
import { isVenueOfferTaxMode, type VenueOfferTaxMode } from "./venue-offer";

export const venueOfferComponentTypes = [
  "included",
  "mandatory_extra",
  "optional",
] as const;

export const venueOfferCalculationTypes = [
  "fixed",
  "per_guest",
  "per_adult",
  "per_child",
  "per_table",
  "per_hour",
  "quantity_unit",
] as const;

export type VenueOfferComponentType = (typeof venueOfferComponentTypes)[number];
export type VenueOfferCalculationType =
  (typeof venueOfferCalculationTypes)[number];

export interface VenueOfferComponentDraft {
  readonly label: string;
  readonly componentType: string;
  readonly calculationType: string;
  readonly unitAmountMinor?: number | null;
  readonly quantity?: number | null;
  readonly unitLabel?: string | null;
  readonly currency?: string;
  readonly taxMode?: string;
  readonly taxRateBasisPoints?: number | null;
  readonly notes?: string | null;
}

export interface NormalizedVenueOfferComponent {
  readonly label: string;
  readonly componentType: VenueOfferComponentType;
  readonly calculationType: VenueOfferCalculationType;
  readonly unitAmountMinor: number | null;
  readonly quantity: number | null;
  readonly unitLabel: string | null;
  readonly currency: string;
  readonly taxMode: VenueOfferTaxMode;
  readonly taxRateBasisPoints: number | null;
  readonly notes: string | null;
}

export type VenueOfferComponentError =
  | "label_required_or_too_long"
  | "component_type_invalid"
  | "calculation_type_invalid"
  | "unit_amount_invalid"
  | "quantity_invalid"
  | "unit_label_too_long"
  | "currency_invalid"
  | "tax_mode_invalid"
  | "tax_rate_invalid"
  | "notes_too_long";

export type VenueOfferComponentNormalization =
  | { readonly ok: true; readonly value: NormalizedVenueOfferComponent }
  | { readonly ok: false; readonly error: VenueOfferComponentError };

export function isVenueOfferComponentType(
  value: unknown,
): value is VenueOfferComponentType {
  return (
    typeof value === "string" &&
    venueOfferComponentTypes.includes(value as VenueOfferComponentType)
  );
}

export function isVenueOfferCalculationType(
  value: unknown,
): value is VenueOfferCalculationType {
  return (
    typeof value === "string" &&
    venueOfferCalculationTypes.includes(value as VenueOfferCalculationType)
  );
}

export function normalizeVenueOfferComponent(
  draft: VenueOfferComponentDraft,
): VenueOfferComponentNormalization {
  const label = normalizeCommercialRequiredText(draft.label, 240);
  if (label === null) {
    return { ok: false, error: "label_required_or_too_long" };
  }
  if (!isVenueOfferComponentType(draft.componentType)) {
    return { ok: false, error: "component_type_invalid" };
  }
  if (!isVenueOfferCalculationType(draft.calculationType)) {
    return { ok: false, error: "calculation_type_invalid" };
  }
  const unitAmountMinor = draft.unitAmountMinor ?? null;
  if (unitAmountMinor !== null && !isCommercialMoney(unitAmountMinor)) {
    return { ok: false, error: "unit_amount_invalid" };
  }
  const quantity = draft.quantity ?? null;
  if (quantity !== null && !isCommercialQuantity(quantity)) {
    return { ok: false, error: "quantity_invalid" };
  }
  const unitLabel = normalizeCommercialOptionalText(draft.unitLabel, 80);
  if (unitLabel === undefined) {
    return { ok: false, error: "unit_label_too_long" };
  }
  const currency = draft.currency ?? "EUR";
  if (!isCommercialCurrency(currency)) {
    return { ok: false, error: "currency_invalid" };
  }
  const taxMode = draft.taxMode ?? "unknown";
  if (!isVenueOfferTaxMode(taxMode)) {
    return { ok: false, error: "tax_mode_invalid" };
  }
  const taxRateBasisPoints = draft.taxRateBasisPoints ?? null;
  if (
    taxRateBasisPoints !== null &&
    !isCommercialBasisPoints(taxRateBasisPoints)
  ) {
    return { ok: false, error: "tax_rate_invalid" };
  }
  const notes = normalizeCommercialOptionalText(draft.notes, 5_000);
  if (notes === undefined) return { ok: false, error: "notes_too_long" };
  return {
    ok: true,
    value: {
      label,
      componentType: draft.componentType,
      calculationType: draft.calculationType,
      unitAmountMinor,
      quantity,
      unitLabel,
      currency,
      taxMode,
      taxRateBasisPoints,
      notes,
    },
  };
}
