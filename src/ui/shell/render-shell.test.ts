import { afterEach, expect, it, vi } from "vitest";
import type { SyncSummary } from "@application/local-data/sync-summary";
import { renderShell, type ProjectShellState } from "./render-shell";

class FakeElement {
  readonly tagName: string;
  textContent: string | null = null;
  className = "";
  readonly attributes = new Map<string, string>();
  children: FakeElement[] = [];

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  append(...children: FakeElement[]): void {
    this.children.push(...children);
  }

  replaceChildren(...children: FakeElement[]): void {
    this.children = children;
  }
}

interface FakeDocument {
  title: string;
  createElement(tagName: string): FakeElement;
}

function installDocument(): FakeDocument {
  const fakeDocument: FakeDocument = {
    title: "",
    createElement: (tagName: string) => new FakeElement(tagName),
  };
  vi.stubGlobal("document", fakeDocument);
  return fakeDocument;
}

function descendants(element: FakeElement): FakeElement[] {
  return [element, ...element.children.flatMap(descendants)];
}

function texts(element: FakeElement): string[] {
  return descendants(element)
    .map((child) => child.textContent)
    .filter((text): text is string => text !== null);
}

function byAttribute(
  element: FakeElement,
  name: string,
  value: string,
): FakeElement[] {
  return descendants(element).filter(
    (child) => child.getAttribute(name) === value,
  );
}

const projectId = "81111111-1111-4111-8111-111111111111";
const userId = "71111111-1111-4111-8111-111111111111";
const synced: SyncSummary = { kind: "synced", label: "En ligne · synchronisé" };

function projectState(
  projectPath: string,
  syncSummary: SyncSummary = synced,
): ProjectShellState {
  return {
    kind: "project_allowed",
    userId,
    projectId,
    projectPath,
    syncSummary,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("renders project navigation with explicit project context, sync status and RSVP settings", () => {
  const fakeDocument = installDocument();
  const root = new FakeElement("div");

  renderShell(root as unknown as HTMLElement, projectState("/settings"));

  expect(fakeDocument.title).toBe("Réglages · Mariage OS");
  expect(byAttribute(root, "data-shell", "private-project")).toHaveLength(1);
  expect(byAttribute(root, "data-rsvp-intent-hook", "true")).toHaveLength(1);
  expect(byAttribute(root, "role", "status")).toHaveLength(1);
  expect(byAttribute(root, "data-sync-state", "synced")).toHaveLength(1);
  expect(texts(root)).toContain("En ligne · synchronisé");
  expect(texts(root)).toContain("Je déciderai plus tard");
  const hrefs = descendants(root)
    .map((child) => child.getAttribute("href"))
    .filter((href): href is string => href !== null);
  expect(hrefs.length).toBeGreaterThan(10);
  expect(hrefs.every((href) => href.startsWith(`/app/p/${projectId}/`))).toBe(
    true,
  );
  expect(byAttribute(root, "aria-current", "page").length).toBeGreaterThan(0);
});

it("renders degraded local durability as text, not project data", () => {
  installDocument();
  const root = new FakeElement("div");

  renderShell(
    root as unknown as HTMLElement,
    projectState("/dashboard", {
      kind: "durability_unavailable",
      label: "Stockage local indisponible · mode dégradé",
    }),
  );

  expect(byAttribute(root, "data-sync-state", "durability_unavailable")).toHaveLength(
    1,
  );
  expect(texts(root)).toContain("Stockage local indisponible · mode dégradé");
});

it("uses safe project title fallbacks without changing tenant context", () => {
  const fakeDocument = installDocument();
  const root = new FakeElement("div");

  renderShell(root as unknown as HTMLElement, projectState(""));
  expect(fakeDocument.title).toBe("Tableau de bord · Mariage OS");

  renderShell(root as unknown as HTMLElement, projectState("/future-module"));
  expect(fakeDocument.title).toBe("Espace projet · Mariage OS");
  expect(byAttribute(root, "data-rsvp-intent-hook", "true")).toHaveLength(0);
});

it("renders a local encoded login return path without protected content", () => {
  installDocument();
  const root = new FakeElement("div");
  const returnTo = `/app/p/${projectId}/venues/example`;

  renderShell(root as unknown as HTMLElement, {
    kind: "login_required",
    returnTo,
  });

  expect(byAttribute(root, "data-shell", "login-required")).toHaveLength(1);
  expect(byAttribute(root, "data-shell", "private-project")).toHaveLength(0);
  expect(
    byAttribute(
      root,
      "href",
      `/login?returnTo=${encodeURIComponent(returnTo)}`,
    ),
  ).toHaveLength(1);
});

it("keeps the public RSVP shell separate from private navigation and sync state", () => {
  const fakeDocument = installDocument();
  const root = new FakeElement("div");

  renderShell(root as unknown as HTMLElement, { kind: "public_rsvp" });

  expect(fakeDocument.title).toBe("Invitation & RSVP · Mariage OS");
  expect(byAttribute(root, "data-shell", "public-rsvp")).toHaveLength(1);
  expect(byAttribute(root, "aria-label", "Navigation du projet")).toHaveLength(
    0,
  );
  expect(byAttribute(root, "role", "status")).toHaveLength(0);
});

it("shows the nontechnical RSVP intent hook during onboarding", () => {
  installDocument();
  const root = new FakeElement("div");

  renderShell(root as unknown as HTMLElement, { kind: "onboarding" });

  expect(byAttribute(root, "data-rsvp-intent-hook", "true")).toHaveLength(1);
  expect(texts(root)).toContain("Utiliser les liens RSVP Mariage OS");
  expect(texts(root)).toContain("Je gérerai les réponses manuellement");
});

it("offers a generic home recovery action without exposing project context", () => {
  installDocument();
  const root = new FakeElement("div");

  renderShell(root as unknown as HTMLElement, { kind: "project_unavailable" });

  expect(byAttribute(root, "href", "/")).toHaveLength(1);
  expect(texts(root)).toContain("Retour à l’accueil");
  expect(texts(root).join(" ")).not.toContain(projectId);
});

it.each([
  ["landing", "landing", "Mariage OS · Mariage OS"],
  ["login", "login", "Connexion · Mariage OS"],
  ["invite", "invite", "Invitation au projet · Mariage OS"],
  [
    "verification_required",
    "verification-required",
    "Vérification requise · Mariage OS",
  ],
  [
    "project_unavailable",
    "project-unavailable",
    "Projet indisponible · Mariage OS",
  ],
  ["not_found", "not-found", "Page indisponible · Mariage OS"],
] as const)("renders static state %s safely", (kind, shellKind, title) => {
  const fakeDocument = installDocument();
  const root = new FakeElement("div");

  renderShell(root as unknown as HTMLElement, { kind });

  expect(fakeDocument.title).toBe(title);
  expect(byAttribute(root, "data-shell", shellKind)).toHaveLength(1);
  vi.unstubAllGlobals();
});
