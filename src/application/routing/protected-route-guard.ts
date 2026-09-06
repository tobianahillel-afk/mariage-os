import type { AuthSessionState } from "@application/auth/auth-port";
import type { ProjectSessionContextPort } from "@application/auth/project-session-context-port";
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
  | { readonly kind: "session_expired"; readonly returnTo: string }
  | { readonly kind: "verification_required" }
  | { readonly kind: "project_unavailable" }
  | {
      readonly kind: "project_allowed";
      readonly userId: string;
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

function hasEstablishedContext(
  context: ProjectSessionContextPort | null,
  projectId: string,
): boolean {
  if (context === null) return false;
  try {
    return context.readUserId(projectId) !== null;
  } catch {
    return false;
  }
}

async function hasLiveProjectAccess(
  projectAccess: ProjectAccessPort | null,
  projectId: string,
): Promise<boolean> {
  if (projectAccess === null) return false;
  try {
    return await projectAccess.canReadProject(projectId);
  } catch {
    return false;
  }
}

export async function resolveProtectedRoute(
  route: Extract<AppRoute, { kind: "protected_project" }>,
  sessionReader: SessionReader,
  projectAccess: ProjectAccessPort | null,
  sessionContext: ProjectSessionContextPort | null = null,
): Promise<ProtectedRouteDecision> {
  const session = await readSessionOrNull(sessionReader);

  if (session === null) {
    return { kind: "project_unavailable" };
  }
  if (session.kind === "signed_out") {
    const returnTo = protectedRoutePath(route);
    return hasEstablishedContext(sessionContext, route.projectId)
      ? { kind: "session_expired", returnTo }
      : { kind: "login_required", returnTo };
  }
  if (session.kind === "authenticated_unverified") {
    return { kind: "verification_required" };
  }
  if (!(await hasLiveProjectAccess(projectAccess, route.projectId))) {
    return { kind: "project_unavailable" };
  }

  return {
    kind: "project_allowed",
    userId: session.userId,
    projectId: route.projectId,
    projectPath: route.projectPath,
  };
}
