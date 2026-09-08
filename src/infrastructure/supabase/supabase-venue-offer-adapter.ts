import type {
  CreateVenueOfferInput,
  RemoveVenueOfferComponentInput,
  TransitionVenueOfferInput,
  UpdateVenueOfferInput,
  VenueOfferAggregateRecord,
  VenueOfferComponentMutationInput,
  VenueOfferComponentRecord,
  VenueOfferPort,
  VenueOfferRecord,
} from "@application/venues/venue-offer-service";
import type { NormalizedVenueOfferComponent } from "@domain/venues/venue-offer-component";
import type { NormalizedVenueOfferTerms } from "@domain/venues/venue-offer";
import {
  parseVenueOfferAggregate,
  parseVenueOfferComponentRow,
  parseVenueOfferRemovalReceipt,
  parseVenueOfferRow,
} from "./parse-venue-offer-row";

const OFFER_COLUMNS =
  "id,project_id,venue_id,name,status,valid_from,valid_to,weekday,base_amount_minor,currency,tax_mode,tax_rate_basis_points,included_guest_count,extra_guest_amount_minor,deposit_amount_minor,deposit_refundable,security_deposit_minor,security_deposit_refundable,included_start_time,included_end_time,included_end_day_offset,extra_hour_amount_minor,source_id,notes,revision";
const COMPONENT_COLUMNS =
  "id,project_id,owner_type,owner_id,label,component_type,calculation_type,unit_amount_minor,quantity,unit_label,currency,tax_mode,tax_rate_basis_points,notes,revision";
const INVALID_RESPONSE = "Invalid venue commercial response.";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface FilterBuilder extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string): FilterBuilder;
  order(
    column: string,
    options: Readonly<{ ascending: boolean }>,
  ): PromiseLike<SupabaseResult>;
}

interface CommercialTable {
  select(columns: string): FilterBuilder;
}

export interface SupabaseVenueOfferClientLike {
  from(table: "venue_offers" | "offer_components"): CommercialTable;
  rpc(
    functionName:
      | "create_venue_offer"
      | "update_venue_offer_draft"
      | "transition_venue_offer_status"
      | "create_venue_offer_component"
      | "update_venue_offer_component"
      | "remove_venue_offer_component",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function failure(message: string): never {
  throw new Error(message);
}

function uniqueRecords<T extends { readonly id: string }>(
  records: readonly T[],
): readonly T[] {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) failure(INVALID_RESPONSE);
    ids.add(record.id);
  }
  return records;
}

function expectedStatus(
  record: VenueOfferRecord,
  status: string,
): VenueOfferRecord {
  if (record.status !== status) failure(INVALID_RESPONSE);
  return record;
}

function exactCreationComponents(
  records: readonly VenueOfferComponentRecord[],
  expected: CreateVenueOfferInput["components"],
): readonly VenueOfferComponentRecord[] {
  const unique = uniqueRecords(records);
  if (unique.length !== expected.length) failure(INVALID_RESPONSE);
  const expectedIds = new Set(
    expected.map((component) => component.componentId),
  );
  for (const record of unique) {
    if (!expectedIds.has(record.id)) failure(INVALID_RESPONSE);
  }
  return unique;
}

function offerTermsPayload(
  terms: NormalizedVenueOfferTerms,
): Readonly<Record<string, unknown>> {
  return {
    target_name: terms.name,
    target_valid_from: terms.validFrom,
    target_valid_to: terms.validTo,
    target_weekday: terms.weekday,
    target_base_amount_minor: terms.baseAmountMinor,
    target_currency: terms.currency,
    target_tax_mode: terms.taxMode,
    target_tax_rate_basis_points: terms.taxRateBasisPoints,
    target_included_guest_count: terms.includedGuestCount,
    target_extra_guest_amount_minor: terms.extraGuestAmountMinor,
    target_deposit_amount_minor: terms.depositAmountMinor,
    target_deposit_refundable: terms.depositRefundable,
    target_security_deposit_minor: terms.securityDepositMinor,
    target_security_deposit_refundable: terms.securityDepositRefundable,
    target_included_start_time: terms.includedStartTime,
    target_included_end_time: terms.includedEndTime,
    target_included_end_day_offset: terms.includedEndDayOffset,
    target_extra_hour_amount_minor: terms.extraHourAmountMinor,
    target_source_id: terms.sourceId,
    target_notes: terms.notes,
  };
}

function componentPayload(
  component: NormalizedVenueOfferComponent,
): Readonly<Record<string, unknown>> {
  return {
    target_label: component.label,
    target_component_type: component.componentType,
    target_calculation_type: component.calculationType,
    target_unit_amount_minor: component.unitAmountMinor,
    target_quantity: component.quantity,
    target_unit_label: component.unitLabel,
    target_currency: component.currency,
    target_tax_mode: component.taxMode,
    target_tax_rate_basis_points: component.taxRateBasisPoints,
    target_notes: component.notes,
  };
}

function creationComponentPayload(
  component: CreateVenueOfferInput["components"][number],
): Readonly<Record<string, unknown>> {
  return {
    id: component.componentId,
    label: component.label,
    component_type: component.componentType,
    calculation_type: component.calculationType,
    unit_amount_minor: component.unitAmountMinor,
    quantity: component.quantity,
    unit_label: component.unitLabel,
    currency: component.currency,
    tax_mode: component.taxMode,
    tax_rate_basis_points: component.taxRateBasisPoints,
    notes: component.notes,
  };
}

