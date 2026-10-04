import type { LocalProjectStore } from "@application/local-data/local-project-store";
import {
  VENUE_CACHE_RECORD_TYPE,
  venueFromCachedRecord,
} from "@application/venues/venue-local-cache";
import type {
  VenueMemberOpinionPort,
  VenueMemberPreferenceRecord,
  VenueMemberRatingRecord,
} from "@application/venues/venue-member-opinion-service";
import {
  getVenueCompatibility,
  type VenueCompatibilityReadModel,
} from "@application/venues/venue-compatibility-service";
import type { VenueCompatibilityQueryPort } from "@application/venues/venue-compatibility-query-port";
import type {
  VenueCoreRecord,
  VenueRepositoryPort,
} from "@application/venues/venue-repository-port";
import type {
  VenueWorkspaceDecisionContext,
  VenueWorkspaceDecisionContextReader,
} from "@application/venues/venue-workspace-decision-context";
import { compareVenueCodes } from "@domain/venues/venue-code";

type VenueWorkspaceSyncState = "synced" | "pending" | "conflict" | "unknown";
type VenueWorkspaceBlockingStatus =
  VenueCompatibilityReadModel["aggregate"]["blockingStatus"];

export interface VenueWorkspaceCompatibilitySummary {
  readonly blockingStatus: VenueWorkspaceBlockingStatus;
  readonly weightedScore: number | null;
  readonly evidenceReadiness: number | null;
  readonly unknownImportantCriteria: number;
  readonly conflictingCriteria: number;
  readonly missingCriticalCriteria: number;
  readonly targetGuestCount: number | null;
  readonly supportMaximumGuestCount: number | null;
  readonly targetGuestCountPasses: boolean | null;
  readonly externalCatererOutcome:
    VenueCompatibilityReadModel["evaluations"][number]["outcome"] | null;
}

interface VenueWorkspaceOpinionSummary {
  readonly ownPreference: VenueMemberPreferenceRecord | null;
  readonly ratings: readonly VenueMemberRatingRecord[];
}

export interface VenueWorkspaceItem {
  readonly venue: VenueCoreRecord;
  readonly syncState: VenueWorkspaceSyncState;
  readonly compatibility: VenueWorkspaceCompatibilitySummary | null;
  readonly decisionContext: VenueWorkspaceDecisionContext | null;
  readonly opinions: VenueWorkspaceOpinionSummary;
}

interface VenueWorkspaceReadDependencies {
  readonly repository: VenueRepositoryPort;
  readonly compatibility: VenueCompatibilityQueryPort;
  readonly opinions: VenueMemberOpinionPort;
  readonly decisionContext?: VenueWorkspaceDecisionContextReader;
  readonly now: () => string;
}

interface LocalVenueState {
  readonly venue: VenueCoreRecord;
  readonly syncState: "synced" | "pending" | "conflict";
}

type VenueCompatibilityEvaluation =
  VenueCompatibilityReadModel["evaluations"][number];

function isMissingCriticalEvaluation(
  evaluation: VenueCompatibilityEvaluation,
): boolean {
  const criticalPriority =
    evaluation.priority === "blocking" || evaluation.priority === "important";
  return criticalPriority && evaluation.outcome === "UNKNOWN";
}

function naturalVenueOrder(
  left: VenueCoreRecord,
  right: VenueCoreRecord,
): number {
  const codeOrder = compareVenueCodes(left.code, right.code);
  if (codeOrder !== 0) return codeOrder;
  const nameOrder = left.name.localeCompare(right.name, "fr", {
    sensitivity: "base",
  });
  return nameOrder !== 0 ? nameOrder : left.id.localeCompare(right.id);
}

function guestCountComparison(model: VenueCompatibilityReadModel) {
  const explanation = model.dynamicGuestCountExplanation;
  return explanation === null ? null : explanation.comparison;
}

function externalCatererOutcome(
  model: VenueCompatibilityReadModel,
): VenueWorkspaceCompatibilitySummary["externalCatererOutcome"] {
  const evaluation = model.evaluations.find(
    (item) => item.key === "external_caterer_allowed",
  );
  return evaluation === undefined ? null : evaluation.outcome;
}

function compatibilitySummary(
  model: VenueCompatibilityReadModel,
): VenueWorkspaceCompatibilitySummary {
  const comparison = guestCountComparison(model);
  return {
    blockingStatus: model.aggregate.blockingStatus,
    weightedScore: model.aggregate.weightedScore,
    evidenceReadiness: model.readiness.evidenceReadiness,
    unknownImportantCriteria: model.aggregate.unknownImportantCriteria,
    conflictingCriteria: model.aggregate.conflictingCriteria,
    missingCriticalCriteria: model.evaluations.filter(
      isMissingCriticalEvaluation,
    ).length,
    targetGuestCount: model.targetGuestCount,
    supportMaximumGuestCount:
      comparison === null ? null : comparison.supportMaximumGuestCount,
    targetGuestCountPasses: comparison === null ? null : comparison.passes,
    externalCatererOutcome: externalCatererOutcome(model),
  };
}

