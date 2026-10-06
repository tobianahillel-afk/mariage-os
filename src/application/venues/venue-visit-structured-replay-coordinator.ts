import {
  appendVenueFactObservation,
  linkVenueFactObservationSource,
  type VenueFactEvidencePort,
} from "@application/facts/venue-fact-evidence-service";
import { venueFactPersistenceErrorCode } from "@application/facts/venue-fact-persistence-error";
import type { LocalProjectStore } from "@application/local-data/local-project-store";
import type { PendingMutationEnvelope } from "@application/local-data/local-records";
import {
  retryableVenueVisitMutation,
  venueReplayCommand,
  type VenueReplayCommand,
} from "@application/venues/venue-local-mutation";
import {
  VenueInteractionService,
  type VenueInteractionPort,
} from "@application/venues/venue-interaction-service";
import {
  saveVenueMemberRating,
  type VenueMemberOpinionPort,
  type VenueMemberRatingRecord,
} from "@application/venues/venue-member-opinion-service";

type VenueVisitStructuredReplayState =
  | "synced"
  | "pending"
  | "conflict"
  | "failed_permanent";

export interface VenueVisitStructuredReplayResult {
  readonly operationId: string;
  readonly state: VenueVisitStructuredReplayState;
  readonly error: string | null;
}

interface VenueVisitStructuredReplayDependencies {
  readonly local: LocalProjectStore;
  readonly interactions: VenueInteractionPort;
  readonly facts: VenueFactEvidencePort;
  readonly memberOpinions: VenueMemberOpinionPort;
  readonly now: () => string;
}

interface RemoteFailure {
  readonly state: Exclude<VenueVisitStructuredReplayState, "synced">;
  readonly error: string;
}

type StructuredVenueReplayCommand = Extract<
  VenueReplayCommand,
  {
    readonly kind: "visit_note" | "fact_observation" | "member_rating";
  }
>;

function replayOrder(
  left: PendingMutationEnvelope,
  right: PendingMutationEnvelope,
): number {
  const createdOrder = left.createdAt.localeCompare(right.createdAt);
  return createdOrder !== 0
    ? createdOrder
    : left.operationId.localeCompare(right.operationId);
}

function sendingMutation(
  mutation: PendingMutationEnvelope,
  now: string,
): PendingMutationEnvelope {
  return {
    ...mutation,
    attemptCount: mutation.attemptCount + 1,
    lastAttemptAt: now,
    status: "sending",
    lastErrorCode: null,
  };
}

function failureStatus(
  state: RemoteFailure["state"],
): PendingMutationEnvelope["status"] {
  if (state === "conflict") return "conflict";
  if (state === "failed_permanent") return "failed_permanent";
  return "failed_retryable";
}

function failedMutation(
  mutation: PendingMutationEnvelope,
  failure: RemoteFailure,
): PendingMutationEnvelope {
  return {
    ...mutation,
    status: failureStatus(failure.state),
    lastErrorCode: failure.error,
  };
}

function noteFailure(error: string): RemoteFailure {
  if (error === "replay_conflict") {
    return { state: "conflict", error };
  }
  if (error === "persistence_failed") {
    return { state: "pending", error };
  }
  return { state: "failed_permanent", error };
}

function factFailure(error: string): RemoteFailure {
  if (error === "conflict") {
    return { state: "conflict", error };
  }
  if (error === "backend_unavailable" || error === "persistence_failed") {
    return { state: "pending", error };
  }
  return { state: "failed_permanent", error };
}

function ratingFailure(error: string): RemoteFailure {
  if (error === "conflict") {
    return { state: "conflict", error };
  }
  return error === "persistence_failed"
    ? { state: "pending", error }
    : { state: "failed_permanent", error };
}

function ratingDependencyKey(
  command: Extract<
    StructuredVenueReplayCommand,
    { readonly kind: "member_rating" }
  >,
): string {
  return `rating:${command.input.venueId}:${command.input.dimensionKey}`;
}

function requiredDependencyKeys(
  command: StructuredVenueReplayCommand,
): readonly string[] {
  if (command.kind === "member_rating") {
    return [ratingDependencyKey(command)];
  }
  if (
    command.kind === "fact_observation" &&
    command.input.supersedesObservationId !== null
  ) {
    return [`fact:${command.input.supersedesObservationId}`];
  }
  return [];
}

function blockedKeysAfterFailure(
  mutation: PendingMutationEnvelope,
  command: StructuredVenueReplayCommand,
): readonly string[] {
  const keys = [`fact:${mutation.operationId}`];
  if (command.kind === "member_rating") {
    keys.push(ratingDependencyKey(command));
  }
  return keys;
}

function hasBlockedDependency(
  command: StructuredVenueReplayCommand,
  blocked: ReadonlySet<string>,
): boolean {
  return requiredDependencyKeys(command).some((key) => blocked.has(key));
}

function ratingAcknowledgementFailure(
  command: Extract<
    StructuredVenueReplayCommand,
    { readonly kind: "member_rating" }
  >,
  rating: VenueMemberRatingRecord,
  expectedUserId: string,
): RemoteFailure | null {
  const expected = command.input;
  return rating.projectId === expected.projectId &&
    rating.venueId === expected.venueId &&
    rating.userId === expectedUserId &&
    rating.dimensionKey === expected.dimensionKey &&
    rating.rating === expected.rating &&
    rating.revision === expected.expectedRevision + 1
    ? null
    : { state: "failed_permanent", error: "provider_response_invalid" };
}

