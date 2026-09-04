import type { AuthSessionState } from "@application/auth/auth-port";
import type { ProjectAccessPort } from "@application/projects/project-access-port";
import {
  protectedRoutePath,
  type AppRoute,
} from "@application/routing/app-route";

export interface SessionReader {
  getSession(): Promise<AuthSessionState>;
}

export type ProtectedRouteDecision =
  | { readonly kind: "login_required"; readonly returnTo: string }
  | { readonly kind: "verification_required" }
  | { readonly kind: "project_unavailable" }
  | {
      readonly kind: "project_allowed";
      readonly projectId: string;
      readonly projectPath: string;
    };

async function readSessionOrNull(
  sessionReader: SessionReader,
): Promise<AuthSessionState | null> {
  try {
    return await sessionReader.getSession();
  } catch {
    return null;
  }
}

export async function resolveProtectedRoute(
  route: Extract<AppRoute, { kind: "protected_project" }>,
  sessionReader: SessionReader,
  projectAccess: ProjectAccessPort | null,
): Promise<ProtectedRouteDecision> {
  const session = await readSessionOrNull(sessionReader);

  if (session === null) {
    return { kind: "project_unavailable" };
  }
  if (session.kind === "signed_out") {
    return { kind: "login_required", returnTo: protectedRoutePath(route) };
  }
  if (session.kind === "authenticated_unverified") {
    return { kind: "verification_required" };
  }
  if (projectAccess === null) {
    return { kind: "project_unavailable" };
  }

  try {
    if (!(await projectAccess.canReadProject(route.projectId))) {
      return { kind: "project_unavailable" };
    }
  } catch {
    return { kind: "project_unavailable" };
  }

  return {
    kind: "project_allowed",
    projectId: route.projectId,
    projectPath: route.projectPath,
  };
}
