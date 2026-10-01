import type {
  VenueWorkspaceItem,
  VenueWorkspaceCompatibilitySummary,
} from "@application/venues/venue-workspace-read-service";
import type { VenueWorkspaceState } from "@application/venues/venue-workspace-state";
import { parseVenueWorkspaceRoute } from "@application/venues/venue-workspace-route";

type CollectionMode = "gallery" | "table";
type CompareGroup = "objective" | "personal";

interface CompareRow {
  readonly group: CompareGroup;
  readonly label: string;
  readonly values: readonly string[];
}

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

function workspaceSection(kind: string): HTMLElement {
  const section = document.createElement("section");
  section.className = "venue-workspace";
  section.setAttribute("data-venue-workspace", kind);
  return section;
}

function blockingLabel(
  compatibility: VenueWorkspaceCompatibilitySummary | null,
): string {
  const status = compatibility?.blockingStatus ?? "UNKNOWN";
  const labels = {
    PASS: "Aucun blocage connu",
    UNKNOWN: "Blocage à confirmer",
    CONFLICT: "Informations en conflit",
    FAIL: "Bloquant",
  } as const;
  return labels[status];
}

function percent(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "À confirmer"
    : `${Math.round(value * 100)} %`;
}

function syncLabel(item: VenueWorkspaceItem): string {
  const labels = {
    synced: "Synchronisé",
    pending: "Modification en attente",
    conflict: "Conflit local",
    unknown: "État de sync inconnu",
  } as const;
  return labels[item.syncState];
}

function opinionLabel(item: VenueWorkspaceItem): string {
  const favorite = item.opinions.ownPreference?.favorite === true;
  const ratings = item.opinions.ratings.map(
    (rating) => `${rating.dimensionKey}: ${rating.rating}/10`,
  );
  const favoriteLabel = favorite ? "Favori personnel" : "Non marqué favori";
  return ratings.length === 0
    ? `${favoriteLabel} · aucune note`
    : `${favoriteLabel} · ${ratings.join(" · ")}`;
}

function venueIdentity(item: VenueWorkspaceItem): string {
  return `${item.venue.code} · ${item.venue.name}`;
}

function venueLocation(item: VenueWorkspaceItem): string {
  return item.venue.city ?? "Ville à confirmer";
}

function appendDecisionMetrics(
  parent: HTMLElement,
  item: VenueWorkspaceItem,
): void {
  const blocking = textElement(
    "p",
    blockingLabel(item.compatibility),
    "venue-blocking-status",
  );
  blocking.setAttribute("data-venue-blocking-status", "true");
  const score = textElement(
    "p",
    `Score pondéré · ${percent(item.compatibility?.weightedScore)}`,
    "venue-weighted-score",
  );
  score.setAttribute("data-venue-weighted-score", "true");
  const readiness = textElement(
    "p",
    `Preuves prêtes · ${percent(item.compatibility?.evidenceReadiness)}`,
    "venue-readiness",
  );
  const gaps =
    item.compatibility === null
      ? "Critères à vérifier"
      : `${item.compatibility.unknownImportantCriteria} importants à confirmer · ${item.compatibility.conflictingCriteria} conflits`;
  parent.append(blocking, score, readiness, textElement("p", gaps, "venue-gaps"));
}

function venueCard(projectId: string, item: VenueWorkspaceItem): HTMLElement {
  const card = document.createElement("article");
  card.className = "venue-card";
  card.setAttribute("data-venue-card", item.venue.id);

  const title = document.createElement("a");
  title.textContent = venueIdentity(item);
  title.setAttribute("href", projectVenueHref(projectId, `/${item.venue.id}`));
  title.className = "venue-card-title";

  card.append(
    title,
    textElement("p", venueLocation(item), "venue-card-location"),
    textElement("p", `Statut · ${item.venue.status}`, "venue-card-status"),
    textElement("p", syncLabel(item), "venue-card-sync"),
  );
  appendDecisionMetrics(card, item);
  card.append(textElement("p", opinionLabel(item), "venue-opinions"));
  return card;
}

function tableCell(text: string): HTMLElement {
  return textElement("td", text, "venue-table-cell");
}

