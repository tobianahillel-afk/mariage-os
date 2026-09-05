import { beforeEach, expect, it, vi } from "vitest";
import type { SafeLogoutCoordinator, LogoutResult } from "@application/auth/safe-logout";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type { ProjectShellState } from "@ui/shell/render-shell";

const renderShell = vi.hoisted(() => vi.fn());
vi.mock("@ui/shell/render-shell", () => ({ renderShell }));

import {
  startApplication,
  type ApplicationShellDependencies,
} from "./start-application";

const projectId = "81111111-1111-4111-8111-111111111111";
const userId = "71111111-1111-4111-8111-111111111111";
const deviceId = "61111111-1111-4111-8111-111111111111";

function rootWithClear(clear = vi.fn()): HTMLElement {
  return { replaceChildren: clear } as unknown as HTMLElement;
}

function dependencies(
  overrides: Partial<ApplicationShellDependencies> = {},
): ApplicationShellDependencies {
  return {
    pathname: `/app/p/${projectId}/settings/security`,
    sessionReader: {
      getSession: vi.fn().mockResolvedValue({
        kind: "authenticated_verified",
        userId,
        email: "owner@example.invalid",
        assurance: "aal2",
      }),
    },
    projectAccess: { canReadProject: vi.fn().mockResolvedValue(true) },
    sessionContext: null,
    securityDiagnostics: null,
    logoutCoordinator: null,
    localStoreFactory: null,
    deviceId: null,
    online: true,
    appVersion: "0.0.0",
    ...overrides,
  };
}

function fakeLogoutCoordinator(
  result: LogoutResult,
  runTransition = false,
): {
  readonly coordinator: SafeLogoutCoordinator;
  readonly logout: ReturnType<typeof vi.fn>;
} {
  const logout = vi.fn(
    async (
      _scope: LocalProjectScope,
      _discardPending: boolean,
      onSafeTransition: () => void,
    ): Promise<LogoutResult> => {
      if (runTransition) onSafeTransition();
      return result;
    },
  );
  return {
    coordinator: { logout } as unknown as SafeLogoutCoordinator,
    logout,
  };
}

function lastProjectState(): ProjectShellState {
  const state = renderShell.mock.calls.at(-1)?.[1] as
    | ProjectShellState
    | undefined;
  if (state?.kind !== "project_allowed") {
    throw new Error("Expected a rendered project shell state.");
  }
  return state;
}

beforeEach(() => {
  renderShell.mockReset();
});

it("fails security diagnostics closed on the diagnostics route", async () => {
  const diagnostics = {
    readSecurityDiagnostics: vi.fn().mockRejectedValue(new Error("provider")),
  };

  await startApplication(
    rootWithClear(),
    dependencies({
      pathname: `/app/p/${projectId}/settings/diagnostics`,
      securityDiagnostics: diagnostics,
    }),
  );

  expect(diagnostics.readSecurityDiagnostics).toHaveBeenCalledOnce();
  expect(lastProjectState().securitySettings).toEqual({
    diagnostics: { kind: "unavailable" },
    actions: null,
  });
});

it("keeps logout unavailable when device identity is missing", async () => {
  const target = fakeLogoutCoordinator({ kind: "completed" });

  await startApplication(
    rootWithClear(),
    dependencies({ logoutCoordinator: target.coordinator }),
  );

  expect(lastProjectState().securitySettings?.actions).toBeNull();
  expect(target.logout).not.toHaveBeenCalled();
});

it("runs the safe transition and renders landing after completed logout", async () => {
  const clear = vi.fn();
  const root = rootWithClear(clear);
  const target = fakeLogoutCoordinator({ kind: "completed" }, true);

  await startApplication(
    root,
    dependencies({
      logoutCoordinator: target.coordinator,
      deviceId,
    }),
  );
  const actions = lastProjectState().securitySettings?.actions;
  if (actions === null || actions === undefined) {
    throw new Error("Expected safe logout actions.");
  }

  await expect(actions.logout(false)).resolves.toEqual({ kind: "completed" });
  expect(clear).toHaveBeenCalledTimes(2);
  expect(renderShell).toHaveBeenLastCalledWith(root, { kind: "landing" });
});

it.each(["auth_failed", "purge_failed", "context_cleanup_failed"] as const)(
  "renders generic unavailable state after terminal logout result %s",
  async (kind) => {
    const root = rootWithClear();
    const target = fakeLogoutCoordinator({ kind });

    await startApplication(
      root,
      dependencies({
        logoutCoordinator: target.coordinator,
        deviceId,
      }),
    );
    const actions = lastProjectState().securitySettings?.actions;
    if (actions === null || actions === undefined) {
      throw new Error("Expected safe logout actions.");
    }

    await expect(actions.logout(false)).resolves.toEqual({ kind });
    expect(renderShell).toHaveBeenLastCalledWith(root, {
      kind: "project_unavailable",
    });
  },
);

it("does not replace the shell for a nonterminal logout assessment", async () => {
  const target = fakeLogoutCoordinator({
    kind: "resolution_required",
    unresolvedCount: 2,
  });

  await startApplication(
    rootWithClear(),
    dependencies({
      logoutCoordinator: target.coordinator,
      deviceId,
    }),
  );
  const callsBeforeLogout = renderShell.mock.calls.length;
  const actions = lastProjectState().securitySettings?.actions;
  if (actions === null || actions === undefined) {
    throw new Error("Expected safe logout actions.");
  }

  await expect(actions.logout(false)).resolves.toEqual({
    kind: "resolution_required",
    unresolvedCount: 2,
  });
  expect(renderShell).toHaveBeenCalledTimes(callsBeforeLogout);
});

it("fails closed when verified provider identity cannot form a local scope", async () => {
  const target = fakeLogoutCoordinator({ kind: "completed" });

  await startApplication(
    rootWithClear(),
    dependencies({
      sessionReader: {
        getSession: vi.fn().mockResolvedValue({
          kind: "authenticated_verified",
          userId: "malformed-user",
          email: "owner@example.invalid",
          assurance: "aal2",
        }),
      },
      logoutCoordinator: target.coordinator,
      deviceId,
    }),
  );

  expect(lastProjectState().securitySettings?.actions).toBeNull();
  expect(target.logout).not.toHaveBeenCalled();
});
