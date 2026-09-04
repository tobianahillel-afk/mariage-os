import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderShell } from "./render-shell";

class FakeElement {
  readonly tagName: string;
  textContent: string | null = null;
  className = "";
  children: FakeElement[] = [];
  readonly attributes = new Map<string, string>();

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  append(...children: FakeElement[]): void {
    this.children.push(...children);
  }

  replaceChildren(...children: FakeElement[]): void {
    this.children = children;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
}

class FakeDocument {
  title = "";

  constructor(readonly root: FakeElement) {}

  querySelector(): FakeElement {
    return this.root;
  }

  createElement(tagName: string): FakeElement {
    return new FakeElement(tagName);
  }
}

function flatten(element: FakeElement): FakeElement[] {
  return [element, ...element.children.flatMap((child) => flatten(child))];
}

function textTree(element: FakeElement): string {
  return flatten(element)
    .map((node) => node.textContent ?? "")
    .join(" ");
}

function applicationRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>("#app");
  if (root === null) {
    throw new Error("Missing fake application root.");
  }
  return root;
}

const projectId = "81111111-1111-4111-8111-111111111111";
let fakeDocument: FakeDocument;

beforeEach(() => {
  fakeDocument = new FakeDocument(new FakeElement("main"));
  vi.stubGlobal("document", fakeDocument);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("private project shell", () => {
  it("keeps every navigation link inside the active project and exposes the RSVP settings hook", () => {
    renderShell(applicationRoot(), {
      kind: "project_allowed",
      projectId,
      projectPath: "/settings",
    });

    const nodes = flatten(fakeDocument.root);
    const links = nodes.filter((node) => node.tagName === "A");

    expect(fakeDocument.title).toBe("Réglages · Mariage OS");
    expect(nodes.some((node) => node.attributes.get("data-shell") === "private-project")).toBe(true);
    expect(nodes.some((node) => node.attributes.get("data-rsvp-intent-hook") === "true")).toBe(true);
    expect(links.length).toBeGreaterThan(5);
    expect(
      links.every((link) =>
        link.attributes.get("href")?.startsWith(`/app/p/${projectId}/`),
      ),
    ).toBe(true);
    expect(
      links.some(
        (link) =>
          link.attributes.get("href") === `/app/p/${projectId}/settings` &&
          link.attributes.get("aria-current") === "page",
      ),
    ).toBe(true);
  });

  it("uses a generic project title for an authorized unknown section", () => {
    renderShell(applicationRoot(), {
      kind: "project_allowed",
      projectId,
      projectPath: "/future-section",
    });

    expect(fakeDocument.title).toBe("Espace projet · Mariage OS");
    expect(textTree(fakeDocument.root)).not.toContain("Invitations & RSVP");
  });

  it("falls back to the dashboard section when the project path is empty", () => {
    renderShell(applicationRoot(), {
      kind: "project_allowed",
      projectId,
      projectPath: "/",
    });

    expect(fakeDocument.title).toBe("Tableau de bord · Mariage OS");
  });
});

describe("non-project shells", () => {
  it("renders a login link carrying only the already-safe protected return path", () => {
    renderShell(applicationRoot(), {
      kind: "login_required",
      returnTo: `/app/p/${projectId}/dashboard`,
    });

    const link = flatten(fakeDocument.root).find((node) => node.tagName === "A");
    expect(fakeDocument.title).toBe("Connexion requise · Mariage OS");
    expect(link?.attributes.get("href")).toBe(
      `/login?returnTo=${encodeURIComponent(`/app/p/${projectId}/dashboard`)}`,
    );
  });

  it("renders the public RSVP shell without private navigation or capability material", () => {
    renderShell(applicationRoot(), { kind: "public_rsvp" });

    const nodes = flatten(fakeDocument.root);
    expect(fakeDocument.title).toBe("Invitation & RSVP · Mariage OS");
    expect(nodes.some((node) => node.tagName === "NAV")).toBe(false);
    expect(nodes.some((node) => node.attributes.get("data-shell") === "public-rsvp")).toBe(true);
    expect(textTree(fakeDocument.root)).not.toContain("opaque-capability");
  });

  it.each([
    ["landing", "Mariage OS · Mariage OS"],
    ["login", "Connexion · Mariage OS"],
    ["onboarding", "Configuration · Mariage OS"],
    ["invite", "Invitation au projet · Mariage OS"],
    ["not_found", "Page indisponible · Mariage OS"],
    ["verification_required", "Vérification requise · Mariage OS"],
    ["project_unavailable", "Projet indisponible · Mariage OS"],
  ] as const)("renders the %s recovery shell", (kind, title) => {
    renderShell(applicationRoot(), { kind });
    expect(fakeDocument.title).toBe(title);
    expect(
      flatten(fakeDocument.root).some(
        (node) => node.attributes.get("data-shell") === kind,
      ),
    ).toBe(true);
  });
});
