import { beforeEach, expect, it, vi } from "vitest";
import type {
  LocalProjectStore,
  LocalProjectStoreFactory,
  LocalSyncCounters,
} from "@application/local-data/local-project-store";
import type { LocalProjectScope } from "@application/local-data/local-project-scope";
import type { ProjectAccessPort } from "@application/projects/project-access-port";
import type { SessionReader } from "@application/routing/protected-route-guard";

const renderShell = vi.hoisted(() => vi.fn());
vi.mock("@ui/shell/render-shell", () => ({ renderShell }));

import { startApplication } from "./start-application";

const projectId = "81111111-1111-4111-8111-111111111111";
const userId = "71111111-1111-4111-8111-111111111111";
const deviceId = "61111111-1111-4111-8111-111111111111";

function rootWithClear(clear = vi.fn()): HTMLElement {
  return { replaceChildren: clear } as unknown as HTMLElement;
}

function baseDependencies() {
  return {
    localStoreFactory: null,
    deviceId: null,
    online: true,
    appVersion: "0.0.0",
  };
}

function verifiedSession(id = userId): SessionReader {
  return {
    getSession: vi.fn().mockResolvedValue({
      kind: "authenticated_verified",
      userId: id,
      email: "owner@example.invalid",
      assurance: "aal2",
    }),
  };
}

function successfulProjectAccess(): ProjectAccessPort {
  return { canReadProject: vi.fn().mockResolvedValue(true) };
}

function localFactory(counters: LocalSyncCounters) {
  const close = vi.fn();
  const open = vi.fn(async (scope: LocalProjectScope) => {
    const store = {
      scope,
      readSyncCounters: vi.fn().mockResolvedValue(counters),
      close,
    } as unknown as LocalProjectStore;
    return store;
  });
  return {
    factory: { open } as LocalProjectStoreFactory,
    open,
    close,
  };
}

beforeEach(() => {
  renderShell.mockReset();
});

it("renders public RSVP without clearing or consulting project or local authentication state", async () => {
  const clear = vi.fn();
  const root = rootWithClear(clear);
  const sessionReader: SessionReader = { getSession: vi.fn() };
  const projectAccess: ProjectAccessPort = { canReadProject: vi.fn() };
  const open = vi.fn();

  await startApplication(root, {
    pathname: "/rsvp/opaque-capability",
    sessionReader,
    projectAccess,
    localStoreFactory: { open } as LocalProjectStoreFactory,
    deviceId,
    online: true,
    appVersion: "0.0.0",
  });

  expect(clear).not.toHaveBeenCalled();
  expect(sessionReader.getSession).not.toHaveBeenCalled();
  expect(projectAccess.canReadProject).not.toHaveBeenCalled();
  expect(open).not.toHaveBeenCalled();
  expect(renderShell).toHaveBeenCalledWith(root, { kind: "public_rsvp" });
});

it("clears a protected shell before resolving a signed-out deep link", async () => {
  const clear = vi.fn();
  const root = rootWithClear(clear);
  const sessionReader: SessionReader = {
    getSession: vi.fn().mockResolvedValue({ kind: "signed_out" }),
  };
  const projectAccess: ProjectAccessPort = { canReadProject: vi.fn() };

  await startApplication(root, {
    pathname: `/app/p/${projectId}/venues/example`,
    sessionReader,
    projectAccess,
    ...baseDependencies(),
  });

  expect(clear).toHaveBeenCalledTimes(1);
  expect(projectAccess.canReadProject).not.toHaveBeenCalled();
  expect(renderShell).toHaveBeenCalledWith(root, {
    kind: "login_required",
    returnTo: `/app/p/${projectId}/venues/example`,
  });
});