function venueTable(items: readonly VenueWorkspaceItem[]): HTMLElement {
  const table = document.createElement("table");
  table.className = "venue-table";
  table.setAttribute("data-venue-table", "true");
  const head = document.createElement("thead");
  const heading = document.createElement("tr");
  for (const label of [
    "Salle",
    "Statut",
    "Ville",
    "Bloqueur",
    "Score",
    "Preuves",
    "Sync",
    "Avis",
  ]) {
    heading.append(textElement("th", label, "venue-table-heading"));
  }
  head.append(heading);

  const body = document.createElement("tbody");
  for (const item of items) {
    const row = document.createElement("tr");
    row.append(
      tableCell(venueIdentity(item)),
      tableCell(item.venue.status),
      tableCell(venueLocation(item)),
      tableCell(blockingLabel(item.compatibility)),
      tableCell(percent(item.compatibility?.weightedScore)),
      tableCell(percent(item.compatibility?.evidenceReadiness)),
      tableCell(syncLabel(item)),
      tableCell(opinionLabel(item)),
    );
    body.append(row);
  }
  table.append(head, body);
  return table;
}

function modeButton(label: string, mode: CollectionMode): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.setAttribute("data-venue-mode-target", mode);
  return button;
}

function collectionWorkspace(
  projectId: string,
  items: readonly VenueWorkspaceItem[],
): HTMLElement {
  const section = workspaceSection("gallery");
  const nav = document.createElement("nav");
  nav.className = "venue-view-switcher";
  nav.setAttribute("aria-label", "Vues des salles");
  const galleryButton = modeButton("Galerie", "gallery");
  const tableButton = modeButton("Tableau", "table");
  const compare = document.createElement("a");
  compare.textContent = "Comparer";
  compare.setAttribute("href", projectVenueHref(projectId, "/compare"));
  nav.append(galleryButton, tableButton, compare);

  const gallery = document.createElement("div");
  gallery.className = "venue-gallery";
  gallery.setAttribute("data-venue-gallery", "true");
  for (const item of items) gallery.append(venueCard(projectId, item));
  if (items.length === 0) {
    gallery.append(
      textElement("p", "Aucune salle disponible.", "venue-empty-state"),
    );
  }

  const table = document.createElement("div");
  table.className = "venue-table-wrap";
  table.append(venueTable(items));

  const activate = (mode: CollectionMode): void => {
    const tableActive = mode === "table";
    gallery.hidden = tableActive;
    table.hidden = !tableActive;
    galleryButton.setAttribute("aria-pressed", String(!tableActive));
    tableButton.setAttribute("aria-pressed", String(tableActive));
    section.setAttribute("data-venue-mode", mode);
  };
  galleryButton.addEventListener("click", () => activate("gallery"));
  tableButton.addEventListener("click", () => activate("table"));
  activate("gallery");
  section.append(nav, gallery, table);
  return section;
}

function detailWorkspace(
  projectId: string,
  item: VenueWorkspaceItem,
): HTMLElement {
  const section = workspaceSection("detail");
  section.setAttribute("data-venue-id", item.venue.id);
  const back = document.createElement("a");
  back.textContent = "Retour aux salles";
  back.setAttribute("href", projectVenueHref(projectId));

  const header = document.createElement("div");
  header.className = "venue-detail-summary";
  header.append(
    textElement("h2", venueIdentity(item), "venue-detail-title"),
    textElement("p", venueLocation(item), "venue-detail-location"),
    textElement("p", `Statut · ${item.venue.status}`, "venue-detail-status"),
    textElement("p", syncLabel(item), "venue-detail-sync"),
  );
  appendDecisionMetrics(header, item);
  header.append(textElement("p", opinionLabel(item), "venue-opinions"));

  const visit = document.createElement("a");
  visit.textContent = "Préparer la visite";
  visit.setAttribute("href", projectVenueHref(projectId, `/${item.venue.id}/visit`));
  visit.setAttribute("data-downstream-visit", "true");
  section.append(back, header, visit);
  return section;
}

