import { expect, it, vi } from "vitest";

import type { AuthPort } from "@application/auth/auth-port";
import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
import type { LocalProjectPurgePort } from "@application/local-data/local-project-purge-port";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import type {
  LocalProjectStore,
  LocalProjectStoreFactory,
} from "@application/local-data/local-project-store";

import { SafeLogoutCoordinator } from "./safe-logout";

const scope = createLocalProjectScope(
  "71111111-1111-4111-8111-111111111111",
  "81111111-1111-4111-8111-111111111111",
  "61111111-1111-4111-8111-111111111111",
);

it("requires resolution when unsynced local visit media exists", async () => {
  const store = {
    readSyncCounters: vi.fn().mockResolvedValue({
      pendingCount: 0,
      conflictCount: 0,
      retryableFailureCount: 0,
      permanentFailureCount: 0,
      unsyncedBinaryCount: 1,
    }),
    close: vi.fn(),
  } as unknown as LocalProjectStore;
  const factory = {
    open: vi.fn().mockResolvedValue(store),
  } as LocalProjectStoreFactory;
  const auth = {
    signOut: vi.fn().mockResolvedValue(undefined),
  } as Pick<AuthPort, "signOut">;
  const localPurge: LocalProjectPurgePort = {
    purge: vi.fn().mockResolvedValue(undefined),
  };
  const sessionContext: ProjectSessionContextPort = {
    readUserId: vi.fn(),
    remember: vi.fn(),
    clear: vi.fn(),
  };

  const coordinator = new SafeLogoutCoordinator({
    auth,
    localStoreFactory: factory,
    localPurge,
    sessionContext,
    appVersion: "2.12-green",
  });

  await expect(coordinator.inspect(scope)).resolves.toEqual({
    kind: "resolution_required",
    unresolvedCount: 1,
  });
  expect(store.close).toHaveBeenCalledOnce();
});
