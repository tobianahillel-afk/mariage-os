import type { SyncSummary } from "@application/local-data/sync-summary";
import type { AppRoute } from "@application/routing/app-route";
import type { ProtectedRouteDecision } from "@application/routing/protected-route-guard";

type ProjectAllowedDecision = Extract<
  ProtectedRouteDecision,
  { kind: "project_allowed" }
>;

export type ProjectShellState = ProjectAllowedDecision & {
  readonly syncSummary: SyncSummary;
};

type ShellState =
  | Exclude<AppRoute, { kind: "protected_project" }>
  | Exclude<ProtectedRouteDecision, { kind: "project_allowed" }>
  | ProjectShellState;

type StaticShellKind = Exclude<
  ShellState["kind"],
  | "project_allowed"
  | "login_required"
  | "session_expired"
  | "public_rsvp"
  | "onboarding"
>;

interface NavigationItem {
  readonly label: string;
  readonly path: string;
}

interface StaticShellCopy {
  readonly title: string;
  readonly message: string;
  readonly shellKind: string;
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
  { label: "Chronologie", path: "timeline" },
  { label: "Carte", path: "map" },
  { label: "Documents", path: "documents" },
  { label: "Boîte de réception", path: "inbox" },
  { label: "Import / Export", path: "import" },
  { label: "Réglages", path: "settings" },
];

const mobilePrimaryNavigation: readonly NavigationItem[] = [
  { label: "Accueil", path: "dashboard" },
  { label: "Salles", path: "venues" },
  { label: "Tâches", path: "tasks" },
  { label: "Budget", path: "budget" },
];

const mobileMoreNavigation: readonly NavigationItem[] = [
  { label: "Prestataires", path: "vendors" },
  { label: "Invités", path: "guests" },
  { label: "Plan de table", path: "seating" },
  { label: "Décisions", path: "decisions" },
  { label: "Planning", path: "planning" },
  { label: "Chronologie", path: "timeline" },
  { label: "Carte", path: "map" },
  { label: "Documents", path: "documents" },
  { label: "Boîte de réception", path: "inbox" },
  { label: "Import / Export", path: "import" },
  { label: "Réglages", path: "settings" },
];

const screenTitles: Readonly<Record<string, string>> = {
  dashboard: "Tableau de bord",
  search: "Recherche",
  inbox: "Boîte de réception",
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
  import: "Import",
  export: "Export",
  backup: "Sauvegarde",
  settings: "Réglages",
  diagnostics: "Diagnostics",
};

const staticShellCopy: Readonly<Record<StaticShellKind, StaticShellCopy>> = {
  landing: {
    title: "Mariage OS",
    message: "Votre espace privé pour préparer le mariage ensemble.",
    shellKind: "landing",
  },
  login: {
    title: "Connexion",
    message: "Connectez-vous avec votre identité vérifiée.",
    shellKind: "login",
  },
  invite: {
    title: "Invitation au projet",
    message: "Vérifiez votre identité pour traiter cette invitation.",
    shellKind: "invite",
  },
  verification_required: {
    title: "Vérification requise",
    message: "Vérifiez votre adresse e-mail avant d’accéder au projet.",
    shellKind: "verification-required",
  },
  project_unavailable: {
    title: "Projet indisponible",
    message: "Ce projet n’est pas disponible avec votre accès actuel.",
    shellKind: "project-unavailable",
  },
  not_found: {
    title: "Page indisponible",
    message: "Cette page n’est pas disponible.",
    shellKind: "not-found",
  },
};

function createTextElement(
  tag: string,
  text: string,
  className: string,
): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

function projectHref(projectId: string, path: string): string {
  return `/app/p/${projectId}/${path}`;
}

function currentSection(projectPath: string): string {
  const section = projectPath.split("/").filter(Boolean)[0];
  return section === undefined ? "dashboard" : section;
}

function createNavigationLink(
  projectId: string,
  activeSection: string,
  item: NavigationItem,
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.textContent = item.label;
  link.setAttribute("href", projectHref(projectId, item.path));
  if (item.path === activeSection) {
    link.setAttribute("aria-current", "page");
  }
  return link;
}

function createDesktopNav(projectId: string, projectPath: string): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "desktop-nav";
  nav.setAttribute("aria-label", "Navigation du projet");
  const activeSection = currentSection(projectPath);

  for (const item of desktopNavigation) {
    nav.append(createNavigationLink(projectId, activeSection, item));
  }
  return nav;
}

