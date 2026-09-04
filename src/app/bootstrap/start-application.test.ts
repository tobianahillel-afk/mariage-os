import { beforeEach, expect, it, vi } from "vitest";
import type { ProjectAccessPort } from "@application/projects/project-access-port";
import type { SessionReader } from "@application/routing/protected-route-guard";

const renderShell = vi.hoisted(() => vi.fn());
vi.mock("@ui/shell/render-shell", () => ({ renderShell }));

import { startApplication } from "./start-application";

const projectId = "81111111-1111-4111-8111-111111111111";
const root = {} as HTMLElement;

beforeEach(() => {
  renderShell.mockReset();
});

it("renders public RSVP without consulting project authentication", async () => {
  const sessionReader: SessionReader = { getSession: vi.fn() };
  const projectAccess: ProjectAccessPort = { canReadProject: vi.fn() };

  await startApplication(root, {
    pathname: "/rsvp/opaque-capability",
    sessionReader,
    projectAccess,
  });

  expect(sessionReader.getSession).not.toHaveBeenCalled();
  expect(projectAccess.canReadProject).not.toHaveBeenCalled();
  expect(renderShell).toHaveBeenCalledWith(root, { kind: "public_rsvp" });
});

it("protects project deep links before rendering project UI", async () => {
  const sessionReader: SessionReader = {
    getSession: vi.fn().mockResolvedValue({ kind: "signed_out" }),
  };
  const projectAccess: ProjectAccessPort = { canReadProject: vi.fn() };

  await startApplication(root, {
    pathname: `/app/p/${projectId}/venues/example`,
    sessionReader,
    projectAccess,
  });

  expect(projectAccess.canReadProject).not.toHaveBeenCalled();
  expect(renderShell).toHaveBeenCalledWith(root, {
    kind: "login_required",
    returnTo: `/app/p/${projectId}/venues/example`,
  });
});

it("renders project shell only after verified live project access", async () => {
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
