import {
  normalizeVenueOfferComponent,
  type NormalizedVenueOfferComponent,
  type VenueOfferComponentDraft,
  type VenueOfferComponentError,
} from "@domain/venues/venue-offer-component";
import {
  isVenueOfferStatus,
  normalizeVenueOfferCreate,
  normalizeVenueOfferTerms,
  type NormalizedVenueOfferTerms,
  type VenueOfferCreateDraft,
  type VenueOfferError,
  type VenueOfferStatus,
  type VenueOfferTermsDraft,
} from "@domain/venues/venue-offer";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";
import {
  validateExpectedVenueRevision,
  type VenueRevisionError,
} from "@domain/venues/venue-revision";

export interface VenueOfferRecord extends NormalizedVenueOfferTerms {
  readonly id: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly status: VenueOfferStatus;
  readonly revision: number;
}

export interface VenueOfferComponentRecord extends NormalizedVenueOfferComponent {
  readonly id: string;
  readonly projectId: string;
  readonly ownerType: "venue_offer";
  readonly offerId: string;
  readonly revision: number;
}

export interface VenueOfferAggregateRecord {
  readonly offer: VenueOfferRecord;
  readonly components: readonly VenueOfferComponentRecord[];
}

export interface CreateVenueOfferComponentDraft extends VenueOfferComponentDraft {
  readonly componentId: string;
}

export interface CreateVenueOfferDraft extends VenueOfferCreateDraft {
  readonly offerId: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly components?: readonly CreateVenueOfferComponentDraft[];
}

export interface UpdateVenueOfferDraft extends VenueOfferTermsDraft {
  readonly projectId: string;
  readonly venueId: string;
  readonly offerId: string;
  readonly expectedRevision: number;
}

export interface TransitionVenueOfferInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly offerId: string;
  readonly targetStatus: string;
  readonly expectedRevision: number;
}

export interface MutateVenueOfferComponentDraft extends VenueOfferComponentDraft {
  readonly projectId: string;
  readonly offerId: string;
  readonly componentId: string;
  readonly expectedOfferRevision: number;
}

export interface UpdateVenueOfferComponentDraft extends MutateVenueOfferComponentDraft {
  readonly expectedComponentRevision: number;
}

export interface RemoveVenueOfferComponentInput {
  readonly projectId: string;
  readonly offerId: string;
  readonly componentId: string;
  readonly expectedOfferRevision: number;
  readonly expectedComponentRevision: number;
}

interface CreateVenueOfferComponentInput extends NormalizedVenueOfferComponent {
  readonly componentId: string;
}

export interface CreateVenueOfferInput {
  readonly offerId: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly status: "draft" | "quoted";
  readonly terms: NormalizedVenueOfferTerms;
  readonly components: readonly CreateVenueOfferComponentInput[];
}

export interface UpdateVenueOfferInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly offerId: string;
  readonly expectedRevision: number;
  readonly terms: NormalizedVenueOfferTerms;
}

export interface VenueOfferComponentMutationInput extends NormalizedVenueOfferComponent {
  readonly projectId: string;
  readonly offerId: string;
  readonly componentId: string;
  readonly expectedOfferRevision: number;
  readonly expectedComponentRevision?: number;
}

export interface VenueOfferPort {
  listVenueOffers(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueOfferRecord[]>;
  listVenueOfferComponents(
    projectId: string,
    offerId: string,
  ): Promise<readonly VenueOfferComponentRecord[]>;
  createVenueOffer(
    input: CreateVenueOfferInput,
  ): Promise<VenueOfferAggregateRecord>;
  updateVenueOfferDraft(
    input: UpdateVenueOfferInput,
  ): Promise<VenueOfferRecord>;
  transitionVenueOffer(
    input: TransitionVenueOfferInput,
  ): Promise<VenueOfferRecord>;
  createVenueOfferComponent(
    input: VenueOfferComponentMutationInput,
  ): Promise<VenueOfferComponentRecord>;
  updateVenueOfferComponent(
    input: VenueOfferComponentMutationInput,
  ): Promise<VenueOfferComponentRecord>;
  removeVenueOfferComponent(
    input: RemoveVenueOfferComponentInput,
  ): Promise<void>;
}

export type VenueOfferServiceError =
  | VenueOfferError
  | VenueOfferComponentError
  | VenueRevisionError
  | "identity_invalid"
  | "duplicate_component_id"
  | "transition_target_invalid"
  | "persistence_failed";

export type VenueOfferMutationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueOfferServiceError };

function identitiesValid(...values: readonly string[]): boolean {
  return values.every(isVenueCommercialUuid);
}

function revisionError(value: number): VenueOfferMutationResult<never> | null {
  const error = validateExpectedVenueRevision(value);
  return error === null ? null : { ok: false, error };
}

async function persist<T>(
  operation: () => Promise<T>,
): Promise<VenueOfferMutationResult<T>> {
  try {
    return { ok: true, value: await operation() };
  } catch {
    return { ok: false, error: "persistence_failed" };
  }
}

