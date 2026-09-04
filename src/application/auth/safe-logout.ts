import type { AuthPort } from "@application/auth/auth-port";
import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
import type { LocalProjectPurgePort } from "@application/local-data/local-project-purge-port";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type {
  LocalProjectStoreFactory,
  LocalSyncCounters,
} from "@application/local-data/local-project-store";

export type LogoutAssessment =
  | { readonly kind: "ready" }
  | { readonly kind: "resolution_required"; readonly unresolvedCount: number }
  | { readonly kind: "local_state_unavailable" };

export type LogoutResult =
  | LogoutAssessment
  | { readonly kind: "auth_failed" }
  | { readonly kind: "purge_failed" }
  | { readonly kind: "context_cleanup_failed" }
  | { readonly kind: "completed" };

export interface SafeLogoutDependencies {
  readonly auth: Pick<AuthPort, "signOut"> | null;
  readonly localStoreFactory: LocalProjectStoreFactory | null;
  readonly localPurge: LocalProjectPurgePort | null;
  readonly sessionContext: ProjectSessionContextPort | null;
  readonly appVersion: string;
}

function unresolvedCount(counters: LocalSyncCounters): number {
  return (
    counters.pendingCount +
    counters.conflictCount +
    counters.retryableFailureCount +
    counters.permanentFailureCount
  );
}

export class SafeLogoutCoordinator {
  public constructor(private readonly dependencies: SafeLogoutDependencies) {}

  public async inspect(scope: LocalProjectScope): Promise<LogoutAssessment> {
    const factory = this.dependencies.localStoreFactory;
    if (factory === null) return { kind: "local_state_unavailable" };

    try {
      const store = await factory.open(scope, this.dependencies.appVersion);
      try {
        const count = unresolvedCount(await store.readSyncCounters());
        return count === 0
          ? { kind: "ready" }
          : { kind: "resolution_required", unresolvedCount: count };
      } finally {
        store.close();
      }
    } catch {
      return { kind: "local_state_unavailable" };
    }
  }

  public async logout(
    scope: LocalProjectScope,
    discardPending: boolean,
  ): Promise<LogoutResult> {
    const { auth, localPurge, sessionContext } = this.dependencies;
    if (auth === null || localPurge === null || sessionContext === null) {
      return { kind: "local_state_unavailable" };
    }

    const assessment = await this.inspect(scope);
    if (assessment.kind === "local_state_unavailable") return assessment;
    if (assessment.kind === "resolution_required" && !discardPending) {
      return assessment;
    }

    try {
      await auth.signOut();
    } catch {
      return { kind: "auth_failed" };
    }

    try {
      await localPurge.purge(scope);
    } catch {
      return { kind: "purge_failed" };
    }

    try {
      sessionContext.clear(scope.projectId);
    } catch {
      return { kind: "context_cleanup_failed" };
    }

    return { kind: "completed" };
  }
}
