import type { PendingMutationEnvelope } from "@application/local-data/local-records";
import type { VenueReplayCommand } from "@application/venues/venue-local-mutation";

export type StructuredVenueReplayCommand = Extract<
  VenueReplayCommand,
  {
    readonly kind: "visit_note" | "fact_observation" | "member_rating";
  }
>;

export interface StructuredReplayEntry {
  readonly mutation: PendingMutationEnvelope;
  readonly command: StructuredVenueReplayCommand | null;
}

export interface ReplayDependencyBlockers {
  readonly factOperationIds: Set<string>;
  readonly ratingRevisionFloor: Map<string, number>;
}

function replayOrder(
  left: PendingMutationEnvelope,
  right: PendingMutationEnvelope,
): number {
  const createdOrder = left.createdAt.localeCompare(right.createdAt);
  return createdOrder !== 0
    ? createdOrder
    : left.operationId.localeCompare(right.operationId);
}

function ratingSeriesKey(
  command: Extract<
    StructuredVenueReplayCommand,
    { readonly kind: "member_rating" }
  >,
): string {
  return `${command.input.venueId}:${command.input.dimensionKey}`;
}

function dependsOn(
  candidate: StructuredReplayEntry,
  predecessor: StructuredReplayEntry,
): boolean {
  if (candidate.command === null || predecessor.command === null) return false;

  if (candidate.command.kind === "fact_observation") {
    return (
      candidate.command.input.supersedesObservationId ===
      predecessor.mutation.operationId
    );
  }

  if (
    candidate.command.kind === "member_rating" &&
    predecessor.command.kind === "member_rating" &&
    ratingSeriesKey(candidate.command) === ratingSeriesKey(predecessor.command)
  ) {
    return (
      predecessor.command.input.expectedRevision <
      candidate.command.input.expectedRevision
    );
  }

  return false;
}

export function orderStructuredReplayEntries(
  entries: readonly StructuredReplayEntry[],
): readonly StructuredReplayEntry[] {
  const remaining = [...entries].sort((left, right) =>
    replayOrder(left.mutation, right.mutation),
  );
  const ordered: StructuredReplayEntry[] = [];

  while (remaining.length > 0) {
    const candidateIndex = remaining.findIndex(
      (candidate, index) =>
        !remaining.some(
          (predecessor, predecessorIndex) =>
            predecessorIndex !== index && dependsOn(candidate, predecessor),
        ),
    );

    if (candidateIndex < 0) {
      ordered.push(...remaining);
      break;
    }

    const [candidate] = remaining.splice(candidateIndex, 1);
    if (candidate !== undefined) ordered.push(candidate);
  }

  return ordered;
}

export function createReplayDependencyBlockers(): ReplayDependencyBlockers {
  return {
    factOperationIds: new Set<string>(),
    ratingRevisionFloor: new Map<string, number>(),
  };
}

export function addReplayFailureBlockers(
  blockers: ReplayDependencyBlockers,
  entry: StructuredReplayEntry,
): void {
  const command = entry.command;
  if (command === null) {
    blockers.factOperationIds.add(entry.mutation.operationId);
    return;
  }

  if (command.kind === "fact_observation") {
    blockers.factOperationIds.add(entry.mutation.operationId);
    return;
  }

  if (command.kind === "member_rating") {
    const key = ratingSeriesKey(command);
    const current = blockers.ratingRevisionFloor.get(key);
    if (current === undefined || command.input.expectedRevision < current) {
      blockers.ratingRevisionFloor.set(key, command.input.expectedRevision);
    }
  }
}

export function hasReplayBlockedDependency(
  blockers: ReplayDependencyBlockers,
  command: StructuredVenueReplayCommand,
): boolean {
  if (
    command.kind === "fact_observation" &&
    command.input.supersedesObservationId !== null
  ) {
    return blockers.factOperationIds.has(
      command.input.supersedesObservationId,
    );
  }

  if (command.kind === "member_rating") {
    const floor = blockers.ratingRevisionFloor.get(ratingSeriesKey(command));
    return floor !== undefined && command.input.expectedRevision >= floor;
  }

  return false;
}
