import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import {
  projectVenueHref,
  syncLabel,
  textElement,
  workspaceSection,
} from "./venue-workspace-presentation";

export function renderVenueVisit(
  projectId: string,
  item: VenueWorkspaceItem | null,
): HTMLElement {
  const section = workspaceSection("visit");
  const back = document.createElement("a");
  back.textContent = "Retour à la salle";

  if (item === null) {
    back.setAttribute("href", projectVenueHref(projectId));
    section.append(
      back,
      textElement(
        "p",
        "Cette salle n’est pas disponible avec le contexte actuel.",
        "venue-empty-state",
      ),
    );
    return section;
  }

  back.setAttribute("href", projectVenueHref(projectId, `/${item.venue.id}`));
  section.setAttribute("data-venue-id", item.venue.id);
  section.append(
    back,
    textElement(
      "h2",
      `Visite · ${item.venue.code} · ${item.venue.name}`,
      "section-title",
    ),
    textElement("p", syncLabel(item), "venue-sync-state"),
    textElement(
      "p",
      "La préparation hors ligne de la visite n’est pas encore disponible sur cet appareil.",
      "venue-visit-offline-state",
    ),
  );
  return section;
}
