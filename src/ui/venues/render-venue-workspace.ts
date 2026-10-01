import type { VenueWorkspaceState } from "@application/venues/venue-workspace-state";
import { parseVenueWorkspaceRoute } from "@application/venues/venue-workspace-route";
import { renderVenueCollection } from "./render-venue-collection";
import { renderVenueCompare } from "./render-venue-compare";
import { renderVenueDetail } from "./render-venue-detail";
import {
  textElement,
  workspaceSection,
} from "./venue-workspace-presentation";

function unavailableWorkspace(): HTMLElement {
  const section = workspaceSection("unavailable");
  section.append(
    textElement(
      "p",
      "Cette salle n’est pas disponible avec le contexte actuel.",
      "venue-empty-state",
    ),
  );
  return section;
}

function fallbackState(projectPath: string): VenueWorkspaceState {
  const route = parseVenueWorkspaceRoute(projectPath);
  if (route.kind === "detail") return { kind: "detail", item: null };
  if (route.kind === "compare") return { kind: "compare", items: [] };
  if (route.kind === "gallery") return { kind: "gallery", items: [] };
  return { kind: "unavailable" };
}

export function createVenueWorkspace(
  projectId: string,
  projectPath: string,
  state?: VenueWorkspaceState,
): HTMLElement {
  const resolved = state ?? fallbackState(projectPath);
  if (resolved.kind === "gallery") {
    return renderVenueCollection(projectId, resolved.items);
  }
  if (resolved.kind === "detail") {
    return renderVenueDetail(projectId, resolved.item);
  }
  if (resolved.kind === "compare") {
    return renderVenueCompare(projectId, resolved.items);
  }
  return unavailableWorkspace();
}
