import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
import type { SafeLogoutCoordinator } from "@application/auth/safe-logout";
import type { SecurityDiagnosticsPort } from "@application/auth/security-diagnostics-port";
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
import type {
  SecuritySettingsActions,
  SecuritySettingsState,
} from "@ui/shell/security-settings-panel";

export interface ApplicationShellDependencies {
  readonly pathname: string;
  readonly sessionReader: SessionReader;
  readonly projectAccess: ProjectAccessPort | null;
  readonly sessionContext: ProjectSessionContextPort | null;
  readonly securityDiagnostics: SecurityDiagnosticsPort | null;
  readonly logoutCoordinator: SafeLogoutCoordinator | null;
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

async function readProjectSyncSummary(
  decision: Extract<ProtectedRouteDecision, { kind: "project_allowed" }>,
  dependencies: ApplicationShellDependencies,
): Promise<SyncSummary> {
  if (
    dependencies.localStoreFactory === null ||
    dependencies.deviceId === null
  ) {
    return unavailableDurabilitySummary();
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
      return deriveSyncSummary({
        durability: "available",
        online: dependencies.online,
        syncing: false,
        cloudSynchronized: false,
        ...counters,
      });
    } finally {
      store.close();
    }
  } catch {
    return unavailableDurabilitySummary();
  }
}

function needsSecurityState(projectPath: string): boolean {
  return (
    projectPath === "/settings/security" ||
    projectPath === "/settings/diagnostics"
  );
}

async function readSecurityState(
  port: SecurityDiagnosticsPort | null,
): Promise<SecuritySettingsState["diagnostics"]> {
  if (port === null) return { kind: "unavailable" };
  try {
    return {
      kind: "available",
      snapshot: await port.readSecurityDiagnostics(),
    };
  } catch {
    return { kind: "unavailable" };
  }
}

function createLogoutActions(
  root: HTMLElement,
  decision: Extract<ProtectedRouteDecision, { kind: "project_allowed" }>,
  dependencies: ApplicationShellDependencies,
): SecuritySettingsActions | null {
  const logoutCoordinator = dependencies.logoutCoordinator;
  const deviceId = dependencies.deviceId;
  if (logoutCoordinator === null || deviceId === null) return null;

  try {
    const scope = createLocalProjectScope(
      decision.userId,
      decision.projectId,
      deviceId,
    );
    return {
      async logout(discardPending) {
        const result = await logoutCoordinator.logout(
          scope,
          discardPending,
          () => root.replaceChildren(),
        );
        if (result.kind === "completed") {
          renderShell(root, { kind: "landing" });
        } else if (
          result.kind === "auth_failed" ||
          result.kind === "purge_failed" ||
          result.kind === "context_cleanup_failed"
        ) {
          renderShell(root, { kind: "project_unavailable" });
        }
        return result;
      },
    };
  } catch {
    return null;
  }
}

async function securitySettingsState(
  root: HTMLElement,
  decision: Extract<ProtectedRouteDecision, { kind: "project_allowed" }>,
  dependencies: ApplicationShellDependencies,
): Promise<SecuritySettingsState | undefined> {
  if (!needsSecurityState(decision.projectPath)) return undefined;

  return {
    diagnostics: await readSecurityState(dependencies.securityDiagnostics),
    actions:
      decision.projectPath === "/settings/security"
        ? createLogoutActions(root, decision, dependencies)
        : null,
  };
}

async function projectShellState(
  root: HTMLElement,
  decision: Extract<ProtectedRouteDecision, { kind: "project_allowed" }>,
  dependencies: ApplicationShellDependencies,
): Promise<ProjectShellState> {
  const securitySettings = await securitySettingsState(
    root,
    decision,
    dependencies,
  );
  return {
    ...decision,
    syncSummary: await readProjectSyncSummary(decision, dependencies),
    ...(securitySettings === undefined ? {} : { securitySettings }),
  };
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
    renderShell(root, await projectShellState(root, decision, dependencies));
    return;
  }
  renderShell(root, decision);
}
