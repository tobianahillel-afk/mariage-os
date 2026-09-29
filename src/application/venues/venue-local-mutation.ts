import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type { PendingMutationEnvelope } from "@application/local-data/local-records";
import type { VenueTransitionInput } from "@application/venues/venue-command-port";
import type { VenueCoreUpdateInput } from "@application/venues/venue-repository-port";
import { isVenueStatus } from "@domain/venues/venue-status";

export const VENUE_CORE_UPDATE_MUTATION = "update_venue_core";
export const VENUE_STATUS_MUTATION = "transition_venue_status";

export type VenueReplayCommand =
  | { readonly kind: "core"; readonly input: VenueCoreUpdateInput }
  | { readonly kind: "status"; readonly input: VenueTransitionInput };

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

function baseRevision(value: string | null): number {
  if (value === null || !/^[1-9]\d*$/.test(value)) return invalidMutation();
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : invalidMutation();
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
  return invalidMutation();
}

export function retryableVenueMutation(
  mutation: PendingMutationEnvelope,
): boolean {
  return (
    mutation.entityType === "venue" &&
    (mutation.status === "pending" ||
      mutation.status === "sending" ||
      mutation.status === "failed_retryable")
  );
}
