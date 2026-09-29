import type { LocalProjectStore } from "@application/local-data/local-project-store";
import {
  createPendingMutationEnvelope,
  type PendingMutationEnvelope,
} from "@application/local-data/local-records";
import {
  retryableVenueMutation,
  venueReplayCommand,
  VENUE_CORE_UPDATE_MUTATION,
  VENUE_STATUS_MUTATION,
} from "@application/venues/venue-local-mutation";
import { VenueMutationPersistenceError } from "@application/venues/venue-mutation-persistence-error";
import type {
  VenueCommandPort,
  VenueTransitionInput,
} from "@application/venues/venue-command-port";
import {
  venueCachedRecord,
  venueFromCachedRecord,
  VENUE_CACHE_RECORD_TYPE,
} from "@application/venues/venue-local-cache";
import type {
  VenueCoreRecord,
  VenueCoreUpdateInput,
  VenueRepositoryPort,
} from "@application/venues/venue-repository-port";

export type VenueLocalSyncState =
  | "synced"
  | "pending"
  | "conflict"
  | "failed_permanent"
  | "durability_unavailable"
  | "cache_miss";

export interface VenueLocalSyncResult {
  readonly state: VenueLocalSyncState;
  readonly venue: VenueCoreRecord | null;
}

interface VenueLocalSyncDependencies {
  readonly local: LocalProjectStore;
  readonly repository: VenueRepositoryPort;
  readonly commands: VenueCommandPort;
  readonly now: () => string;
}

function assertScope(
  local: LocalProjectStore,
  projectId: string,
  deviceId: string,
): void {
  if (
    projectId !== local.scope.projectId ||
    deviceId !== local.scope.deviceId
  ) {
    throw new Error("Venue local sync scope mismatch.");
  }
}

function failureState(error: unknown): {
  readonly status: "conflict" | "failed_retryable" | "failed_permanent";
  readonly state: "conflict" | "pending" | "failed_permanent";
  readonly code: string;
} {
  if (error instanceof VenueMutationPersistenceError) {
    if (error.code === "conflict") {
      return { status: "conflict", state: "conflict", code: error.code };
    }
    if (error.code === "unavailable") {
      return {
        status: "failed_retryable",
        state: "pending",
        code: error.code,
      };
    }
    return {
      status: "failed_permanent",
      state: "failed_permanent",
      code: error.code,
    };
  }
  return {
    status: "failed_retryable",
    state: "pending",
    code: "unavailable",
  };
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
  error: unknown,
): {
  readonly mutation: PendingMutationEnvelope;
  readonly state: "conflict" | "pending" | "failed_permanent";
} {
  const failure = failureState(error);
  return {
    state: failure.state,
    mutation: {
      ...mutation,
      status: failure.status,
      lastErrorCode: failure.code,
    },
  };
}

function corePayload(input: VenueCoreUpdateInput) {
  return {
    name: input.name,
    code: input.code,
    websiteUrl: input.websiteUrl,
    city: input.city,
  };
}

function statusPayload(input: VenueTransitionInput) {
  return {
    status: input.status,
    rejectionReason: input.rejectionReason,
  };
}

function coreWorkingVenue(
  cached: VenueCoreRecord,
  input: VenueCoreUpdateInput,
): VenueCoreRecord {
  return {
    ...cached,
    name: input.name,
    code: input.code,
    websiteUrl: input.websiteUrl,
    city: input.city,
    revision: input.expectedRevision,
  };
}

function statusWorkingVenue(
  cached: VenueCoreRecord,
  input: VenueTransitionInput,
): VenueCoreRecord {
  return {
    ...cached,
    status: input.status,
    rejectionReason: input.rejectionReason,
    revision: input.expectedRevision,
  };
}

export class VenueLocalSyncCoordinator {
  private readonly local: LocalProjectStore;
  private readonly repository: VenueRepositoryPort;
  private readonly commands: VenueCommandPort;
  private readonly now: () => string;

  constructor(dependencies: VenueLocalSyncDependencies) {
    this.local = dependencies.local;
    this.repository = dependencies.repository;
    this.commands = dependencies.commands;
    this.now = dependencies.now;
  }

  async listCachedVenues(): Promise<readonly VenueCoreRecord[]> {
    const records = await this.local.listCachedRecords(VENUE_CACHE_RECORD_TYPE);
    return records.map(venueFromCachedRecord);
  }

  async refreshFromCloud(): Promise<readonly VenueCoreRecord[]> {
    const remote = await this.repository.listVenues(this.local.scope.projectId);
    for (const venue of remote) {
      const existing = await this.local.getCachedRecord(
        VENUE_CACHE_RECORD_TYPE,
        venue.id,
      );
      if (
        existing !== null &&
        (existing.syncMarker === "pending" ||
          existing.syncMarker === "conflict")
      ) {
        continue;
      }
      await this.local.putCachedRecord(
        venueCachedRecord(this.local.scope, venue, "synced"),
      );
    }
    return this.listCachedVenues();
  }

