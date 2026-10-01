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

function collectionNavigation(projectId: string): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "venue-view-switcher";
  nav.setAttribute("aria-label", "Vues des salles");

  const gallery = document.createElement("a");
  gallery.textContent = "Galerie";
  gallery.setAttribute("href", projectVenueHref(projectId));
  gallery.setAttribute("aria-current", "page");
  gallery.setAttribute("data-venue-mode", "gallery");

  const table = document.createElement("button");
  table.textContent = "Tableau";
  table.setAttribute("type", "button");
  table.setAttribute("data-venue-mode-target", "table");
  table.setAttribute("aria-disabled", "true");

  const compare = document.createElement("a");
  compare.textContent = "Comparer";
  compare.setAttribute("href", projectVenueHref(projectId, "/compare"));

  nav.append(gallery, table, compare);
  return nav;
}

function galleryWorkspace(projectId: string): HTMLElement {
  const section = workspaceSection("gallery");
  section.setAttribute("data-venue-mode", "gallery");
  section.append(
    collectionNavigation(projectId),
    textElement(
      "p",
      "Les salles autorisées de ce projet apparaîtront ici dès que le read model sera chargé.",
      "venue-empty-state",
    ),
  );
  return section;
}

function detailWorkspace(projectId: string, venueId: string): HTMLElement {
  const section = workspaceSection("detail");
  section.setAttribute("data-venue-id", venueId);
  const back = document.createElement("a");
  back.textContent = "Retour aux salles";
  back.setAttribute("href", projectVenueHref(projectId));
  const visit = document.createElement("a");
  visit.textContent = "Préparer la visite";
  visit.setAttribute("href", projectVenueHref(projectId, `/${venueId}/visit`));
  visit.setAttribute("data-downstream-visit", "true");
  section.append(
    back,
    textElement(
      "p",
      "Le résumé de cette salle sera chargé depuis les services de lecture du projet.",
      "venue-empty-state",
    ),
    visit,
  );
  return section;
}

function compareWorkspace(projectId: string): HTMLElement {
  const section = workspaceSection("compare");
  const back = document.createElement("a");
  back.textContent = "Retour à la galerie";
  back.setAttribute("href", projectVenueHref(projectId));
  section.append(
    back,
    textElement(
      "p",
      "Sélectionnez entre deux et cinq salles du même projet pour les comparer.",
      "venue-empty-state",
    ),
  );
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
): HTMLElement {
  const route = parseVenueWorkspaceRoute(projectPath);
  if (route.kind === "gallery") return galleryWorkspace(projectId);
  if (route.kind === "detail") {
    return detailWorkspace(projectId, route.venueId);
  }
  if (route.kind === "compare") return compareWorkspace(projectId);
  return unavailableWorkspace();
}
