import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import {
  addListener,
  projectVenueHref,
  textElement,
  venueCard,
  venueLink,
  workspaceSection,
  blocker,
  score,
  syncLabel,
  averageRating,
} from "./venue-workspace-presentation";

function collectionNavigation(
  projectId: string,
  gallery: HTMLElement,
  table: HTMLElement,
  section: HTMLElement,
): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "venue-view-switcher";
  nav.setAttribute("aria-label", "Vues des salles");

  const galleryButton = document.createElement("button");
  galleryButton.textContent = "Galerie";
  galleryButton.setAttribute("type", "button");
  galleryButton.setAttribute("data-venue-mode", "gallery");
  galleryButton.setAttribute("aria-pressed", "true");

  const tableButton = document.createElement("button");
  tableButton.textContent = "Tableau";
  tableButton.setAttribute("type", "button");
  tableButton.setAttribute("data-venue-mode", "table");
  tableButton.setAttribute("aria-pressed", "false");

  const setMode = (mode: "gallery" | "table") => {
    gallery.hidden = mode !== "gallery";
    table.hidden = mode !== "table";
    section.setAttribute("data-venue-mode", mode);
    galleryButton.setAttribute("aria-pressed", String(mode === "gallery"));
    tableButton.setAttribute("aria-pressed", String(mode === "table"));
  };
  addListener(galleryButton, "click", () => setMode("gallery"));
  addListener(tableButton, "click", () => setMode("table"));

  const compare = document.createElement("a");
  compare.textContent = "Comparer";
  compare.setAttribute("href", projectVenueHref(projectId, "/compare"));
  nav.append(galleryButton, tableButton, compare);
  return nav;
}

function galleryPanel(
  projectId: string,
  items: readonly VenueWorkspaceItem[],
): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "venue-gallery";
  panel.setAttribute("data-venue-gallery", "true");
  if (items.length === 0) {
    panel.append(
      textElement(
        "p",
        "Aucune salle disponible dans ce projet.",
        "venue-empty-state",
      ),
    );
    return panel;
  }
  for (const item of items) panel.append(venueCard(projectId, item));
  return panel;
}

function tableHeader(label: string): HTMLElement {
  return textElement("th", label, "venue-table-heading");
}

function tableRow(projectId: string, item: VenueWorkspaceItem): HTMLElement {
  const row = document.createElement("tr");
  const identity = document.createElement("td");
  identity.append(venueLink(projectId, item));
  row.append(identity);
  for (const value of [
    item.venue.status,
    blocker(item),
    score(item),
    item.venue.city ?? "—",
    syncLabel(item),
    averageRating(item),
  ]) {
    row.append(textElement("td", value, "venue-table-cell"));
  }
  return row;
}

function tablePanel(
  projectId: string,
  items: readonly VenueWorkspaceItem[],
): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "venue-table-panel";
  const table = document.createElement("table");
  table.setAttribute("data-venue-table", "true");
  const header = document.createElement("tr");
  for (const label of [
    "Code / nom",
    "Statut",
    "Blocage",
    "Score",
    "Ville",
    "Synchronisation",
    "Avis partenaires",
  ]) {
    header.append(tableHeader(label));
  }
  const head = document.createElement("thead");
  head.append(header);
  const body = document.createElement("tbody");
  for (const item of items) body.append(tableRow(projectId, item));
  table.append(head, body);

  const mobile = document.createElement("div");
  mobile.className = "venue-mobile-table-fallback";
  for (const item of items) mobile.append(venueCard(projectId, item));
  panel.append(table, mobile);
  return panel;
}

export function renderVenueCollection(
  projectId: string,
  items: readonly VenueWorkspaceItem[],
): HTMLElement {
  const section = workspaceSection("gallery");
  section.setAttribute("data-venue-mode", "gallery");
  const gallery = galleryPanel(projectId, items);
  const table = tablePanel(projectId, items);
  table.hidden = true;
  section.append(
    collectionNavigation(projectId, gallery, table, section),
    gallery,
    table,
  );
  return section;
}
