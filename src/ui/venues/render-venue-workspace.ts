import type {
  VenueWorkspaceItem,
} from "@application/venues/venue-workspace-read-service";
import type { VenueWorkspaceState } from "@application/venues/venue-workspace-state";
import {
  parseVenueWorkspaceRoute,
  type VenueWorkspaceRoute,
} from "@application/venues/venue-workspace-route";

function textElement(
  tag: string,
  text: string,
  className: string,
): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

function projectVenueHref(projectId: string, suffix = ""): string {
  return `/app/p/${projectId}/venues${suffix}`;
}

function workspaceSection(kind: VenueWorkspaceRoute["kind"]): HTMLElement {
  const section = document.createElement("section");
  section.className = "venue-workspace";
  section.setAttribute("data-venue-workspace", kind);
  return section;
}

function averageRating(item: VenueWorkspaceItem): string {
  const values = item.opinions.ratings.map((rating) => rating.rating);
  if (values.length === 0) return "—";
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average.toFixed(1);
}

function score(item: VenueWorkspaceItem): string {
  const value = item.compatibility?.weightedScore;
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

function readiness(item: VenueWorkspaceItem): string {
  const value = item.compatibility?.evidenceReadiness;
  return value === null || value === undefined
    ? "—"
    : `${Math.round(value * 100)} %`;
}

function blocker(item: VenueWorkspaceItem): string {
  return item.compatibility?.blockingStatus ?? "UNKNOWN";
}

function syncLabel(item: VenueWorkspaceItem): string {
  const labels = {
    synced: "Synchronisé",
    pending: "Modification en attente",
    conflict: "Conflit local",
    unknown: "État local inconnu",
  } as const;
  return labels[item.syncState];
}

function venueLink(projectId: string, item: VenueWorkspaceItem): HTMLAnchorElement {
  const link = document.createElement("a");
  link.textContent = `${item.venue.code} · ${item.venue.name}`;
  link.setAttribute("href", projectVenueHref(projectId, `/${item.venue.id}`));
  return link;
}

function venueCard(projectId: string, item: VenueWorkspaceItem): HTMLElement {
  const card = document.createElement("article");
  card.className = "venue-card";
  card.setAttribute("data-venue-card", item.venue.id);
  card.append(
    venueLink(projectId, item),
    textElement("p", `Statut · ${item.venue.status}`, "venue-fact"),
    textElement("p", `Ville · ${item.venue.city ?? "—"}`, "venue-fact"),
    textElement("p", `Blocage · ${blocker(item)}`, "venue-fact"),
    textElement("p", `Score · ${score(item)}`, "venue-fact"),
    textElement("p", `Preuves · ${readiness(item)}`, "venue-fact"),
    textElement("p", `Avis partenaires · ${averageRating(item)}`, "venue-fact"),
    textElement("p", syncLabel(item), "venue-sync-state"),
  );
  return card;
}

function addListener(
  element: HTMLElement,
  type: string,
  listener: EventListener,
): void {
  const candidate = element as unknown as {
    addEventListener?: (event: string, callback: EventListener) => void;
  };
  candidate.addEventListener?.(type, listener);
}

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
  for (const item of items) {
    const row = document.createElement("tr");
    const identity = document.createElement("td");
    identity.append(venueLink(projectId, item));
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
    row.prepend(identity);
    body.append(row);
  }
  table.append(head, body);

  const mobile = document.createElement("div");
  mobile.className = "venue-mobile-table-fallback";
  for (const item of items) mobile.append(venueCard(projectId, item));
  panel.append(table, mobile);
  return panel;
}

