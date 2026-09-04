import { expect, it, vi } from "vitest";
import type { AuthSessionState } from "@application/auth/auth-port";
import type { ProjectAccessPort } from "@application/projects/project-access-port";
import { parseAppRoute } from "./app-route";
import {
  resolveProtectedRoute,
  type SessionReader,
} from "./protected-route-guard";

const projectId = "81111111-1111-4111-8111-111111111111";
const userId = "71111111-1111-4111-8111-111111111111";

function protectedRoute() {
  const route = parseAppRoute(`/app/p/${projectId}/dashboard`);
  if (route.kind !== "protected_project") {
    throw new Error("Expected protected project route.");
  }
  return route;
}

function sessionReader(session: AuthSessionState): SessionReader {
  return { getSession: vi.fn().mockResolvedValue(session) };
}

function projectAccess(result: boolean): ProjectAccessPort {
  return { canReadProject: vi.fn().mockResolvedValue(result) };
}

const verifiedSession: AuthSessionState = {
  kind: "authenticated_verified",
  userId,
  email: "user@example.invalid",
  assurance: "aal2",
};

it("sends signed-out users to login with a local protected return path", async () => {
  const access = projectAccess(true);
  await expect(
    resolveProtectedRoute(
      protectedRoute(),
      sessionReader({ kind: "signed_out" }),
      access,
    ),
  ).resolves.toEqual({
    kind: "login_required",
    returnTo: `/app/p/${projectId}/dashboard`,
  });
  expect(access.canReadProject).not.toHaveBeenCalled();
});

it("does not treat an unverified identity as a project session", async () => {
  const access = projectAccess(true);
  await expect(
    resolveProtectedRoute(
      protectedRoute(),
      sessionReader({
        kind: "authenticated_unverified",
        userId,
        email: "user@example.invalid",
        assurance: "aal1",
      }),
      access,
    ),
  ).resolves.toEqual({ kind: "verification_required" });
  expect(access.canReadProject).not.toHaveBeenCalled();
});

it("fails closed when session evaluation throws", async () => {
  const access = projectAccess(true);
  const reader: SessionReader = {
    getSession: vi.fn().mockRejectedValue(new Error("session unavailable")),
  };

  await expect(
    resolveProtectedRoute(protectedRoute(), reader, access),
  ).resolves.toEqual({ kind: "project_unavailable" });
  expect(access.canReadProject).not.toHaveBeenCalled();
});

it("fails closed when project access composition is unavailable", async () => {
  await expect(
    resolveProtectedRoute(
      protectedRoute(),
      sessionReader(verifiedSession),
      null,
    ),
  ).resolves.toEqual({ kind: "project_unavailable" });
});

it("allows a verified user only after live project.read succeeds", async () => {
  const access = projectAccess(true);
  await expect(
    resolveProtectedRoute(
      protectedRoute(),
      sessionReader(verifiedSession),
      access,
    ),
  ).resolves.toEqual({
    kind: "project_allowed",
    userId,
    projectId,
    projectPath: "/dashboard",
  });
  expect(access.canReadProject).toHaveBeenCalledWith(projectId);
});

it("returns the same generic unavailable state for denied membership", async () => {
  await expect(
    resolveProtectedRoute(
      protectedRoute(),
      sessionReader({
        ...verifiedSession,
        userId: "outsider",
        email: "outsider@example.invalid",
      }),
      projectAccess(false),
    ),
  ).resolves.toEqual({ kind: "project_unavailable" });
});

it("fails closed when live access evaluation throws", async () => {
  const access: ProjectAccessPort = {
    canReadProject: vi.fn().mockRejectedValue(new Error("network failure")),
  };

  await expect(
    resolveProtectedRoute(
      protectedRoute(),
      sessionReader(verifiedSession),
      access,
    ),
  ).resolves.toEqual({ kind: "project_unavailable" });
});
