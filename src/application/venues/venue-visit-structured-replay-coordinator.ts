import {
  appendVenueFactObservation,
  type VenueFactContext,
  type VenueFactEvidencePort,
  type VenueFactProvenanceLinkPort,
  type VenueFactSourceReadPort,
} from "@application/facts/venue-fact-evidence-service";
import { venueFactPersistenceErrorCode } from "@application/facts/venue-fact-persistence-error";
import { venueVisitFactAcknowledgementMatches } from "./venue-visit-fact-acknowledgement";
import { checkedVenueVisitSourceLink } from "./venue-visit-checked-source-link";
import type { LocalProjectStore } from "@application/local-data/local-project-store";
import type { PendingMutationEnvelope } from "@application/local-data/local-records";
import {
  retryableVenueVisitMutation,
  venueReplayCommand,
  venueVisitMutation,
} from "@application/venues/venue-local-mutation";
import {
  addReplayFailureBlockers,
  createReplayDependencyBlockers,
  hasReplayBlockedDependency,
  orderStructuredReplayEntries,
  type StructuredReplayEntry,
  type StructuredVenueReplayCommand,
} from "@application/venues/venue-visit-replay-dependencies";
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
  "synced" | "pending" | "conflict" | "failed_permanent";

export interface VenueVisitStructuredReplayResult {
  readonly operationId: string;
  readonly state: VenueVisitStructuredReplayState;
  readonly error: string | null;
}

type VisitFactPorts = VenueFactEvidencePort &
  VenueFactSourceReadPort &
  VenueFactProvenanceLinkPort;

interface VenueVisitStructuredReplayDependencies {
  readonly local: LocalProjectStore;
  readonly interactions: VenueInteractionPort;
  readonly facts: VisitFactPorts;
  readonly memberOpinions: VenueMemberOpinionPort;
  readonly now: () => string;
}

interface RemoteFailure {
  readonly state: Exclude<VenueVisitStructuredReplayState, "synced">;
  readonly error: string;
}

type FactContextResult =
  | { readonly ok: true; readonly context: VenueFactContext }
  | { readonly ok: false; readonly failure: RemoteFailure };

type SourceReadResult =
  | { readonly ok: true; readonly revision: number }
  | { readonly ok: false; readonly failure: RemoteFailure };

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
  private readonly facts: VisitFactPorts;
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
    const retained = (await this.local.listPendingMutations()).filter(
      venueVisitMutation,
    );
    const ordered = orderStructuredReplayEntries(
      retained.map((mutation) => this.structuredReplayEntry(mutation)),
    );
    const blockers = createReplayDependencyBlockers();
    const results: VenueVisitStructuredReplayResult[] = [];

    for (const entry of ordered) {
      if (!retryableVenueVisitMutation(entry.mutation)) {
        addReplayFailureBlockers(blockers, entry);
      }
    }

    for (const entry of ordered) {
      const { mutation, command } = entry;
      if (!retryableVenueVisitMutation(mutation)) continue;

      if (command === null) {
        const result = await this.persistLocalFailure(mutation, {
          state: "failed_permanent",
          error: "invalid_local_mutation",
        });
        results.push(result);
        addReplayFailureBlockers(blockers, entry);
        continue;
      }

      if (hasReplayBlockedDependency(blockers, command)) {
        const result = await this.persistLocalFailure(mutation, {
          state: "pending",
          error: "dependency_pending",
        });
        results.push(result);
        addReplayFailureBlockers(blockers, entry);
        continue;
      }

      const result = await this.replayMutation(mutation, command);
      results.push(result);
      if (result.state !== "synced") {
        addReplayFailureBlockers(blockers, entry);
      }
    }
    return results;
  }

  private structuredReplayEntry(
    mutation: PendingMutationEnvelope,
  ): StructuredReplayEntry {
    try {
      return {
        mutation,
        command: venueReplayCommand(
          mutation,
          this.local.scope,
        ) as StructuredVenueReplayCommand,
      };
    } catch {
      return { mutation, command: null };
    }
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
    const contextResult = await this.factContext(command);
    if (!contextResult.ok) return contextResult.failure;

    const sourceResult = await this.factSourceResult(command);
    if (!sourceResult.ok) return sourceResult.failure;

    const observation = await appendVenueFactObservation(
      this.facts,
      command.input,
    );
    if (!observation.ok) return factFailure(observation.error);

    if (
      !venueVisitFactAcknowledgementMatches(
        command,
        contextResult.context,
        observation.observation,
        this.local.scope.userId,
      )
    ) {
      return { state: "failed_permanent", error: "provider_response_invalid" };
    }

    const link = await checkedVenueVisitSourceLink(this.facts, {
      projectId: command.input.projectId,
      observationId: command.input.observationId as string,
      sourceId: command.sourceId,
      isPrimary: true,
      expectedSourceType: command.sourceType,
      expectedSourceRevision: sourceResult.revision,
    });
    return link.ok ? null : factFailure(link.error);
  }

  private async factContext(
    command: Extract<
      StructuredVenueReplayCommand,
      { readonly kind: "fact_observation" }
    >,
  ): Promise<FactContextResult> {
    try {
      const context = await this.facts.getFactContext(
        command.input.projectId,
        command.input.factId,
      );
      return context.venueId === command.venueId
        ? { ok: true, context }
        : {
            ok: false,
            failure: {
              state: "failed_permanent",
              error: "fact_scope_mismatch",
            },
          };
    } catch (error) {
      return {
        ok: false,
        failure: factFailure(
          venueFactPersistenceErrorCode(error) ?? "persistence_failed",
        ),
      };
    }
  }

  private async factSourceResult(
    command: Extract<
      StructuredVenueReplayCommand,
      { readonly kind: "fact_observation" }
    >,
  ): Promise<SourceReadResult> {
    try {
      const source = await this.facts.getSource(
        command.input.projectId,
        command.sourceId,
      );
      if (
        source.projectId !== command.input.projectId ||
        source.id !== command.sourceId ||
        !Number.isSafeInteger(source.revision) ||
        source.revision < 1
      ) {
        return {
          ok: false,
          failure: {
            state: "failed_permanent",
            error: "provider_response_invalid",
          },
        };
      }
      if (source.sourceType !== command.sourceType) {
        return {
          ok: false,
          failure: {
            state: "failed_permanent",
            error: "fact_source_type_mismatch",
          },
        };
      }
      return { ok: true, revision: source.revision };
    } catch (error) {
      return {
        ok: false,
        failure: factFailure(
          venueFactPersistenceErrorCode(error) ?? "persistence_failed",
        ),
      };
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
