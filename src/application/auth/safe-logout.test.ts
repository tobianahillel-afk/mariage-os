import { describe, expect, it, vi } from "vitest";
import type { AuthPort } from "@application/auth/auth-port";
import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
import type { LocalProjectPurgePort } from "@application/local-data/local-project-purge-port";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import type {
  LocalProjectStore,
  LocalProjectStoreFactory,
  LocalSyncCounters,
} from "@application/local-data/local-project-store";
import { SafeLogoutCoordinator } from "./safe-logout";

const scope = createLocalProjectScope(
  "71111111-1111-4111-8111-111111111111",
  "81111111-1111-4111-8111-111111111111",
  "61111111-1111-4111-8111-111111111111",
);

const emptyCounters: LocalSyncCounters = {
  pendingCount: 0,
  conflictCount: 0,
  retryableFailureCount: 0,
  permanentFailureCount: 0,
};

function storeFactory(
  counters: LocalSyncCounters = emptyCounters,
): {
  readonly factory: LocalProjectStoreFactory;
  readonly store: LocalProjectStore;
} {
  const store = {
    readSyncCounters: vi.fn().mockResolvedValue(counters),
    close: vi.fn(),
  } as unknown as LocalProjectStore;
  return {
    store,
    factory: { open: vi.fn().mockResolvedValue(store) },
  };
}

function dependencies(counters: LocalSyncCounters = emptyCounters) {
  const { factory, store } = storeFactory(counters);
  const auth = { signOut: vi.fn().mockResolvedValue(undefined) } as Pick<
    AuthPort,
    "signOut"
  >;
  const localPurge: LocalProjectPurgePort = {
    purge: vi.fn().mockResolvedValue(undefined),
  };
  const sessionContext: ProjectSessionContextPort = {
    readUserId: vi.fn(),
    remember: vi.fn(),
    clear: vi.fn(),
  };
  return { factory, store, auth, localPurge, sessionContext };
}

