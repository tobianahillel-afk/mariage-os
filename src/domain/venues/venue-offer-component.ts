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

type ComponentFieldResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueOfferComponentError };

interface ComponentIdentityFields {
  readonly label: string;
  readonly componentType: VenueOfferComponentType;
  readonly calculationType: VenueOfferCalculationType;
}

interface ComponentAmountFields {
  readonly unitAmountMinor: number | null;
  readonly quantity: number | null;
}

interface ComponentTaxFields {
  readonly currency: string;
  readonly taxMode: VenueOfferTaxMode;
  readonly taxRateBasisPoints: number | null;
}

interface ComponentTextFields {
  readonly unitLabel: string | null;
  readonly notes: string | null;
}

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

function normalizeIdentityFields(
  draft: VenueOfferComponentDraft,
): ComponentFieldResult<ComponentIdentityFields> {
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
  return {
    ok: true,
    value: {
      label,
      componentType: draft.componentType,
      calculationType: draft.calculationType,
    },
  };
}

function normalizeAmountFields(
  draft: VenueOfferComponentDraft,
): ComponentFieldResult<ComponentAmountFields> {
  const unitAmountMinor = draft.unitAmountMinor ?? null;
  if (unitAmountMinor !== null && !isCommercialMoney(unitAmountMinor)) {
    return { ok: false, error: "unit_amount_invalid" };
  }
  const quantity = draft.quantity ?? null;
  if (quantity !== null && !isCommercialQuantity(quantity)) {
    return { ok: false, error: "quantity_invalid" };
  }
  return { ok: true, value: { unitAmountMinor, quantity } };
}

function normalizeTaxFields(
  draft: VenueOfferComponentDraft,
): ComponentFieldResult<ComponentTaxFields> {
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
  return { ok: true, value: { currency, taxMode, taxRateBasisPoints } };
}

function normalizeTextFields(
  draft: VenueOfferComponentDraft,
): ComponentFieldResult<ComponentTextFields> {
  const unitLabel = normalizeCommercialOptionalText(draft.unitLabel, 80);
  if (unitLabel === undefined) {
    return { ok: false, error: "unit_label_too_long" };
  }
  const notes = normalizeCommercialOptionalText(draft.notes, 5_000);
  if (notes === undefined) return { ok: false, error: "notes_too_long" };
  return { ok: true, value: { unitLabel, notes } };
}

export function normalizeVenueOfferComponent(
  draft: VenueOfferComponentDraft,
): VenueOfferComponentNormalization {
  const identity = normalizeIdentityFields(draft);
  if (!identity.ok) return identity;
  const amounts = normalizeAmountFields(draft);
  if (!amounts.ok) return amounts;
  const tax = normalizeTaxFields(draft);
  if (!tax.ok) return tax;
  const text = normalizeTextFields(draft);
  if (!text.ok) return text;
  return {
    ok: true,
    value: {
      ...identity.value,
      ...amounts.value,
      ...text.value,
      ...tax.value,
    },
  };
}