  async cacheCloudVenue(venue: VenueCoreRecord): Promise<void> {
    await this.local.putCachedRecord(
      venueCachedRecord(this.local.scope, venue, "synced"),
    );
  }

  async replayPending(): Promise<readonly VenueLocalSyncResult[]> {
    const mutations = await this.local.listPendingMutations();
    const results: VenueLocalSyncResult[] = [];
    for (const mutation of mutations) {
      if (!retryableVenueMutation(mutation)) continue;
      results.push(await this.replayMutation(mutation));
    }
    return results;
  }

  async updateCore(input: VenueCoreUpdateInput): Promise<VenueLocalSyncResult> {
    assertScope(this.local, input.projectId, input.deviceId);
    const cached = await this.cachedVenue(input.venueId);
    if (cached === null) return { state: "cache_miss", venue: null };
    const working = coreWorkingVenue(cached, input);
    const mutation = createPendingMutationEnvelope(this.local.scope, {
      operationId: input.operationId,
      entityType: "venue",
      entityId: input.venueId,
      mutationType: VENUE_CORE_UPDATE_MUTATION,
      baseRevision: String(input.expectedRevision),
      payload: corePayload(input),
      createdAt: this.now(),
      priorityClass: "essential_structured",
    });
    return this.persistThenSend(mutation, working, async () =>
      this.repository.updateVenueCore(input),
    );
  }

  async transitionStatus(
    input: VenueTransitionInput,
  ): Promise<VenueLocalSyncResult> {
    assertScope(this.local, input.projectId, input.deviceId);
    const cached = await this.cachedVenue(input.venueId);
    if (cached === null) return { state: "cache_miss", venue: null };
    const working = statusWorkingVenue(cached, input);
    const mutation = createPendingMutationEnvelope(this.local.scope, {
      operationId: input.operationId,
      entityType: "venue",
      entityId: input.venueId,
      mutationType: VENUE_STATUS_MUTATION,
      baseRevision: String(input.expectedRevision),
      payload: statusPayload(input),
      createdAt: this.now(),
      priorityClass: "essential_structured",
    });
    return this.persistThenSend(mutation, working, async () => {
      const revision = await this.commands.transitionVenue(input);
      return { ...working, revision };
    });
  }

  private async cachedVenue(venueId: string): Promise<VenueCoreRecord | null> {
    const record = await this.local.getCachedRecord(
      VENUE_CACHE_RECORD_TYPE,
      venueId,
    );
    return record === null ? null : venueFromCachedRecord(record);
  }

  private async replayMutation(
    mutation: PendingMutationEnvelope,
  ): Promise<VenueLocalSyncResult> {
    let command;
    try {
      command = venueReplayCommand(mutation, this.local.scope);
    } catch {
      await this.local.putPendingMutation({
        ...mutation,
        status: "failed_permanent",
        lastErrorCode: "invalid_local_mutation",
      });
      return { state: "failed_permanent", venue: null };
    }

    const cached = await this.cachedVenue(command.input.venueId);
    if (cached === null) return { state: "cache_miss", venue: null };

    if (command.kind === "core") {
      const working = coreWorkingVenue(cached, command.input);
      return this.sendPersistedMutation(mutation, working, () =>
        this.repository.updateVenueCore(command.input),
      );
    }

    const working = statusWorkingVenue(cached, command.input);
    return this.sendPersistedMutation(mutation, working, async () => {
      const revision = await this.commands.transitionVenue(command.input);
      return { ...working, revision };
    });
  }

  private async persistThenSend(
    mutation: PendingMutationEnvelope,
    working: VenueCoreRecord,
    send: () => Promise<VenueCoreRecord>,
  ): Promise<VenueLocalSyncResult> {
    try {
      await this.local.addPendingMutation(mutation);
      await this.local.putCachedRecord(
        venueCachedRecord(this.local.scope, working, "pending"),
      );
    } catch {
      return { state: "durability_unavailable", venue: null };
    }
    return this.sendPersistedMutation(mutation, working, send);
  }

  private async sendPersistedMutation(
    mutation: PendingMutationEnvelope,
    working: VenueCoreRecord,
    send: () => Promise<VenueCoreRecord>,
  ): Promise<VenueLocalSyncResult> {
    const sending = sendingMutation(mutation, this.now());
    try {
      await this.local.putPendingMutation(sending);
      const acknowledged = await send();
      await this.local.putCachedRecord(
        venueCachedRecord(this.local.scope, acknowledged, "synced"),
      );
      await this.local.removePendingMutation(mutation.operationId);
      return { state: "synced", venue: acknowledged };
    } catch (error) {
      const failed = failedMutation(sending, error);
      try {
        await this.local.putPendingMutation(failed.mutation);
        await this.local.putCachedRecord(
          venueCachedRecord(
            this.local.scope,
            working,
            failed.state === "conflict" ? "conflict" : "pending",
          ),
        );
      } catch {
        return { state: "pending", venue: working };
      }
      return { state: failed.state, venue: working };
    }
  }
}
