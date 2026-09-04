import type { ProjectAccessPort } from "@application/projects/project-access-port";
import { parseAppRoute } from "@application/routing/app-route";
import {
  resolveProtectedRoute,
  type SessionReader,
} from "@application/routing/protected-route-guard";
import { renderShell } from "@ui/shell/render-shell";

export interface ApplicationShellDependencies {
  readonly pathname: string;
  readonly sessionReader: SessionReader;
  readonly projectAccess: ProjectAccessPort | null;
}

export async function startApplication(
  root: HTMLElement,
  dependencies: ApplicationShellDependencies,
): Promise<void> {
  const route = parseAppRoute(dependencies.pathname);

  if (route.kind !== "protected_project") {
    renderShell(root, route);
    return;
  }

  root.replaceChildren();
  const decision = await resolveProtectedRoute(
    route,
    dependencies.sessionReader,
    dependencies.projectAccess,
  );
  renderShell(root, decision);
}