describe("SafeLogoutCoordinator", () => {
  it("signs out, purges the scoped database and clears the marker when no work is pending", async () => {
    const target = dependencies();
    const coordinator = new SafeLogoutCoordinator({
      auth: target.auth,
      localStoreFactory: target.factory,
      localPurge: target.localPurge,
      sessionContext: target.sessionContext,
      appVersion: "1",
    });

    await expect(coordinator.logout(scope, false)).resolves.toEqual({
      kind: "completed",
    });
    expect(target.store.close).toHaveBeenCalledOnce();
    expect(target.auth.signOut).toHaveBeenCalledOnce();
    expect(target.localPurge.purge).toHaveBeenCalledWith(scope);
    expect(target.sessionContext.clear).toHaveBeenCalledWith(scope.projectId);
    expect(vi.mocked(target.auth.signOut).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(target.localPurge.purge).mock.invocationCallOrder[0] ?? 0,
    );
  });

  it("requires explicit resolution before pending work can be discarded", async () => {
    const target = dependencies({
      ...emptyCounters,
      pendingCount: 2,
      conflictCount: 1,
    });
    const coordinator = new SafeLogoutCoordinator({
      auth: target.auth,
      localStoreFactory: target.factory,
      localPurge: target.localPurge,
      sessionContext: target.sessionContext,
      appVersion: "1",
    });

    await expect(coordinator.logout(scope, false)).resolves.toEqual({
      kind: "resolution_required",
      unresolvedCount: 3,
    });
    expect(target.auth.signOut).not.toHaveBeenCalled();
    expect(target.localPurge.purge).not.toHaveBeenCalled();

    await expect(coordinator.logout(scope, true)).resolves.toEqual({
      kind: "completed",
    });
    expect(target.auth.signOut).toHaveBeenCalledOnce();
    expect(target.localPurge.purge).toHaveBeenCalledOnce();
  });

  it("counts retryable and permanent failures as unresolved local work", async () => {
    const target = dependencies({
      pendingCount: 0,
      conflictCount: 0,
      retryableFailureCount: 2,
      permanentFailureCount: 1,
    });
    const coordinator = new SafeLogoutCoordinator({
      auth: target.auth,
      localStoreFactory: target.factory,
      localPurge: target.localPurge,
      sessionContext: target.sessionContext,
      appVersion: "1",
    });

    await expect(coordinator.inspect(scope)).resolves.toEqual({
      kind: "resolution_required",
      unresolvedCount: 3,
    });
  });

  it("fails closed when local work cannot be inspected", async () => {
    const target = dependencies();
    const coordinator = new SafeLogoutCoordinator({
      auth: target.auth,
      localStoreFactory: {
        open: vi.fn().mockRejectedValue(new Error("storage unavailable")),
      },
      localPurge: target.localPurge,
      sessionContext: target.sessionContext,
      appVersion: "1",
    });

    await expect(coordinator.logout(scope, false)).resolves.toEqual({
      kind: "local_state_unavailable",
    });
    expect(target.auth.signOut).not.toHaveBeenCalled();
  });

  it("closes an opened store when counter inspection fails", async () => {
    const target = dependencies();
    vi.mocked(target.store.readSyncCounters).mockRejectedValue(
      new Error("corrupt local state"),
    );
    const coordinator = new SafeLogoutCoordinator({
      auth: target.auth,
      localStoreFactory: target.factory,
      localPurge: target.localPurge,
      sessionContext: target.sessionContext,
      appVersion: "1",
    });

    await expect(coordinator.inspect(scope)).resolves.toEqual({
      kind: "local_state_unavailable",
    });
    expect(target.store.close).toHaveBeenCalledOnce();
  });

  it("does not start logout when required local/auth capabilities are unavailable", async () => {
    const target = dependencies();
    const coordinator = new SafeLogoutCoordinator({
      auth: null,
      localStoreFactory: target.factory,
      localPurge: null,
      sessionContext: null,
      appVersion: "1",
    });

    await expect(coordinator.logout(scope, false)).resolves.toEqual({
      kind: "local_state_unavailable",
    });
  });

  it("preserves local data when provider sign-out fails", async () => {
    const target = dependencies();
    vi.mocked(target.auth.signOut).mockRejectedValue(new Error("auth failure"));
    const coordinator = new SafeLogoutCoordinator({
      auth: target.auth,
      localStoreFactory: target.factory,
      localPurge: target.localPurge,
      sessionContext: target.sessionContext,
      appVersion: "1",
    });

    await expect(coordinator.logout(scope, false)).resolves.toEqual({
      kind: "auth_failed",
    });
    expect(target.localPurge.purge).not.toHaveBeenCalled();
    expect(target.sessionContext.clear).not.toHaveBeenCalled();
  });

  it("keeps the context marker when scoped purge cannot complete", async () => {
    const target = dependencies();
    vi.mocked(target.localPurge.purge).mockRejectedValue(
      new Error("purge blocked"),
    );
    const coordinator = new SafeLogoutCoordinator({
      auth: target.auth,
      localStoreFactory: target.factory,
      localPurge: target.localPurge,
      sessionContext: target.sessionContext,
      appVersion: "1",
    });

    await expect(coordinator.logout(scope, false)).resolves.toEqual({
      kind: "purge_failed",
    });
    expect(target.sessionContext.clear).not.toHaveBeenCalled();
  });

  it("reports marker cleanup failure after provider logout and local purge", async () => {
    const target = dependencies();
    vi.mocked(target.sessionContext.clear).mockImplementation(() => {
      throw new Error("storage blocked");
    });
    const coordinator = new SafeLogoutCoordinator({
      auth: target.auth,
      localStoreFactory: target.factory,
      localPurge: target.localPurge,
      sessionContext: target.sessionContext,
      appVersion: "1",
    });

    await expect(coordinator.logout(scope, false)).resolves.toEqual({
      kind: "context_cleanup_failed",
    });
  });
});
