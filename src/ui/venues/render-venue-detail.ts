import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import {
  accessContext,
  accessDetails,
  availabilityContext,
  capacityContext,
  externalCatererContext,
  missingCriticalContext,
  nextAction,
  priceContext,
  quoteContext,
  reservationsContext,
  strengthsContext,
} from "./venue-workspace-decision-presentation";
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

function fact(label: string, value: string): HTMLElement {
  return textElement("p", `${label} · ${value}`, "venue-fact");
}

function factGroup(
  title: string,
  entries: readonly [string, string][],
): HTMLElement {
  const group = document.createElement("section");
  group.className = "venue-detail-group";
  group.append(textElement("h3", title, "venue-detail-group-title"));
  for (const [label, value] of entries) group.append(fact(label, value));
  return group;
}

function decisionSummary(item: VenueWorkspaceItem): HTMLElement {
  const decision = document.createElement("div");
  decision.className = "venue-decision-summary";
  const blocking = fact("Blocage", blocker(item));
  blocking.setAttribute("data-venue-blocking-status", blocker(item));
  const weighted = fact("Score", score(item));
  weighted.setAttribute("data-venue-weighted-score", score(item));
  decision.append(
    textElement(
      "h2",
      `${item.venue.code} · ${item.venue.name}`,
      "section-title",
    ),
    fact("Ville", item.venue.city ?? "—"),
    textElement("p", syncLabel(item), "venue-sync-state"),
    blocking,
    fact("Capacité", capacityContext(item)),
    fact("Prix", priceContext(item)),
    fact("Accès", accessContext(item)),
    fact("Manquants critiques", missingCriticalContext(item)),
    fact("Avis partenaires", averageRating(item)),
    fact("Prochaine action", nextAction(item)),
    fact("Forces", strengthsContext(item)),
    fact("Réserves", reservationsContext(item)),
    weighted,
  );
  return decision;
}

function commercialGroup(item: VenueWorkspaceItem): HTMLElement {
  return factGroup("Commercial", [
    ["Prix", priceContext(item)],
    ["Devis", quoteContext(item)],
    ["Disponibilité", availabilityContext(item)],
    ["Traiteur externe", externalCatererContext(item)],
  ]);
}

function logisticsGroup(item: VenueWorkspaceItem): HTMLElement {
  const access = accessDetails(item);
  return factGroup("Logistique", [
    ["Capacité", capacityContext(item)],
    ["Accès", access.length === 0 ? "—" : access.join(" · ")],
  ]);
}

function evidenceGroup(item: VenueWorkspaceItem): HTMLElement {
  return factGroup("Éléments de preuve", [
    ["Preuves", readiness(item)],
    ["Manquants critiques", missingCriticalContext(item)],
  ]);
}

function downstreamVisit(projectId: string, venueId: string): HTMLAnchorElement {
  const visit = document.createElement("a");
  visit.textContent = "Préparer la visite";
  visit.setAttribute("href", projectVenueHref(projectId, `/${venueId}/visit`));
  visit.setAttribute("data-downstream-visit", "true");
  return visit;
}

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
  section.append(
    decisionSummary(item),
    commercialGroup(item),
    logisticsGroup(item),
    evidenceGroup(item),
    downstreamVisit(projectId, item.venue.id),
  );
  return section;
}