function createMobileNav(projectId: string, projectPath: string): HTMLElement {
  const nav = document.createElement("nav");
  nav.className = "mobile-nav";
  nav.setAttribute("aria-label", "Navigation mobile du projet");
  const activeSection = currentSection(projectPath);

  for (const item of mobilePrimaryNavigation) {
    nav.append(createNavigationLink(projectId, activeSection, item));
  }

  const more = document.createElement("details");
  more.className = "mobile-more";
  const summary = document.createElement("summary");
  summary.textContent = "Plus";
  const menu = document.createElement("div");
  menu.className = "mobile-more-menu";
  for (const item of mobileMoreNavigation) {
    menu.append(createNavigationLink(projectId, activeSection, item));
  }
  more.append(summary, menu);
  nav.append(more);
  return nav;
}

function createRsvpIntentHook(): HTMLElement {
  const section = document.createElement("section");
  section.className = "settings-hook";
  section.setAttribute("data-rsvp-intent-hook", "true");
  section.append(
    createTextElement("h2", "Invitations & RSVP", "section-title"),
    createTextElement(
      "p",
      "Choisissez simplement comment vous souhaitez gérer les réponses. Rien n’est envoyé depuis cette étape.",
      "section-copy",
    ),
  );

  const options = document.createElement("ul");
  options.className = "intent-options";
  for (const text of [
    "Utiliser les liens RSVP Mariage OS",
    "Je gérerai les réponses manuellement",
    "Je déciderai plus tard",
  ]) {
    options.append(createTextElement("li", text, "intent-option"));
  }
  section.append(options);
  return section;
}

function createSyncStatus(summary: SyncSummary): HTMLElement {
  const status = createTextElement("p", summary.label, "sync-status");
  status.setAttribute("role", "status");
  status.setAttribute("data-sync-state", summary.kind);
  return status;
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
    createTextElement("h1", title, "page-title"),
    createTextElement("p", message, "lede"),
  );
  root.replaceChildren(shell);
  return shell;
}

function renderProjectShell(root: HTMLElement, state: ProjectShellState): void {
  const section = currentSection(state.projectPath);
  const title = screenTitles[section] ?? "Espace projet";
  document.title = `${title} · Mariage OS`;

  const shell = document.createElement("div");
  shell.className = "project-shell";
  shell.setAttribute("data-shell", "private-project");
  const content = document.createElement("main");
  content.className = "project-content";
  content.append(
    createTextElement("p", "Mariage OS", "eyebrow"),
    createSyncStatus(state.syncSummary),
    createTextElement("h1", title, "page-title"),
    createTextElement(
      "p",
      "Le shell sécurisé est prêt. Les données métier de cette section arriveront dans leur lot dédié.",
      "lede",
    ),
  );
  if (section === "settings") {
    content.append(createRsvpIntentHook());
  }
  shell.append(
    createDesktopNav(state.projectId, state.projectPath),
    content,
    createMobileNav(state.projectId, state.projectPath),
  );
  root.replaceChildren(shell);
}

function renderOnboardingShell(root: HTMLElement): void {
  const shell = renderMessageShell(
    root,
    "Configuration",
    "Préparez les réglages essentiels de votre projet, puis complétez le reste plus tard.",
    "onboarding",
  );
  shell.append(createRsvpIntentHook());
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

function renderSessionExpired(
  root: HTMLElement,
  state: Extract<ShellState, { kind: "session_expired" }>,
): void {
  const shell = renderMessageShell(
    root,
    "Session expirée",
    "Votre travail local reste conservé sur cet appareil. La synchronisation est suspendue jusqu’à votre reconnexion.",
    "session-expired",
  );
  const link = document.createElement("a");
  link.textContent = "Se reconnecter";
  link.setAttribute(
    "href",
    `/login?returnTo=${encodeURIComponent(state.returnTo)}`,
  );
  shell.append(link);
}

function renderStaticShell(root: HTMLElement, kind: StaticShellKind): void {
  const copy = staticShellCopy[kind];
  const shell = renderMessageShell(
    root,
    copy.title,
    copy.message,
    copy.shellKind,
  );
  if (kind === "project_unavailable") {
    const link = document.createElement("a");
    link.textContent = "Retour à l’accueil";
    link.setAttribute("href", "/");
    shell.append(link);
  }
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
  if (state.kind === "session_expired") {
    renderSessionExpired(root, state);
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
  if (state.kind === "onboarding") {
    renderOnboardingShell(root);
    return;
  }
  renderStaticShell(root, state.kind);
}
