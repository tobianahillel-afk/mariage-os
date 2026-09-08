import type {
  VenueOfferAggregateRecord,
  VenueOfferComponentRecord,
  VenueOfferRecord,
} from "@application/venues/venue-offer-service";
import { normalizeVenueOfferComponent } from "@domain/venues/venue-offer-component";
import {
  isVenueOfferStatus,
  normalizeVenueOfferTerms,
} from "@domain/venues/venue-offer";
import {
  isVenueCommercialUuid,
  normalizeCommercialProviderTime,
} from "@domain/venues/venue-commercial-values";

type UnknownRecord = Record<string, unknown>;

function invalidResponse(): never {
  throw new Error("Invalid venue commercial response.");
}

function recordValue(value: unknown): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    invalidResponse();
  }
  return value as UnknownRecord;
}

function stringValue(value: unknown): string {
  if (typeof value !== "string") invalidResponse();
  return value;
}

function nullableString(value: unknown): string | null {
  return value === null ? null : stringValue(value);
}

function uuidValue(value: unknown): string {
  if (!isVenueCommercialUuid(value)) invalidResponse();
  return value;
}

function nullableUuid(value: unknown): string | null {
  return value === null ? null : uuidValue(value);
}

function numberValue(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) invalidResponse();
  return value;
}

function nullableNumber(value: unknown): number | null {
  return value === null ? null : numberValue(value);
}

function nullableBoolean(value: unknown): boolean | null {
  if (value === null) return null;
  if (typeof value !== "boolean") invalidResponse();
  return value;
}

function revisionValue(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) invalidResponse();
  return value as number;
}

function providerTime(value: unknown): string | null {
  const normalized = normalizeCommercialProviderTime(value);
  if (value !== null && normalized === null) invalidResponse();
  return normalized;
}

export function parseVenueOfferRow(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
  expectedOfferId: string | null = null,
): VenueOfferRecord {
  const row = recordValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  const venueId = uuidValue(row.venue_id);
  if (
    projectId !== expectedProjectId ||
    venueId !== expectedVenueId ||
    (expectedOfferId !== null && id !== expectedOfferId) ||
    !isVenueOfferStatus(row.status)
  ) {
    invalidResponse();
  }
  const terms = normalizeVenueOfferTerms({
    name: stringValue(row.name),
    validFrom: nullableString(row.valid_from),
    validTo: nullableString(row.valid_to),
    weekday: nullableNumber(row.weekday),
    baseAmountMinor: nullableNumber(row.base_amount_minor),
    currency: stringValue(row.currency),
    taxMode: stringValue(row.tax_mode),
    taxRateBasisPoints: nullableNumber(row.tax_rate_basis_points),
    includedGuestCount: nullableNumber(row.included_guest_count),
    extraGuestAmountMinor: nullableNumber(row.extra_guest_amount_minor),
    depositAmountMinor: nullableNumber(row.deposit_amount_minor),
    depositRefundable: nullableBoolean(row.deposit_refundable),
    securityDepositMinor: nullableNumber(row.security_deposit_minor),
    securityDepositRefundable: nullableBoolean(row.security_deposit_refundable),
    includedStartTime: providerTime(row.included_start_time),
    includedEndTime: providerTime(row.included_end_time),
    includedEndDayOffset: numberValue(row.included_end_day_offset),
    extraHourAmountMinor: nullableNumber(row.extra_hour_amount_minor),
    sourceId: nullableUuid(row.source_id),
    notes: nullableString(row.notes),
  });
  if (!terms.ok) invalidResponse();
  return {
    id,
    projectId,
    venueId,
    status: row.status,
    revision: revisionValue(row.revision),
    ...terms.value,
  };
}

export function parseVenueOfferComponentRow(
  value: unknown,
  expectedProjectId: string,
  expectedOfferId: string,
  expectedComponentId: string | null = null,
): VenueOfferComponentRecord {
  const row = recordValue(value);
  const id = uuidValue(row.id);
  const projectId = uuidValue(row.project_id);
  const offerId = uuidValue(row.owner_id);
  if (
    projectId !== expectedProjectId ||
    offerId !== expectedOfferId ||
    row.owner_type !== "venue_offer" ||
    (expectedComponentId !== null && id !== expectedComponentId)
  ) {
    invalidResponse();
  }
  const component = normalizeVenueOfferComponent({
    label: stringValue(row.label),
    componentType: stringValue(row.component_type),
    calculationType: stringValue(row.calculation_type),
    unitAmountMinor: nullableNumber(row.unit_amount_minor),
    quantity: nullableNumber(row.quantity),
    unitLabel: nullableString(row.unit_label),
    currency: stringValue(row.currency),
    taxMode: stringValue(row.tax_mode),
    taxRateBasisPoints: nullableNumber(row.tax_rate_basis_points),
    notes: nullableString(row.notes),
  });
  if (!component.ok) invalidResponse();
  return {
    id,
    projectId,
    ownerType: "venue_offer",
    offerId,
    revision: revisionValue(row.revision),
    ...component.value,
  };
}

export function parseVenueOfferAggregate(
  value: unknown,
  expectedProjectId: string,
  expectedVenueId: string,
  expectedOfferId: string,
): VenueOfferAggregateRecord {
  const payload = recordValue(value);
  if (!Array.isArray(payload.components)) invalidResponse();
  const offer = parseVenueOfferRow(
    payload.offer,
    expectedProjectId,
    expectedVenueId,
    expectedOfferId,
  );
  return {
    offer,
    components: payload.components.map((component) =>
      parseVenueOfferComponentRow(
        component,
        expectedProjectId,
        expectedOfferId,
      ),
    ),
  };
}

export function parseVenueOfferRemovalReceipt(
  value: unknown,
  expectedProjectId: string,
  expectedOfferId: string,
  expectedComponentId: string,
): void {
  const payload = recordValue(value);
  if (
    uuidValue(payload.project_id) !== expectedProjectId ||
    uuidValue(payload.offer_id) !== expectedOfferId ||
    uuidValue(payload.component_id) !== expectedComponentId ||
    payload.removed !== true
  ) {
    invalidResponse();
  }
}
