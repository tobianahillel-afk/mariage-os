import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import type { VenueWorkspaceRoute } from "@application/venues/venue-workspace-route";
import {
  capacityContext,
  missingCriticalContext,
  priceContext,
} from "./venue-workspace-decision-presentation";

export function textElement(
  tag: string,
  text: string,
  className: string,
): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

export function projectVenueHref(projectId: string, suffix = ""): string {
  return `/app/p/${projectId}/venues${suffix}`;
}

export function workspaceSection(
  kind: VenueWorkspaceRoute["kind"],
): HTMLElement {
  const section = document.createElement("section");
  section.className = "venue-workspace";
  section.setAttribute("data-venue-workspace", kind);
  return section;
}

export function averageRating(item: VenueWorkspaceItem): string {
  const values = item.opinions.ratings.map((rating) => rating.rating);
  if (values.length === 0) return "—";
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1);
}

export function score(item: VenueWorkspaceItem): string {
  const value = item.compatibility?.weightedScore;
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

export function readiness(item: VenueWorkspaceItem): string {
  const value = item.compatibility?.evidenceReadiness;
  return value === null || value === undefined
    ? "—"
    : `${Math.round(value * 100)} %`;
}

export function blocker(item: VenueWorkspaceItem): string {
  return item.compatibility?.blockingStatus ?? "UNKNOWN";
}

export function syncLabel(item: VenueWorkspaceItem): string {
  const labels = {
    synced: "Synchronisé",
    pending: "Modification en attente",
    conflict: "Conflit local",
    unknown: "État local inconnu",
  } as const;
  return labels[item.syncState];
}

export function venueLink(
  projectId: string,
  item: VenueWorkspaceItem,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.textContent = `${item.venue.code} · ${item.venue.name}`;
  link.setAttribute("href", projectVenueHref(projectId, `/${item.venue.id}`));
  return link;
}

export function venueCard(
  projectId: string,
  item: VenueWorkspaceItem,
): HTMLElement {
  const card = document.createElement("article");
  card.className = "venue-card";
  card.setAttribute("data-venue-card", item.venue.id);
  card.append(
    venueLink(projectId, item),
    textElement("p", `Statut · ${item.venue.status}`, "venue-fact"),
    textElement("p", `Ville · ${item.venue.city ?? "—"}`, "venue-fact"),
    textElement("p", `Blocage · ${blocker(item)}`, "venue-fact"),
    textElement("p", `Capacité · ${capacityContext(item)}`, "venue-fact"),
    textElement("p", `Prix · ${priceContext(item)}`, "venue-fact"),
    textElement(
      "p",
      `Manquants critiques · ${missingCriticalContext(item)}`,
      "venue-fact",
    ),
    textElement("p", `Avis partenaires · ${averageRating(item)}`, "venue-fact"),
    textElement("p", syncLabel(item), "venue-sync-state"),
  );
  return card;
}

export function addListener(
  element: HTMLElement,
  type: string,
  listener: EventListener,
): void {
  if (typeof element.addEventListener === "function") {
    element.addEventListener(type, listener);
  }
}
