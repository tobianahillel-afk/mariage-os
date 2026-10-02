import { beforeEach, expect, it, vi } from "vitest";
import type {
  LocalProjectStore,
  LocalProjectStoreFactory,
} from "@application/local-data/local-project-store";
import type { VenueWorkspaceReadService } from "@application/venues/venue-workspace-read-service";
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

function root(): HTMLElement {
  return { replaceChildren: vi.fn() } as unknown as HTMLElement;
}

function dependencies(
  overrides: Partial<ApplicationShellDependencies> = {},
): ApplicationShellDependencies {
  return {
    pathname: `/app/p/${projectId}/venues`,
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
    venueWorkspaceRead: null,
    deviceId: null,
    online: true,
    appVersion: "0.0.0",
    ...overrides,
  };
}

function workspaceService(
  list: ReturnType<typeof vi.fn>,
): VenueWorkspaceReadService {
  return { list } as unknown as VenueWorkspaceReadService;
}

function renderedProjectState(): ProjectShellState {
  const state = renderShell.mock.calls.at(-1)?.[1] as
    | ProjectShellState
    | undefined;
  if (state?.kind !== "project_allowed") {
    throw new Error("Expected rendered project shell.");
  }
  return state;
}

function localFactory(readSyncCounters: ReturnType<typeof vi.fn>) {
  const close = vi.fn();
  const store = {
    scope: { userId, projectId, deviceId },
    readSyncCounters,
    close,
  } as unknown as LocalProjectStore;
  const open = vi.fn().mockResolvedValue(store);
  return {
    factory: { open } as LocalProjectStoreFactory,
    store,
    open,
    close,
  };
}

beforeEach(() => {
  renderShell.mockReset();
});

it("fails the Venue workspace closed when no read service is available", async () => {
  await startApplication(root(), dependencies());

  expect(renderedProjectState().venueWorkspace).toEqual({
    kind: "unavailable",
  });
});

it("loads the Gallery through the authorized local store and closes it", async () => {
  const list = vi.fn().mockResolvedValue([]);
  const local = localFactory(
    vi.fn().mockResolvedValue({
      pendingCount: 0,
      conflictCount: 0,
      retryableFailureCount: 0,
      permanentFailureCount: 0,
    }),
  );

  await startApplication(
    root(),
    dependencies({
      venueWorkspaceRead: workspaceService(list),
      localStoreFactory: local.factory,
      deviceId,
    }),
  );

  expect(list).toHaveBeenCalledWith(projectId, local.store);
  expect(renderedProjectState().venueWorkspace).toEqual({
    kind: "gallery",
    items: [],
  });
  expect(local.open).toHaveBeenCalledTimes(2);
  expect(local.close).toHaveBeenCalledTimes(2);
});

it("fails the Venue workspace closed and closes local state when loading throws", async () => {
  const list = vi.fn().mockRejectedValue(new Error("synthetic read failure"));
  const local = localFactory(
    vi.fn().mockResolvedValue({
      pendingCount: 0,
      conflictCount: 0,
      retryableFailureCount: 0,
      permanentFailureCount: 0,
    }),
  );

  await startApplication(
    root(),
    dependencies({
      venueWorkspaceRead: workspaceService(list),
      localStoreFactory: local.factory,
      deviceId,
    }),
  );

  expect(renderedProjectState().venueWorkspace).toEqual({
    kind: "unavailable",
  });
  expect(local.close).toHaveBeenCalledTimes(2);
});

it("degrades sync durability and still closes a store whose counters fail", async () => {
  const local = localFactory(
    vi.fn().mockRejectedValue(new Error("synthetic counters failure")),
  );

  await startApplication(
    root(),
    dependencies({
      pathname: `/app/p/${projectId}/dashboard`,
      localStoreFactory: local.factory,
      deviceId,
    }),
  );

  expect(renderedProjectState().syncSummary).toEqual({
    kind: "durability_unavailable",
    label: "Stockage local indisponible · mode dégradé",
  });
  expect(local.close).toHaveBeenCalledOnce();
});
