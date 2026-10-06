import type { AppendVenueFactObservationDraft } from "@application/facts/venue-fact-evidence-service";
import { isUuid, type LocalProjectScope } from "@application/local-data/local-project-scope";
import type { PendingMutationEnvelope } from "@application/local-data/local-records";
import type { VenueTransitionInput } from "@application/venues/venue-command-port";
import type { AppendVenueInteractionInput } from "@application/venues/venue-interaction-service";
import type { SaveVenueRatingDraft } from "@application/venues/venue-member-opinion-service";
import type { VenueCoreUpdateInput } from "@application/venues/venue-repository-port";
import { isVenueStatus } from "@domain/venues/venue-status";

export const VENUE_CORE_UPDATE_MUTATION = "update_venue_core";
export const VENUE_STATUS_MUTATION = "transition_venue_status";
export const VENUE_VISIT_NOTE_MUTATION = "append_venue_interaction";
export const VENUE_VISIT_FACT_OBSERVATION_MUTATION =
  "append_venue_fact_observation";
export const VENUE_VISIT_MEMBER_RATING_MUTATION = "set_venue_member_rating";

export type VenueReplayCommand =
  | { readonly kind: "core"; readonly input: VenueCoreUpdateInput }
  | { readonly kind: "status"; readonly input: VenueTransitionInput }
  | { readonly kind: "visit_note"; readonly input: AppendVenueInteractionInput }
  | {
      readonly kind: "fact_observation";
      readonly input: AppendVenueFactObservationDraft;
    }
  | { readonly kind: "member_rating"; readonly input: SaveVenueRatingDraft };

type JsonRecord = Record<string, unknown>;

type ScopedVenueMutation = PendingMutationEnvelope & {
  readonly entityType: "venue";
  readonly entityId: string;
};

function invalidMutation(): never {
  throw new Error("Invalid persisted Venue mutation.");
}

function objectValue(value: unknown): JsonRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalidMutation();
  }
  return value as JsonRecord;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : invalidMutation();
}

function nullableString(value: unknown): string | null {
  return value === null ? null : stringValue(value);
}

function uuidValue(value: unknown): string {
  const parsed = stringValue(value);
  return isUuid(parsed) ? parsed : invalidMutation();
}

function nullableUuid(value: unknown): string | null {
  return value === null ? null : uuidValue(value);
}

function finiteNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : invalidMutation();
}

function nonNegativeInteger(value: unknown): number {
  return Number.isSafeInteger(value) && (value as number) >= 0
    ? (value as number)
    : invalidMutation();
}

function baseRevision(value: string | null): number {
  if (value === null || !/^[1-9]\d*$/.test(value)) return invalidMutation();
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : invalidMutation();
}

