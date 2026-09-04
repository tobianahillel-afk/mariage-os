import type { AppRoute } from "@application/routing/app-route";
import type { ProtectedRouteDecision } from "@application/routing/protected-route-guard";

type ShellState = Exclude<AppRoute, { kind: "protected_project" }> | ProtectedRouteDecision;

interface NavigationItem {
  readonly label: string;
  readonly path: string;
}

const desktopNavigation: readonly NavigationItem[] = [
  { label: "Accueil", path: "dashboard" },
  { label: "Salles", path: "venues" },
  { label: "Prestataires", path: "vendors" },
  { label: "Invités", path: "guests" },
  { label: "Plan de table", path: "seating" },
  { label: "Tâches", path: "tasks" },
  { label: "Décisions", path: "decisions" },
  { label: "Budget", path: "budget" },
  { label: "Planning", path: "planning" },
  { label: "Documents", path: "documents" },
  { label: "Réglages", path: "settings" },
];

const mobileNavigation: readonly NavigationItem[] = [
  { label: "Accueil", path: "dashboard" },
  { label: "Salles", path: "venues" },
  { label: "Tâches", path: "tasks" },
  { label: "Budget", path: "budget" },
  { label: "Plus", path: "settings" },
];

const screenTitles: Readonly<Record<string, string>> = {
  dashboard: "Tableau de bord",
  venues: "Salles",
  vendors: "Prestataires",
  guests: "Invités",
  seating: "Plan de table",
  tasks: "Tâches",
  decisions: "Décisions",
  budget: "Budget",
  planning: "Planning",
  timeline: "Chronologie",
  map: "Carte",
  documents: "Documents",
  inbox: "Boîte de réception",
  settings: "Réglages",
  diagnostics: "Diagnostics",
};

function createTextElement(tag: string, text: string, className?: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className !== undefined) {
    element.className = className;
  }
  return element;
}

function renderMessageShell(
  root: HTMLElement,
  title: string,
  message: string,
  shellKind: string,
): HTMLElement {
  document.title = `${title} · Mariage OS`;
  const shell = document.createElement("section");
  shell.className = "message-shell";
  shell.setAttribute("data-shell", shellKind);
  shell.append(
    createTextElement("p", "Mariage OS", "eyebrow"),
    createTextElement("h1", title),
    createTextElement("p", message, "lede"),
  );
  root.replaceChildren(shell);
  return shell;
}

function projectHref(projectId: string, path: string): string {
  return `/app/p/${projectId}/${path}`;
}

function currentSection(projectPath: string): string {
  return projectPath.split("/").filter(Boolean)[0] ?? "dashboard";
}

function createProjectNav(
  projectId: string,
  projectPath: string,
  items: readonly NavigationItem[],
  className: string,
  label: string,
): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = className;
  nav.setAttribute("aria-label", label);
  const activeSection = currentSection(projectPath);

  for (const item of items) {
    const link = document.createElement("a");
    link.textContent = item.label;
    link.setAttribute("href", projectHref(projectId, item.path));
    if (item.path === activeSection) {
      link.setAttribute("aria-current", "page");
    }
    nav.append(link);
  }

  return nav;
}

function createRsvpSettingsHook(): HTMLElement {
  const section = document.createElement("section");
  section.className = "settings-hook";
  section.setAttribute("data-rsvp-intent-hook", "true");
  section.append(
    createTextElement("h2", "Invitations & RSVP"),
    createTextElement(
      "p",
      "Préparez le mode de réponse maintenant, manuellement, ou décidez plus tard sans envoyer de message pendant l’onboarding.",
    ),
    createTextElement(
      "p",
      "Options prévues : lien Mariage OS, suivi manuel ou décision différée.",
      "muted",
    ),
  );
  return section;
}

function renderProjectShell(
  root: HTMLElement,
  state: Extract<ShellState, { kind: "project_allowed" }>,
): void {
  const section = currentSection(state.projectPath);
  const title = screenTitles[section] ?? "Espace projet";
  document.title = `${title} · Mariage OS`;

  const shell = document.createElement("div");
  shell.className = "project-shell";
  shell.setAttribute("data-shell", "private-project");

  const main = document.createElement("main");
  main.className = "project-content";
  main.append(
    createTextElement("p", "Mariage OS", "eyebrow"),
    createTextElement("h1", title),
    createTextElement(
      "p",
      "Le shell sécurisé est prêt. Les données métier de cette section arriveront dans leur lot dédié.",
      "lede",
    ),
  );

  if (section === "settings") {
    main.append(createRsvpSettingsHook());
  }

  shell.append(
    createProjectNav(
      state.projectId,
      state.projectPath,
      desktopNavigation,
      "desktop-nav",
      "Navigation du projet",
    ),
    main,
    createProjectNav(
      state.projectId,
      state.projectPath,
      mobileNavigation,
      "mobile-nav",
      "Navigation mobile du projet",
    ),
  );
  root.replaceChildren(shell);
}

function renderLoginRequired(
  root: HTMLElement,
  state: Extract<ShellState, { kind: "login_required" }>,
): void {
  const shell = renderMessageShell(
    root,
    "Connexion requise",
    "Connectez-vous pour continuer vers votre espace privé.",
    "login-required",
  );
  const link = document.createElement("a");
  link.textContent = "Se connecter";
  link.setAttribute(
    "href",
    `/login?returnTo=${encodeURIComponent(state.returnTo)}`,
  );
  shell.append(link);
}

export function renderShell(root: HTMLElement, state: ShellState): void {
  if (state.kind === "project_allowed") {
    renderProjectShell(root, state);
    return;
  }

  if (state.kind === "login_required") {
    renderLoginRequired(root, state);
    return;
  }

  if (state.kind === "public_rsvp") {
    renderMessageShell(
      root,
      "Invitation & RSVP",
      "Ce lien sécurisé ouvre uniquement l’espace de réponse invité.",
      "public-rsvp",
    );
    return;
  }

  const messages: Readonly<
    Record<
      Exclude<
        ShellState["kind"],
        "project_allowed" | "login_required" | "public_rsvp"
      >,
      readonly [string, string]
    >
  > = {
    landing: [
      "Mariage OS",
      "Votre espace privé pour préparer le mariage ensemble.",
    ],
    login: ["Connexion", "Connectez-vous avec votre identité vérifiée."],
    onboarding: [
      "Configuration",
      "Préparez les réglages essentiels de votre projet.",
    ],
    invite: [
      "Invitation au projet",
      "Vérifiez votre identité pour traiter cette invitation.",
    ],
    not_found: ["Page indisponible", "Cette page n’est pas disponible."],
    verification_required: [
      "Vérification requise",
      "Vérifiez votre adresse e-mail avant d’accéder au projet.",
    ],
    project_unavailable: [
      "Projet indisponible",
      "Ce projet n’est pas disponible avec votre accès actuel.",
    ],
  };
  const [title, message] = messages[state.kind];
  renderMessageShell(root, title, message, state.kind);
}
