import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import {
  averageRating,
  blocker,
  projectVenueHref,
  readiness,
  score,
  syncLabel,
  textElement,
  workspaceSection,
} from "./venue-workspace-presentation";

export function renderVenueDetail(
  projectId: string,
  item: VenueWorkspaceItem | null,
): HTMLElement {
  const section = workspaceSection("detail");
  const back = document.createElement("a");
  back.textContent = "Retour aux salles";
  back.setAttribute("href", projectVenueHref(projectId));
  section.append(back);
  if (item === null) {
    section.append(
      textElement(
        "p",
        "Cette salle n’est pas disponible avec le contexte actuel.",
        "venue-empty-state",
      ),
    );
    return section;
  }

  section.setAttribute("data-venue-id", item.venue.id);
  const decision = document.createElement("div");
  decision.className = "venue-decision-summary";
  const blocking = textElement(
    "p",
    `Blocage · ${blocker(item)}`,
    "venue-fact",
  );
  blocking.setAttribute("data-venue-blocking-status", blocker(item));
  const weighted = textElement("p", `Score · ${score(item)}`, "venue-fact");
  weighted.setAttribute("data-venue-weighted-score", score(item));
  decision.append(
    textElement(
      "h2",
      `${item.venue.code} · ${item.venue.name}`,
      "section-title",
    ),
    textElement("p", syncLabel(item), "venue-sync-state"),
    blocking,
    weighted,
    textElement("p", `Preuves · ${readiness(item)}`, "venue-fact"),
    textElement(
      "p",
      `Avis partenaires · ${averageRating(item)}`,
      "venue-fact",
    ),
    textElement("p", `Ville · ${item.venue.city ?? "—"}`, "venue-fact"),
  );

  const visit = document.createElement("a");
  visit.textContent = "Préparer la visite";
  visit.setAttribute(
    "href",
    projectVenueHref(projectId, `/${item.venue.id}/visit`),
  );
  visit.setAttribute("data-downstream-visit", "true");
  section.append(decision, visit);
  return section;
}