it("clears stale private content before a failing session lookup", async () => {
  const events: string[] = [];
  const clear = vi.fn(() => events.push("clear"));
  const root = rootWithClear(clear);
  const sessionReader: SessionReader = {
    getSession: vi.fn().mockImplementation(() => {
      events.push("session");
      return Promise.reject(new Error("session unavailable"));
    }),
  };
  renderShell.mockImplementation(() => events.push("render"));

  await startApplication(root, {
    pathname: `/app/p/${projectId}/dashboard`,
    sessionReader,
    projectAccess: { canReadProject: vi.fn() },
    ...baseDependencies(),
  });

  expect(events).toEqual(["clear", "session", "render"]);
  expect(renderShell).toHaveBeenCalledWith(root, {
    kind: "project_unavailable",
  });
});

it("renders project shell with explicit degraded durability when local storage is unavailable", async () => {
  const root = rootWithClear();
  const projectAccess = successfulProjectAccess();

  await startApplication(root, {
    pathname: `/app/p/${projectId}/settings`,
    sessionReader: verifiedSession(),
    projectAccess,
    ...baseDependencies(),
  });

  expect(projectAccess.canReadProject).toHaveBeenCalledWith(projectId);
  expect(renderShell).toHaveBeenCalledWith(root, {
    kind: "project_allowed",
    userId,
    projectId,
    projectPath: "/settings",
    syncSummary: {
      kind: "durability_unavailable",
      label: "Stockage local indisponible · mode dégradé",
    },
  });
});

it("also degrades when a local factory exists but device identity is unavailable", async () => {
  const open = vi.fn();

  await startApplication(rootWithClear(), {
    pathname: `/app/p/${projectId}/dashboard`,
    sessionReader: verifiedSession(),
    projectAccess: successfulProjectAccess(),
    localStoreFactory: { open } as LocalProjectStoreFactory,
    deviceId: null,
    online: true,
    appVersion: "0.0.0",
  });

  expect(open).not.toHaveBeenCalled();
  expect(renderShell.mock.calls.at(-1)?.[1]).toMatchObject({
    syncSummary: { kind: "durability_unavailable" },
  });
});

it("opens only the authorized account+project namespace and renders its counters", async () => {
  const local = localFactory({
    pendingCount: 2,
    conflictCount: 0,
    retryableFailureCount: 0,
    permanentFailureCount: 0,
  });

  await startApplication(rootWithClear(), {
    pathname: `/app/p/${projectId}/dashboard`,
    sessionReader: verifiedSession(),
    projectAccess: successfulProjectAccess(),
    localStoreFactory: local.factory,
    deviceId,
    online: false,
    appVersion: "0.0.0",
  });

  expect(local.open).toHaveBeenCalledWith(
    { userId, projectId, deviceId },
    "0.0.0",
  );
  expect(local.close).toHaveBeenCalledTimes(1);
  expect(renderShell.mock.calls.at(-1)?.[1]).toMatchObject({
    kind: "project_allowed",
    userId,
    projectId,
    syncSummary: {
      kind: "offline_pending",
      label: "Hors ligne · 2 modifications en attente",
    },
  });
});

it("degrades without exposing data when opening local persistence fails", async () => {
  const factory: LocalProjectStoreFactory = {
    open: vi.fn().mockRejectedValue(new Error("storage blocked")),
  };

  await startApplication(rootWithClear(), {
    pathname: `/app/p/${projectId}/dashboard`,
    sessionReader: verifiedSession(),
    projectAccess: successfulProjectAccess(),
    localStoreFactory: factory,
    deviceId,
    online: true,
    appVersion: "0.0.0",
  });

  expect(renderShell.mock.calls.at(-1)?.[1]).toMatchObject({
    syncSummary: { kind: "durability_unavailable" },
  });
});

it("degrades if a provider ever returns a malformed verified user id", async () => {
  const open = vi.fn();

  await startApplication(rootWithClear(), {
    pathname: `/app/p/${projectId}/dashboard`,
    sessionReader: verifiedSession("malformed-user"),
    projectAccess: successfulProjectAccess(),
    localStoreFactory: { open } as LocalProjectStoreFactory,
    deviceId,
    online: true,
    appVersion: "0.0.0",
  });

  expect(open).not.toHaveBeenCalled();
  expect(renderShell.mock.calls.at(-1)?.[1]).toMatchObject({
    syncSummary: { kind: "durability_unavailable" },
  });
});
