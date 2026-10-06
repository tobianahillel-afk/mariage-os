import {
  appendVenueFactObservation,
  type VenueFactEvidencePort,
} from "@application/facts/venue-fact-evidence-service";
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
} from "@application/venues/venue-member-opinion-service";

export type VenueVisitStructuredReplayState =
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

function failedMutation(
  mutation: PendingMutationEnvelope,
  failure: RemoteFailure,
): PendingMutationEnvelope {
  const status =
    failure.state === "conflict"
      ? "conflict"
      : failure.state === "failed_permanent"
        ? "failed_permanent"
        : "failed_retryable";

  return {
    ...mutation,
    status,
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
  return error === "persistence_failed"
    ? { state: "pending", error }
    : { state: "failed_permanent", error };
}

function structuredCommand(
  command: VenueReplayCommand,
): StructuredVenueReplayCommand {
  if (
    command.kind === "visit_note" ||
    command.kind === "fact_observation" ||
    command.kind === "member_rating"
  ) {
    return command;
  }
  throw new Error("Invalid persisted Venue visit mutation.");
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
    for (const mutation of pending) {
      results.push(await this.replayMutation(mutation));
    }
    return results;
  }

  private async replayMutation(
    mutation: PendingMutationEnvelope,
  ): Promise<VenueVisitStructuredReplayResult> {
    let command: StructuredVenueReplayCommand;
    try {
      command = structuredCommand(
        venueReplayCommand(mutation, this.local.scope),
      );
    } catch {
      return this.persistLocalFailure(mutation, {
        state: "failed_permanent",
        error: "invalid_local_mutation",
      });
    }

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
      const result = await appendVenueFactObservation(this.facts, command.input);
      return result.ok ? null : factFailure(result.error);
    }

    const result = await saveVenueMemberRating(
      this.memberOpinions,
      command.input,
    );
    return result.ok ? null : ratingFailure(result.error);
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
