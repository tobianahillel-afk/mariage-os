import { beforeEach, expect, it, vi } from "vitest";
import type { ProjectAccessPort } from "@application/projects/project-access-port";
import type { SessionReader } from "@application/routing/protected-route-guard";

const renderShell = vi.hoisted(() => vi.fn());
vi.mock("@ui/shell/render-shell", () => ({ renderShell }));

import { startApplication } from "./start-application";

const projectId = "81111111-1111-4111-8111-111111111111";

function rootWithClear(clear = vi.fn()): HTMLElement {
  return { replaceChildren: clear } as unknown as HTMLElement;
}

beforeEach(() => {
  renderShell.mockReset();
});

it("renders public RSVP without clearing or consulting project authentication", async () => {
  const clear = vi.fn();
  const root = rootWithClear(clear);
  const sessionReader: SessionReader = { getSession: vi.fn() };
  const projectAccess: ProjectAccessPort = { canReadProject: vi.fn() };

  await startApplication(root, {
    pathname: "/rsvp/opaque-capability",
    sessionReader,
    projectAccess,
  });

  expect(clear).not.toHaveBeenCalled();
  expect(sessionReader.getSession).not.toHaveBeenCalled();
  expect(projectAccess.canReadProject).not.toHaveBeenCalled();
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
  });

  expect(events).toEqual(["clear", "session", "render"]);
  expect(renderShell).toHaveBeenCalledWith(root, {
    kind: "project_unavailable",
  });
});

it("renders project shell only after verified live project access", async () => {
  const root = rootWithClear();
  const sessionReader: SessionReader = {
    getSession: vi.fn().mockResolvedValue({
      kind: "authenticated_verified",
      userId: "user-1",
      email: "owner@example.invalid",
      assurance: "aal2",
    }),
  };
  const projectAccess: ProjectAccessPort = {
    canReadProject: vi.fn().mockResolvedValue(true),
  };

  await startApplication(root, {
    pathname: `/app/p/${projectId}/settings`,
    sessionReader,
    projectAccess,
  });

  expect(projectAccess.canReadProject).toHaveBeenCalledWith(projectId);
  expect(renderShell).toHaveBeenCalledWith(root, {
    kind: "project_allowed",
    projectId,
    projectPath: "/settings",
  });
});
