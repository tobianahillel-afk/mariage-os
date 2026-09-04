import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
import type { LocalProjectStoreFactory } from "@application/local-data/local-project-store";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import {
  deriveSyncSummary,
  type SyncSummary,
} from "@application/local-data/sync-summary";
import type { ProjectAccessPort } from "@application/projects/project-access-port";
import { parseAppRoute } from "@application/routing/app-route";
import {
  resolveProtectedRoute,
  type ProtectedRouteDecision,
  type SessionReader,
} from "@application/routing/protected-route-guard";
import { renderShell, type ProjectShellState } from "@ui/shell/render-shell";

export interface ApplicationShellDependencies {
  readonly pathname: string;
  readonly sessionReader: SessionReader;
  readonly projectAccess: ProjectAccessPort | null;
  readonly sessionContext: ProjectSessionContextPort | null;
  readonly localStoreFactory: LocalProjectStoreFactory | null;
  readonly deviceId: string | null;
  readonly online: boolean;
  readonly appVersion: string;
}

function unavailableDurabilitySummary(): SyncSummary {
  return deriveSyncSummary({
    durability: "unavailable",
    online: false,
    syncing: false,
    cloudSynchronized: false,
    pendingCount: 0,
    conflictCount: 0,
    retryableFailureCount: 0,
    permanentFailureCount: 0,
  });
}

function rememberAuthorizedContext(
  decision: Extract<ProtectedRouteDecision, { kind: "project_allowed" }>,
  sessionContext: ProjectSessionContextPort | null,
): void {
  if (sessionContext === null) return;
  try {
    sessionContext.remember(decision.projectId, decision.userId);
  } catch {
    // Recovery metadata is best-effort and never an authorization boundary.
  }
}

async function projectShellState(
  decision: Extract<ProtectedRouteDecision, { kind: "project_allowed" }>,
  dependencies: ApplicationShellDependencies,
): Promise<ProjectShellState> {
  if (
    dependencies.localStoreFactory === null ||
    dependencies.deviceId === null
  ) {
    return { ...decision, syncSummary: unavailableDurabilitySummary() };
  }

  try {
    const scope = createLocalProjectScope(
      decision.userId,
      decision.projectId,
      dependencies.deviceId,
    );
    const store = await dependencies.localStoreFactory.open(
      scope,
      dependencies.appVersion,
    );
    try {
      const counters = await store.readSyncCounters();
      return {
        ...decision,
        syncSummary: deriveSyncSummary({
          durability: "available",
          online: dependencies.online,
          syncing: false,
          cloudSynchronized: false,
          ...counters,
        }),
      };
    } finally {
      store.close();
    }
  } catch {
    return { ...decision, syncSummary: unavailableDurabilitySummary() };
  }
}

export async function startApplication(
  root: HTMLElement,
  dependencies: ApplicationShellDependencies,
): Promise<void> {
  const route = parseAppRoute(dependencies.pathname);

  if (route.kind !== "protected_project") {
    renderShell(root, route);
    return;
  }

  root.replaceChildren();
  const decision = await resolveProtectedRoute(
    route,
    dependencies.sessionReader,
    dependencies.projectAccess,
    dependencies.sessionContext,
  );
  if (decision.kind === "project_allowed") {
    rememberAuthorizedContext(decision, dependencies.sessionContext);
    renderShell(root, await projectShellState(decision, dependencies));
    return;
  }
  renderShell(root, decision);
}