function ratingBaseRevision(value: string | null): number {
  if (value === null || !/^(?:0|[1-9]\d*)$/.test(value)) {
    return invalidMutation();
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : invalidMutation();
}

function requireNoBaseRevision(value: string | null): void {
  if (value !== null) invalidMutation();
}

function assertScope(
  mutation: PendingMutationEnvelope,
  scope: LocalProjectScope,
): asserts mutation is ScopedVenueMutation {
  if (
    mutation.projectId !== scope.projectId ||
    mutation.userId !== scope.userId ||
    mutation.deviceId !== scope.deviceId ||
    mutation.entityType !== "venue" ||
    mutation.entityId === null
  ) {
    invalidMutation();
  }
}

function coreCommand(
  mutation: ScopedVenueMutation,
  payload: JsonRecord,
): VenueReplayCommand {
  return {
    kind: "core",
    input: {
      projectId: mutation.projectId,
      venueId: mutation.entityId,
      expectedRevision: baseRevision(mutation.baseRevision),
      operationId: mutation.operationId,
      deviceId: mutation.deviceId,
      name: stringValue(payload.name),
      code: nullableString(payload.code),
      websiteUrl: nullableString(payload.websiteUrl),
      city: nullableString(payload.city),
    },
  };
}

function statusCommand(
  mutation: ScopedVenueMutation,
  payload: JsonRecord,
): VenueReplayCommand {
  const status = stringValue(payload.status);
  if (!isVenueStatus(status)) invalidMutation();
  const rejectionReason = nullableString(payload.rejectionReason);
  if ((status === "rejected") !== (rejectionReason !== null)) {
    invalidMutation();
  }
  return {
    kind: "status",
    input: {
      projectId: mutation.projectId,
      venueId: mutation.entityId,
      expectedRevision: baseRevision(mutation.baseRevision),
      operationId: mutation.operationId,
      deviceId: mutation.deviceId,
      status,
      rejectionReason,
    },
  };
}

function visitNoteCommand(
  mutation: ScopedVenueMutation,
  payload: JsonRecord,
): VenueReplayCommand {
  requireNoBaseRevision(mutation.baseRevision);
  const interactionId = uuidValue(payload.interactionId);
  if (interactionId !== mutation.operationId) invalidMutation();

  return {
    kind: "visit_note",
    input: {
      projectId: mutation.projectId,
      venueId: mutation.entityId,
      interactionId,
      contactId: nullableUuid(payload.contactId),
      interactionType: stringValue(payload.interactionType),
      occurredAt: stringValue(payload.occurredAt),
      summary: stringValue(payload.summary),
      nextFollowUpAt: nullableString(payload.nextFollowUpAt),
      sourceId: nullableUuid(payload.sourceId),
    },
  };
}

function factObservationCommand(
  mutation: ScopedVenueMutation,
  payload: JsonRecord,
): VenueReplayCommand {
  requireNoBaseRevision(mutation.baseRevision);
  const observationId = uuidValue(payload.observationId);
  if (observationId !== mutation.operationId) invalidMutation();

  return {
    kind: "fact_observation",
    input: {
      projectId: mutation.projectId,
      factId: uuidValue(payload.factId),
      observationId,
      value: payload.value,
      rawValueText: nullableString(payload.rawValueText),
      evidenceLevel: stringValue(payload.evidenceLevel),
      confidence: stringValue(payload.confidence),
      observedAt: stringValue(payload.observedAt),
      note: nullableString(payload.note),
      supersedesObservationId: nullableUuid(payload.supersedesObservationId),
    },
  };
}

function memberRatingCommand(
  mutation: ScopedVenueMutation,
  payload: JsonRecord,
): VenueReplayCommand {
  const expectedRevision = nonNegativeInteger(payload.expectedRevision);
  if (ratingBaseRevision(mutation.baseRevision) !== expectedRevision) {
    invalidMutation();
  }

  return {
    kind: "member_rating",
    input: {
      projectId: mutation.projectId,
      venueId: mutation.entityId,
      dimensionKey: stringValue(payload.dimensionKey),
      rating: finiteNumber(payload.rating),
      expectedRevision,
      operationId: mutation.operationId,
      deviceId: mutation.deviceId,
    },
  };
}

export function venueReplayCommand(
  mutation: PendingMutationEnvelope,
  scope: LocalProjectScope,
): VenueReplayCommand {
  assertScope(mutation, scope);
  const payload = objectValue(mutation.payload);
  if (mutation.mutationType === VENUE_CORE_UPDATE_MUTATION) {
    return coreCommand(mutation, payload);
  }
  if (mutation.mutationType === VENUE_STATUS_MUTATION) {
    return statusCommand(mutation, payload);
  }
  if (mutation.mutationType === VENUE_VISIT_NOTE_MUTATION) {
    return visitNoteCommand(mutation, payload);
  }
  if (mutation.mutationType === VENUE_VISIT_FACT_OBSERVATION_MUTATION) {
    return factObservationCommand(mutation, payload);
  }
  if (mutation.mutationType === VENUE_VISIT_MEMBER_RATING_MUTATION) {
    return memberRatingCommand(mutation, payload);
  }
  return invalidMutation();
}

function retryableStatus(
  mutation: PendingMutationEnvelope,
): boolean {
  return (
    mutation.status === "pending" ||
    mutation.status === "sending" ||
    mutation.status === "failed_retryable"
  );
}

export function retryableVenueMutation(
  mutation: PendingMutationEnvelope,
): boolean {
  return (
    mutation.entityType === "venue" &&
    (mutation.mutationType === VENUE_CORE_UPDATE_MUTATION ||
      mutation.mutationType === VENUE_STATUS_MUTATION) &&
    retryableStatus(mutation)
  );
}

export function retryableVenueVisitMutation(
  mutation: PendingMutationEnvelope,
): boolean {
  return (
    mutation.entityType === "venue" &&
    (mutation.mutationType === VENUE_VISIT_NOTE_MUTATION ||
      mutation.mutationType === VENUE_VISIT_FACT_OBSERVATION_MUTATION ||
      mutation.mutationType === VENUE_VISIT_MEMBER_RATING_MUTATION) &&
    retryableStatus(mutation)
  );
}
