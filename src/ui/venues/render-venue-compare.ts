import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import {
  accessContext,
  availabilityContext,
  capacityContext,
  externalCatererContext,
  missingCriticalContext,
  priceContext,
  quoteContext,
} from "./venue-workspace-decision-presentation";
import {
  addListener,
  averageRating,
  blocker,
  projectVenueHref,
  readiness,
  score,
  textElement,
  venueLink,
  workspaceSection,
} from "./venue-workspace-presentation";

interface CompareRow {
  readonly label: string;
  readonly value: (item: VenueWorkspaceItem) => string;
}

const compareRows: readonly CompareRow[] = [
  { label: "Blocage", value: blocker },
  { label: "Capacité", value: capacityContext },
  { label: "Montant de base", value: priceContext },
  { label: "Accès", value: accessContext },
  { label: "Disponibilité", value: availabilityContext },
  { label: "Traiteur externe", value: externalCatererContext },
  { label: "Devis", value: quoteContext },
  { label: "Preuves", value: readiness },
  { label: "Manquants critiques", value: missingCriticalContext },
  { label: "Avis partenaires", value: averageRating },
  { label: "Score", value: score },
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

function appendText(label: HTMLLabelElement, text: string): void {
  if (typeof document.createTextNode === "function") {
    label.append(document.createTextNode(text));
    return;
  }
  label.append(textElement("span", text, ""));
}

function selectionLabel(
  item: VenueWorkspaceItem,
  selected: Set<string>,
  renderGrid: () => void,
): HTMLLabelElement {
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
  label.append(input);
  appendText(label, ` ${item.venue.code} · ${item.venue.name}`);
  return label;
}

export function renderVenueCompare(
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

  const renderGrid = () => {
    const chosen = items.filter((item) => selected.has(item.venue.id));
    gridHost.replaceChildren(
      compareGrid(projectId, chosen, Boolean(onlyDifferences.checked)),
    );
  };

  for (const item of items) {
    controls.append(selectionLabel(item, selected, renderGrid));
  }
  addListener(onlyDifferences, "change", renderGrid);
  const differencesLabel = document.createElement("label");
  differencesLabel.append(onlyDifferences);
  appendText(differencesLabel, " Seulement les différences");
  renderGrid();
  section.append(back, controls, differencesLabel, gridHost);
  return section;
}