function galleryWorkspace(
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

function detailWorkspace(
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
  const blocking = textElement("p", `Blocage · ${blocker(item)}`, "venue-fact");
  blocking.setAttribute("data-venue-blocking-status", blocker(item));
  const weighted = textElement("p", `Score · ${score(item)}`, "venue-fact");
  weighted.setAttribute("data-venue-weighted-score", score(item));
  decision.append(
    textElement("h2", `${item.venue.code} · ${item.venue.name}`, "section-title"),
    textElement("p", syncLabel(item), "venue-sync-state"),
    blocking,
    weighted,
    textElement("p", `Preuves · ${readiness(item)}`, "venue-fact"),
    textElement("p", `Avis partenaires · ${averageRating(item)}`, "venue-fact"),
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

interface CompareRow {
  readonly label: string;
  readonly value: (item: VenueWorkspaceItem) => string;
}

const compareRows: readonly CompareRow[] = [
  { label: "Blocage", value: blocker },
  { label: "Score", value: score },
  { label: "Preuves", value: readiness },
  { label: "Statut", value: (item) => item.venue.status },
  { label: "Ville", value: (item) => item.venue.city ?? "—" },
  { label: "Avis partenaires", value: averageRating },
];

function onlyDifferent(
  row: CompareRow,
  items: readonly VenueWorkspaceItem[],
): boolean {
  return new Set(items.map(row.value)).size > 1;
}

function compareGrid(
  projectId: string,
  items: readonly VenueWorkspaceItem[],
  differencesOnly: boolean,
): HTMLElement {
  const grid = document.createElement("div");
  grid.className = "venue-compare-grid";
  grid.setAttribute("data-venue-compare-grid", "true");
  if (items.length < 2) {
    grid.append(
      textElement(
        "p",
        "Choisissez au moins deux salles à comparer.",
        "venue-empty-state",
      ),
    );
    return grid;
  }

  const header = document.createElement("div");
  header.className = "venue-compare-row venue-compare-header";
  header.append(textElement("strong", "Critère", "venue-compare-label"));
  for (const item of items) header.append(venueLink(projectId, item));
  grid.append(header);

  for (const row of compareRows) {
    if (differencesOnly && !onlyDifferent(row, items)) continue;
    const line = document.createElement("div");
    line.className = "venue-compare-row";
    line.append(textElement("strong", row.label, "venue-compare-label"));
    for (const item of items) {
      line.append(textElement("span", row.value(item), "venue-compare-value"));
    }
    grid.append(line);
  }
  return grid;
}

function compareWorkspace(
  projectId: string,
  items: readonly VenueWorkspaceItem[],
): HTMLElement {
  const section = workspaceSection("compare");
  const back = document.createElement("a");
  back.textContent = "Retour à la galerie";
  back.setAttribute("href", projectVenueHref(projectId));
  const controls = document.createElement("div");
  controls.className = "venue-compare-controls";
  const selected = new Set<string>();
  const gridHost = document.createElement("div");

  const onlyDifferences = document.createElement("input");
  onlyDifferences.setAttribute("type", "checkbox");
  onlyDifferences.setAttribute("data-only-differences", "true");
  const differencesLabel = document.createElement("label");
  differencesLabel.append(onlyDifferences, document.createTextNode?.(" Seulement les différences") ?? textElement("span", "Seulement les différences", ""));

  const renderGrid = () => {
    const chosen = items.filter((item) => selected.has(item.venue.id));
    gridHost.replaceChildren(
      compareGrid(projectId, chosen, Boolean(onlyDifferences.checked)),
    );
  };

  for (const item of items) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.setAttribute("type", "checkbox");
    input.setAttribute("value", item.venue.id);
    addListener(input, "change", () => {
      if (input.checked && selected.size >= 5) {
        input.checked = false;
        return;
      }
      if (input.checked) selected.add(item.venue.id);
      else selected.delete(item.venue.id);
      renderGrid();
    });
    label.append(input, document.createTextNode?.(` ${item.venue.code} · ${item.venue.name}`) ?? textElement("span", `${item.venue.code} · ${item.venue.name}`, ""));
    controls.append(label);
  }
  addListener(onlyDifferences, "change", renderGrid);
  renderGrid();
  section.append(back, controls, differencesLabel, gridHost);
  return section;
}

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
    return galleryWorkspace(projectId, resolved.items);
  }
  if (resolved.kind === "detail") {
    return detailWorkspace(projectId, resolved.item);
  }
  if (resolved.kind === "compare") {
    return compareWorkspace(projectId, resolved.items);
  }
  return unavailableWorkspace();
}