async function resultOrFailure(
  result: PromiseLike<SupabaseResult>,
  message: string,
): Promise<unknown> {
  const { data, error } = await result;
  if (error !== null) failure(message);
  return data;
}

export class SupabaseVenueOfferAdapter implements VenueOfferPort {
  constructor(private readonly client: SupabaseVenueOfferClientLike) {}

  async listVenueOffers(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueOfferRecord[]> {
    const data = await resultOrFailure(
      this.client
        .from("venue_offers")
        .select(OFFER_COLUMNS)
        .eq("project_id", projectId)
        .eq("venue_id", venueId)
        .order("created_at", { ascending: false }),
      "Venue offer query failed.",
    );
    if (!Array.isArray(data)) failure("Venue offer query failed.");
    return uniqueRecords(
      data.map((row) => parseVenueOfferRow(row, projectId, venueId)),
    );
  }

  async listVenueOfferComponents(
    projectId: string,
    offerId: string,
  ): Promise<readonly VenueOfferComponentRecord[]> {
    const data = await resultOrFailure(
      this.client
        .from("offer_components")
        .select(COMPONENT_COLUMNS)
        .eq("project_id", projectId)
        .eq("owner_id", offerId)
        .order("created_at", { ascending: true }),
      "Venue offer component query failed.",
    );
    if (!Array.isArray(data)) failure("Venue offer component query failed.");
    return uniqueRecords(
      data.map((row) => parseVenueOfferComponentRow(row, projectId, offerId)),
    );
  }

  async createVenueOffer(
    input: CreateVenueOfferInput,
  ): Promise<VenueOfferAggregateRecord> {
    const data = await resultOrFailure(
      this.client.rpc("create_venue_offer", {
        target_project_id: input.projectId,
        target_venue_id: input.venueId,
        target_offer_id: input.offerId,
        target_status: input.status,
        ...offerTermsPayload(input.terms),
        target_components: input.components.map(creationComponentPayload),
      }),
      "Venue offer creation failed.",
    );
    const aggregate = parseVenueOfferAggregate(
      data,
      input.projectId,
      input.venueId,
      input.offerId,
    );
    expectedStatus(aggregate.offer, input.status);
    exactCreationComponents(aggregate.components, input.components);
    return aggregate;
  }

  async updateVenueOfferDraft(
    input: UpdateVenueOfferInput,
  ): Promise<VenueOfferRecord> {
    const data = await resultOrFailure(
      this.client.rpc("update_venue_offer_draft", {
        target_project_id: input.projectId,
        target_venue_id: input.venueId,
        target_offer_id: input.offerId,
        target_expected_revision: input.expectedRevision,
        ...offerTermsPayload(input.terms),
      }),
      "Venue offer update failed.",
    );
    const record = parseVenueOfferRow(
      data,
      input.projectId,
      input.venueId,
      input.offerId,
    );
    return expectedStatus(record, "draft");
  }

  async transitionVenueOffer(
    input: TransitionVenueOfferInput,
  ): Promise<VenueOfferRecord> {
    const data = await resultOrFailure(
      this.client.rpc("transition_venue_offer_status", {
        target_project_id: input.projectId,
        target_venue_id: input.venueId,
        target_offer_id: input.offerId,
        target_status: input.targetStatus,
        target_expected_revision: input.expectedRevision,
      }),
      "Venue offer transition failed.",
    );
    const record = parseVenueOfferRow(
      data,
      input.projectId,
      input.venueId,
      input.offerId,
    );
    return expectedStatus(record, input.targetStatus);
  }

  async createVenueOfferComponent(
    input: VenueOfferComponentMutationInput,
  ): Promise<VenueOfferComponentRecord> {
    const data = await resultOrFailure(
      this.client.rpc("create_venue_offer_component", {
        target_project_id: input.projectId,
        target_offer_id: input.offerId,
        target_component_id: input.componentId,
        target_expected_offer_revision: input.expectedOfferRevision,
        ...componentPayload(input),
      }),
      "Venue offer component creation failed.",
    );
    return parseVenueOfferComponentRow(
      data,
      input.projectId,
      input.offerId,
      input.componentId,
    );
  }

  async updateVenueOfferComponent(
    input: VenueOfferComponentMutationInput,
  ): Promise<VenueOfferComponentRecord> {
    const data = await resultOrFailure(
      this.client.rpc("update_venue_offer_component", {
        target_project_id: input.projectId,
        target_offer_id: input.offerId,
        target_component_id: input.componentId,
        target_expected_offer_revision: input.expectedOfferRevision,
        target_expected_component_revision: input.expectedComponentRevision,
        ...componentPayload(input),
      }),
      "Venue offer component update failed.",
    );
    return parseVenueOfferComponentRow(
      data,
      input.projectId,
      input.offerId,
      input.componentId,
    );
  }

  async removeVenueOfferComponent(
    input: RemoveVenueOfferComponentInput,
  ): Promise<void> {
    const data = await resultOrFailure(
      this.client.rpc("remove_venue_offer_component", {
        target_project_id: input.projectId,
        target_offer_id: input.offerId,
        target_component_id: input.componentId,
        target_expected_offer_revision: input.expectedOfferRevision,
        target_expected_component_revision: input.expectedComponentRevision,
      }),
      "Venue offer component removal failed.",
    );
    parseVenueOfferRemovalReceipt(
      data,
      input.projectId,
      input.offerId,
      input.componentId,
    );
  }
}