export class VenueVisitStructuredReplayCoordinator {
  private readonly local: LocalProjectStore;
  private readonly interactionService: VenueInteractionService;
  private readonly facts: VenueFactEvidencePort;
  private readonly memberOpinions: VenueMemberOpinionPort;
  private readonly now: () => string;

  constructor(dependencies: VenueVisitStructuredReplayDependencies) {
    this.local = dependencies.local;
    this.interactionService = new VenueInteractionService(
      dependencies.interactions,
    );
    this.facts = dependencies.facts;
    this.memberOpinions = dependencies.memberOpinions;
    this.now = dependencies.now;
  }

  async replayPending(): Promise<readonly VenueVisitStructuredReplayResult[]> {
    const pending = (await this.local.listPendingMutations())
      .filter(retryableVenueVisitMutation)
      .sort(replayOrder);
    const results: VenueVisitStructuredReplayResult[] = [];
    const blocked = new Set<string>();

    for (const mutation of pending) {
      let command: StructuredVenueReplayCommand;
      try {
        command = venueReplayCommand(
          mutation,
          this.local.scope,
        ) as StructuredVenueReplayCommand;
      } catch {
        const result = await this.persistLocalFailure(mutation, {
          state: "failed_permanent",
          error: "invalid_local_mutation",
        });
        results.push(result);
        blocked.add(`fact:${mutation.operationId}`);
        continue;
      }

      if (hasBlockedDependency(command, blocked)) {
        const result = await this.persistLocalFailure(mutation, {
          state: "pending",
          error: "dependency_pending",
        });
        results.push(result);
        for (const key of blockedKeysAfterFailure(mutation, command)) {
          blocked.add(key);
        }
        continue;
      }

      const result = await this.replayMutation(mutation, command);
      results.push(result);
      if (result.state !== "synced") {
        for (const key of blockedKeysAfterFailure(mutation, command)) {
          blocked.add(key);
        }
      }
    }
    return results;
  }

  private async replayMutation(
    mutation: PendingMutationEnvelope,
    command: StructuredVenueReplayCommand,
  ): Promise<VenueVisitStructuredReplayResult> {
    const sending = sendingMutation(mutation, this.now());
    try {
      await this.local.putPendingMutation(sending);
    } catch {
      return {
        operationId: mutation.operationId,
        state: "pending",
        error: "local_durability_unavailable",
      };
    }

    const failure = await this.dispatch(command);
    if (failure !== null) {
      return this.persistLocalFailure(sending, failure);
    }

    try {
      await this.local.removePendingMutation(mutation.operationId);
      return {
        operationId: mutation.operationId,
        state: "synced",
        error: null,
      };
    } catch {
      return {
        operationId: mutation.operationId,
        state: "pending",
        error: "settlement_pending",
      };
    }
  }

  private async dispatch(
    command: StructuredVenueReplayCommand,
  ): Promise<RemoteFailure | null> {
    if (command.kind === "visit_note") {
      const result = await this.interactionService.appendVenueInteraction(
        command.input,
      );
      return result.ok ? null : noteFailure(result.error);
    }

    if (command.kind === "fact_observation") {
      return this.dispatchFactObservation(command);
    }

    const result = await saveVenueMemberRating(
      this.memberOpinions,
      command.input,
    );
    if (!result.ok) return ratingFailure(result.error);
    return ratingAcknowledgementFailure(
      command,
      result.rating,
      this.local.scope.userId,
    );
  }

  private async dispatchFactObservation(
    command: Extract<
      StructuredVenueReplayCommand,
      { readonly kind: "fact_observation" }
    >,
  ): Promise<RemoteFailure | null> {
    const scopeFailure = await this.factScopeFailure(command);
    if (scopeFailure !== null) return scopeFailure;

    const observation = await appendVenueFactObservation(
      this.facts,
      command.input,
    );
    if (!observation.ok) return factFailure(observation.error);

    const link = await linkVenueFactObservationSource(this.facts, {
      projectId: command.input.projectId,
      observationId: command.input.observationId as string,
      sourceId: command.sourceId,
      isPrimary: true,
    });
    return link.ok ? null : factFailure(link.error);
  }

  private async factScopeFailure(
    command: Extract<
      StructuredVenueReplayCommand,
      { readonly kind: "fact_observation" }
    >,
  ): Promise<RemoteFailure | null> {
    try {
      const context = await this.facts.getFactContext(
        command.input.projectId,
        command.input.factId,
      );
      return context.venueId === command.venueId
        ? null
        : { state: "failed_permanent", error: "fact_scope_mismatch" };
    } catch (error) {
      return factFailure(
        venueFactPersistenceErrorCode(error) ?? "persistence_failed",
      );
    }
  }

  private async persistLocalFailure(
    mutation: PendingMutationEnvelope,
    failure: RemoteFailure,
  ): Promise<VenueVisitStructuredReplayResult> {
    try {
      await this.local.putPendingMutation(failedMutation(mutation, failure));
      return {
        operationId: mutation.operationId,
        state: failure.state,
        error: failure.error,
      };
    } catch {
      return {
        operationId: mutation.operationId,
        state: "pending",
        error: "local_durability_unavailable",
      };
    }
  }
}