async function readLocalVenues(
  projectId: string,
  local: LocalProjectStore | null,
): Promise<ReadonlyMap<string, LocalVenueState>> {
  if (local === null || local.scope.projectId !== projectId) return new Map();
  try {
    const records = await local.listCachedRecords(VENUE_CACHE_RECORD_TYPE);
    return new Map(
      records.map((record) => {
        const venue = venueFromCachedRecord(record);
        return [venue.id, { venue, syncState: record.syncMarker }] as const;
      }),
    );
  } catch {
    return new Map();
  }
}

function mergeVenues(
  cloud: readonly VenueCoreRecord[] | null,
  local: ReadonlyMap<string, LocalVenueState>,
): readonly VenueCoreRecord[] {
  if (cloud === null) {
    return [...local.values()]
      .map((item) => item.venue)
      .sort(naturalVenueOrder);
  }
  const cloudIds = new Set(cloud.map((venue) => venue.id));
  const venues = cloud.map((venue) => {
    const localState = local.get(venue.id);
    return localState !== undefined && localState.syncState !== "synced"
      ? localState.venue
      : venue;
  });
  for (const [venueId, state] of local) {
    if (!cloudIds.has(venueId) && state.syncState !== "synced") {
      venues.push(state.venue);
    }
  }
  return venues.sort(naturalVenueOrder);
}

export class VenueWorkspaceReadService {
  constructor(private readonly dependencies: VenueWorkspaceReadDependencies) {}

  async list(
    projectId: string,
    local: LocalProjectStore | null,
  ): Promise<readonly VenueWorkspaceItem[]> {
    const localState = await readLocalVenues(projectId, local);
    let cloud: readonly VenueCoreRecord[] | null;
    try {
      cloud = (await this.dependencies.repository.listVenues(projectId)).filter(
        (venue) => venue.projectId === projectId,
      );
    } catch {
      cloud = null;
    }
    const venues = mergeVenues(cloud, localState);
    const decisionContexts = await this.readDecisionContexts(projectId, venues);
    return Promise.all(
      venues.map((venue) =>
        this.item(
          projectId,
          venue,
          localState,
          decisionContexts.get(venue.id) ?? null,
        ),
      ),
    );
  }

  async detail(
    projectId: string,
    venueId: string,
    local: LocalProjectStore | null,
  ): Promise<VenueWorkspaceItem | null> {
    const localState = await readLocalVenues(projectId, local);
    let venue = localState.get(venueId)?.venue ?? null;
    if (venue === null) {
      try {
        venue = await this.dependencies.repository.getVenue(projectId, venueId);
      } catch {
        venue = null;
      }
    }
    if (
      venue === null ||
      venue.projectId !== projectId ||
      venue.id !== venueId
    ) {
      return null;
    }
    return this.item(projectId, venue, localState);
  }

  private async item(
    projectId: string,
    venue: VenueCoreRecord,
    local: ReadonlyMap<string, LocalVenueState>,
    prefetchedDecisionContext?: VenueWorkspaceDecisionContext | null,
  ): Promise<VenueWorkspaceItem> {
    const decisionContext =
      prefetchedDecisionContext === undefined
        ? this.readDecisionContext(projectId, venue.id)
        : Promise.resolve(prefetchedDecisionContext);
    const [compatibility, resolvedDecisionContext, ownPreference, ratings] =
      await Promise.all([
        this.readCompatibility(projectId, venue.id),
        decisionContext,
        this.readPreference(projectId, venue.id),
        this.readRatings(projectId, venue.id),
      ]);
    return {
      venue,
      syncState: local.get(venue.id)?.syncState ?? "unknown",
      compatibility,
      decisionContext: resolvedDecisionContext,
      opinions: { ownPreference, ratings },
    };
  }

  private async readCompatibility(
    projectId: string,
    venueId: string,
  ): Promise<VenueWorkspaceCompatibilitySummary | null> {
    try {
      const model = await getVenueCompatibility(
        this.dependencies.compatibility,
        {
          projectId,
          venueId,
          evaluatedAt: this.dependencies.now(),
        },
      );
      return model === null ? null : compatibilitySummary(model);
    } catch {
      return null;
    }
  }

  private async readDecisionContexts(
    projectId: string,
    venues: readonly VenueCoreRecord[],
  ): Promise<ReadonlyMap<string, VenueWorkspaceDecisionContext>> {
    const reader = this.dependencies.decisionContext;
    if (reader === undefined || venues.length === 0) return new Map();
    try {
      return await reader.readMany(
        projectId,
        venues.map((venue) => venue.id),
      );
    } catch {
      return new Map();
    }
  }

  private async readDecisionContext(
    projectId: string,
    venueId: string,
  ): Promise<VenueWorkspaceDecisionContext | null> {
    const reader = this.dependencies.decisionContext;
    if (reader === undefined) return null;
    try {
      return await reader.read(projectId, venueId);
    } catch {
      return null;
    }
  }

  private async readPreference(
    projectId: string,
    venueId: string,
  ): Promise<VenueMemberPreferenceRecord | null> {
    try {
      return await this.dependencies.opinions.getOwnVenuePreference(
        projectId,
        venueId,
      );
    } catch {
      return null;
    }
  }

  private async readRatings(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueMemberRatingRecord[]> {
    try {
      return await this.dependencies.opinions.listVenueRatings(
        projectId,
        venueId,
      );
    } catch {
      return [];
    }
  }
}
