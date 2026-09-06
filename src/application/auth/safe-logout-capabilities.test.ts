import { expect, it, vi } from "vitest";
import type { AuthPort } from "@application/auth/auth-port";
import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
import type { LocalProjectPurgePort } from "@application/local-data/local-project-purge-port";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import type { LocalProjectStoreFactory } from "@application/local-data/local-project-store";
import { SafeLogoutCoordinator } from "./safe-logout";

const scope = createLocalProjectScope(
  "71111111-1111-4111-8111-111111111111",
  "81111111-1111-4111-8111-111111111111",
  "61111111-1111-4111-8111-111111111111",
);

function capabilities() {
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
  const localStoreFactory = { open: vi.fn() } as LocalProjectStoreFactory;
  return { auth, localPurge, sessionContext, localStoreFactory };
}

it("fails closed when scoped purge capability is missing", async () => {
  const target = capabilities();
  const coordinator = new SafeLogoutCoordinator({
    auth: target.auth,
    localStoreFactory: target.localStoreFactory,
    localPurge: null,
    sessionContext: target.sessionContext,
    appVersion: "1",
  });

  await expect(coordinator.logout(scope, false)).resolves.toEqual({
    kind: "local_state_unavailable",
  });
  expect(target.auth.signOut).not.toHaveBeenCalled();
});

it("fails closed when session context capability is missing", async () => {
  const target = capabilities();
  const coordinator = new SafeLogoutCoordinator({
    auth: target.auth,
    localStoreFactory: target.localStoreFactory,
    localPurge: target.localPurge,
    sessionContext: null,
    appVersion: "1",
  });

  await expect(coordinator.logout(scope, false)).resolves.toEqual({
    kind: "local_state_unavailable",
  });
  expect(target.auth.signOut).not.toHaveBeenCalled();
});

it("fails closed when local work cannot be inspected without a store factory", async () => {
  const target = capabilities();
  const coordinator = new SafeLogoutCoordinator({
    auth: target.auth,
    localStoreFactory: null,
    localPurge: target.localPurge,
    sessionContext: target.sessionContext,
    appVersion: "1",
  });

  await expect(coordinator.logout(scope, false)).resolves.toEqual({
    kind: "local_state_unavailable",
  });
  expect(target.auth.signOut).not.toHaveBeenCalled();
});