function normalizeCreationComponents(
  drafts: readonly CreateVenueOfferComponentDraft[],
): VenueOfferMutationResult<readonly CreateVenueOfferComponentInput[]> {
  const ids = new Set<string>();
  const components: CreateVenueOfferComponentInput[] = [];
  for (const draft of drafts) {
    if (!isVenueCommercialUuid(draft.componentId)) {
      return { ok: false, error: "identity_invalid" };
    }
    if (ids.has(draft.componentId)) {
      return { ok: false, error: "duplicate_component_id" };
    }
    const normalized = normalizeVenueOfferComponent(draft);
    if (!normalized.ok) return normalized;
    ids.add(draft.componentId);
    components.push({ componentId: draft.componentId, ...normalized.value });
  }
  return { ok: true, value: components };
}

export async function createVenueOffer(
  port: VenueOfferPort,
  draft: CreateVenueOfferDraft,
): Promise<VenueOfferMutationResult<VenueOfferAggregateRecord>> {
  if (!identitiesValid(draft.projectId, draft.venueId, draft.offerId)) {
    return { ok: false, error: "identity_invalid" };
  }
  const normalized = normalizeVenueOfferCreate(draft);
  if (!normalized.ok) return normalized;
  const components = normalizeCreationComponents(draft.components ?? []);
  if (!components.ok) return components;
  const { status, ...terms } = normalized.value;
  return persist(() =>
    port.createVenueOffer({
      offerId: draft.offerId,
      projectId: draft.projectId,
      venueId: draft.venueId,
      status,
      terms,
      components: components.value,
    }),
  );
}

export async function updateVenueOfferDraft(
  port: VenueOfferPort,
  draft: UpdateVenueOfferDraft,
): Promise<VenueOfferMutationResult<VenueOfferRecord>> {
  if (!identitiesValid(draft.projectId, draft.venueId, draft.offerId)) {
    return { ok: false, error: "identity_invalid" };
  }
  const stale = revisionError(draft.expectedRevision);
  if (stale !== null) return stale;
  const terms = normalizeVenueOfferTerms(draft);
  if (!terms.ok) return terms;
  return persist(() =>
    port.updateVenueOfferDraft({
      projectId: draft.projectId,
      venueId: draft.venueId,
      offerId: draft.offerId,
      expectedRevision: draft.expectedRevision,
      terms: terms.value,
    }),
  );
}

export async function transitionVenueOffer(
  port: VenueOfferPort,
  input: TransitionVenueOfferInput,
): Promise<VenueOfferMutationResult<VenueOfferRecord>> {
  if (!identitiesValid(input.projectId, input.venueId, input.offerId)) {
    return { ok: false, error: "identity_invalid" };
  }
  const stale = revisionError(input.expectedRevision);
  if (stale !== null) return stale;
  if (
    !isVenueOfferStatus(input.targetStatus) ||
    input.targetStatus === "draft"
  ) {
    return { ok: false, error: "transition_target_invalid" };
  }
  return persist(() => port.transitionVenueOffer(input));
}

function normalizeComponentMutation(
  draft: MutateVenueOfferComponentDraft,
): VenueOfferMutationResult<VenueOfferComponentMutationInput> {
  if (!identitiesValid(draft.projectId, draft.offerId, draft.componentId)) {
    return { ok: false, error: "identity_invalid" };
  }
  const stale = revisionError(draft.expectedOfferRevision);
  if (stale !== null) return stale;
  const normalized = normalizeVenueOfferComponent(draft);
  if (!normalized.ok) return normalized;
  return {
    ok: true,
    value: {
      projectId: draft.projectId,
      offerId: draft.offerId,
      componentId: draft.componentId,
      expectedOfferRevision: draft.expectedOfferRevision,
      ...normalized.value,
    },
  };
}

export async function createVenueOfferComponent(
  port: VenueOfferPort,
  draft: MutateVenueOfferComponentDraft,
): Promise<VenueOfferMutationResult<VenueOfferComponentRecord>> {
  const normalized = normalizeComponentMutation(draft);
  return normalized.ok
    ? persist(() => port.createVenueOfferComponent(normalized.value))
    : normalized;
}

export async function updateVenueOfferComponent(
  port: VenueOfferPort,
  draft: UpdateVenueOfferComponentDraft,
): Promise<VenueOfferMutationResult<VenueOfferComponentRecord>> {
  const normalized = normalizeComponentMutation(draft);
  if (!normalized.ok) return normalized;
  const stale = revisionError(draft.expectedComponentRevision);
  if (stale !== null) return stale;
  return persist(() =>
    port.updateVenueOfferComponent({
      ...normalized.value,
      expectedComponentRevision: draft.expectedComponentRevision,
    }),
  );
}

export async function removeVenueOfferComponent(
  port: VenueOfferPort,
  input: RemoveVenueOfferComponentInput,
): Promise<VenueOfferMutationResult<void>> {
  if (!identitiesValid(input.projectId, input.offerId, input.componentId)) {
    return { ok: false, error: "identity_invalid" };
  }
  const offerRevision = revisionError(input.expectedOfferRevision);
  if (offerRevision !== null) return offerRevision;
  const componentRevision = revisionError(input.expectedComponentRevision);
  if (componentRevision !== null) return componentRevision;
  return persist(() => port.removeVenueOfferComponent(input));
}