function compareValueRows(items: readonly VenueWorkspaceItem[]): readonly CompareRow[] {
  const values = (select: (item: VenueWorkspaceItem) => string): readonly string[] =>
    items.map(select);
  return [
    { group: "objective", label: "Bloqueur", values: values((item) => blockingLabel(item.compatibility)) },
    { group: "objective", label: "Statut", values: values((item) => item.venue.status) },
    { group: "objective", label: "Ville", values: values(venueLocation) },
    { group: "objective", label: "Score", values: values((item) => percent(item.compatibility?.weightedScore)) },
    { group: "objective", label: "Preuves", values: values((item) => percent(item.compatibility?.evidenceReadiness)) },
    { group: "objective", label: "Sync", values: values(syncLabel) },
    { group: "personal", label: "Avis", values: values(opinionLabel) },
  ];
}

function valuesDiffer(values: readonly string[]): boolean {
  return new Set(values).size > 1;
}

function compareGrid(
  items: readonly VenueWorkspaceItem[],
  onlyDifferences: boolean,
): HTMLElement {
  const table = document.createElement("table");
  table.className = "venue-compare-grid";
  table.setAttribute("data-venue-compare-grid", "true");
  const head = document.createElement("thead");
  const heading = document.createElement("tr");
  heading.append(textElement("th", "Critère", "venue-table-heading"));
  for (const item of items) {
    heading.append(textElement("th", item.venue.name, "venue-table-heading"));
  }
  head.append(heading);

  const body = document.createElement("tbody");
  for (const row of compareValueRows(items)) {
    if (onlyDifferences && !valuesDiffer(row.values)) continue;
    const element = document.createElement("tr");
    element.setAttribute("data-compare-group", row.group);
    element.append(tableCell(row.label), ...row.values.map(tableCell));
    body.append(element);
  }
  table.append(head, body);
  return table;
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
  controls.append(
    textElement(
      "p",
      "Choisissez entre deux et cinq salles. Les bloqueurs restent prioritaires au score.",
      "venue-compare-guidance",
    ),
  );

  const selected = new Set(items.slice(0, 2).map((item) => item.venue.id));
  const gridHost = document.createElement("div");
  const differencesLabel = document.createElement("label");
  const differences = document.createElement("input");
  differences.type = "checkbox";
  differences.setAttribute("data-only-differences", "true");
  differencesLabel.append(
    differences,
    textElement("span", "Seulement les différences", "venue-control-label"),
  );
  controls.append(differencesLabel);

  const renderGrid = (): void => {
    const compared = items.filter((item) => selected.has(item.venue.id));
    gridHost.replaceChildren();
    if (compared.length < 2) {
      gridHost.append(
        textElement(
          "p",
          "Sélectionnez au moins deux salles.",
          "venue-empty-state",
        ),
      );
      return;
    }
    gridHost.append(compareGrid(compared, differences.checked));
  };

  for (const item of items) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = selected.has(item.venue.id);
    input.setAttribute("data-compare-venue", item.venue.id);
    input.addEventListener("change", () => {
      if (input.checked && selected.size >= 5) {
        input.checked = false;
      } else if (input.checked) {
        selected.add(item.venue.id);
      } else {
        selected.delete(item.venue.id);
      }
      renderGrid();
    });
    label.append(input, textElement("span", venueIdentity(item), "venue-control-label"));
    controls.append(label);
  }
  differences.addEventListener("change", renderGrid);
  renderGrid();
  section.append(back, controls, gridHost);
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

export function createVenueWorkspace(
  projectId: string,
  projectPath: string,
  state: VenueWorkspaceState,
): HTMLElement {
  const route = parseVenueWorkspaceRoute(projectPath);
  if (route.kind === "gallery" && state.kind === "collection") {
    return collectionWorkspace(projectId, state.items);
  }
  if (
    route.kind === "detail" &&
    state.kind === "detail" &&
    state.item.venue.id === route.venueId
  ) {
    return detailWorkspace(projectId, state.item);
  }
  if (route.kind === "compare" && state.kind === "compare") {
    return compareWorkspace(projectId, state.items);
  }
  return unavailableWorkspace();
}
