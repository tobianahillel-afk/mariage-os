import { afterEach, expect, it, vi } from "vitest";
import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import { createVenueWorkspace } from "./render-venue-workspace";
import { addListener } from "./venue-workspace-presentation";

type FakeNode = FakeElement | FakeTextNode;

class FakeTextNode {
  readonly children: FakeNode[] = [];
  constructor(readonly textContent: string) {}
}

class FakeElement {
  readonly tagName: string;
  textContent: string | null = null;
  className = "";
  hidden = false;
  checked = false;
  readonly attributes = new Map<string, string>();
  children: FakeNode[] = [];
  private readonly listeners = new Map<string, EventListener[]>();

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  append(...children: FakeNode[]): void {
    this.children.push(...children);
  }

  replaceChildren(...children: FakeNode[]): void {
    this.children = children;
  }

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener({ type } as Event);
    }
  }
}

interface FakeDocument {
  createElement(tagName: string): FakeElement;
  createTextNode?: (value: string) => FakeTextNode;
}

function installDocument(withTextNode = true): FakeDocument {
  const fakeDocument: FakeDocument = {
    createElement: (tagName: string) => new FakeElement(tagName),
    ...(withTextNode
      ? { createTextNode: (value: string) => new FakeTextNode(value) }
      : {}),
  };
  vi.stubGlobal("document", fakeDocument);
  return fakeDocument;
}

function descendants(node: FakeNode): FakeNode[] {
  return [node, ...node.children.flatMap(descendants)];
}

function elements(node: FakeNode): FakeElement[] {
  return descendants(node).filter(
    (candidate): candidate is FakeElement => candidate instanceof FakeElement,
  );
}

function texts(node: FakeNode): string[] {
  return descendants(node)
    .map((candidate) => candidate.textContent)
    .filter((value): value is string => value !== null);
}

function byAttribute(
  root: FakeNode,
  name: string,
  value: string,
): FakeElement[] {
  return elements(root).filter(
    (candidate) => candidate.getAttribute(name) === value,
  );
}

function byClass(root: FakeNode, className: string): FakeElement[] {
  return elements(root).filter(
    (candidate) => candidate.className === className,
  );
}

function requiredInput(
  inputs: readonly FakeElement[],
  index: number,
): FakeElement {
  const input = inputs[index];
  if (input === undefined) {
    throw new Error(`Expected compare input at index ${index}.`);
  }
  return input;
}

const projectId = "81111111-1111-4111-8111-111111111111";

function venueId(index: number): string {
  return `91111111-1111-4111-8111-${String(index).padStart(12, "0")}`;
}

function item(
  index: number,
  overrides: Partial<VenueWorkspaceItem> = {},
): VenueWorkspaceItem {
  const id = venueId(index);
  return {
    venue: {
      id,
      projectId,
      code: `V${index}`,
      name: `Venue ${index}`,
      status: "shortlist",
      rejectionReason: null,
      websiteUrl: null,
      city: "Paris",
      revision: 1,
    },
    syncState: "synced",
    compatibility: {
      blockingStatus: index % 2 === 0 ? "FAIL" : "PASS",
      weightedScore: 0.5 + index / 100,
      evidenceReadiness: 0.8,
      unknownImportantCriteria: 0,
      conflictingCriteria: 0,
    },
    opinions: {
      ownPreference: null,
      ratings: [
        {
          id: `a1111111-1111-4111-8111-${String(index).padStart(12, "0")}`,
          projectId,
          userId: "71111111-1111-4111-8111-111111111111",
          venueId: id,
          dimensionKey: "love_score",
          rating: 4,
          revision: 1,
        },
      ],
    },
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("renders safe project-scoped Gallery cards and switches to the bounded Table", () => {
  installDocument();
  const hostileName = '<img src=x onerror="alert(1)">';
  const first = item(1, {
    venue: { ...item(1).venue, name: hostileName },
    syncState: "pending",
  });
  const root = createVenueWorkspace(projectId, "/venues", {
    kind: "gallery",
    items: [first],
  }) as unknown as FakeElement;

  const gallery = byClass(root, "venue-gallery")[0] as FakeElement;
  const mobileFallback = byClass(
    root,
    "venue-mobile-table-fallback",
  )[0] as FakeElement;
  expect(byAttribute(gallery, "data-venue-card", first.venue.id)).toHaveLength(1);
  expect(
    byAttribute(mobileFallback, "data-venue-card", first.venue.id),
  ).toHaveLength(1);
  expect(texts(root)).toContain(`V1 · ${hostileName}`);
  expect(texts(root)).toContain("Modification en attente");
  expect(texts(root)).toContain("Avis partenaires · 4.0");
  expect(
    byAttribute(root, "href", `/app/p/${projectId}/venues/${first.venue.id}`),
  ).toHaveLength(3);

  const tablePanel = byClass(root, "venue-table-panel")[0] as FakeElement;
  const tableButton = byAttribute(
    root,
    "data-venue-mode",
    "table",
  )[0] as FakeElement;
  const galleryButton = byAttribute(
    root,
    "data-venue-mode",
    "gallery",
  )[0] as FakeElement;
  expect(tablePanel.hidden).toBe(true);

  tableButton.dispatch("click");
  expect(gallery.hidden).toBe(true);
  expect(tablePanel.hidden).toBe(false);
  expect(tableButton.getAttribute("aria-pressed")).toBe("true");
  expect(galleryButton.getAttribute("aria-pressed")).toBe("false");

  galleryButton.dispatch("click");
  expect(gallery.hidden).toBe(false);
  expect(tablePanel.hidden).toBe(true);
  expect(byAttribute(root, "data-venue-table", "true")).toHaveLength(1);
});

it("renders empty Gallery and decision-first Detail without disclosing missing entities", () => {
  installDocument();
  const empty = createVenueWorkspace(projectId, "/venues", {
    kind: "gallery",
    items: [],
  }) as unknown as FakeElement;
  expect(texts(empty)).toContain("Aucune salle disponible dans ce projet.");

  const missing = createVenueWorkspace(projectId, `/venues/${venueId(2)}`, {
    kind: "detail",
    item: null,
  }) as unknown as FakeElement;
  expect(texts(missing)).toContain(
    "Cette salle n’est pas disponible avec le contexte actuel.",
  );
  expect(texts(missing).join(" ")).not.toContain(venueId(2));

  const unknown = item(2, {
    compatibility: null,
    opinions: { ownPreference: null, ratings: [] },
    syncState: "conflict",
    venue: { ...item(2).venue, city: null },
  });
  const detail = createVenueWorkspace(
    projectId,
    `/venues/${unknown.venue.id}`,
    {
      kind: "detail",
      item: unknown,
    },
  ) as unknown as FakeElement;
  const allTexts = texts(detail);
  const blockingIndex = allTexts.findIndex((value) =>
    value.startsWith("Blocage"),
  );
  const scoreIndex = allTexts.findIndex((value) => value.startsWith("Score"));
  expect(blockingIndex).toBeGreaterThanOrEqual(0);
  expect(scoreIndex).toBeGreaterThan(blockingIndex);
  expect(allTexts).toContain("Blocage · UNKNOWN");
  expect(allTexts).toContain("Score · —");
  expect(allTexts).toContain("Preuves · —");
  expect(allTexts).toContain("Avis partenaires · —");
  expect(allTexts).toContain("Conflit local");
  expect(
    byAttribute(
      detail,
      "href",
      `/app/p/${projectId}/venues/${unknown.venue.id}/visit`,
    ),
  ).toHaveLength(1);
});

it("limits Compare to five selections and keeps blocking differences visible", () => {
  installDocument();
  const candidates = Array.from({ length: 6 }, (_, index) => item(index + 1));
  const root = createVenueWorkspace(projectId, "/venues/compare", {
    kind: "compare",
    items: candidates,
  }) as unknown as FakeElement;

  expect(texts(root)).toContain("Choisissez au moins deux salles à comparer.");
  const inputs = candidates.map(
    (candidate) =>
      byAttribute(root, "value", candidate.venue.id)[0] as FakeElement,
  );
  const first = requiredInput(inputs, 0);
  const second = requiredInput(inputs, 1);
  const fifth = requiredInput(inputs, 4);
  const sixth = requiredInput(inputs, 5);

  first.checked = true;
  first.dispatch("change");
  expect(texts(root)).toContain("Choisissez au moins deux salles à comparer.");

  second.checked = true;
  second.dispatch("change");
  expect(byAttribute(root, "data-venue-compare-grid", "true")).toHaveLength(1);
  expect(texts(root)).toContain("Blocage");
  expect(texts(root)).toContain("FAIL");
  expect(texts(root)).toContain("PASS");

  for (const input of inputs.slice(2, 5)) {
    input.checked = true;
    input.dispatch("change");
  }
  sixth.checked = true;
  sixth.dispatch("change");
  expect(sixth.checked).toBe(false);

  const onlyDifferences = byAttribute(
    root,
    "data-only-differences",
    "true",
  )[0] as FakeElement;
  onlyDifferences.checked = true;
  onlyDifferences.dispatch("change");
  expect(texts(root)).toContain("Blocage");
  expect(texts(root)).not.toContain("Statut");

  fifth.checked = false;
  fifth.dispatch("change");
  sixth.checked = true;
  sixth.dispatch("change");
  expect(sixth.checked).toBe(true);
});

it("uses the text-node fallback and tolerates DOM stubs without listeners", () => {
  installDocument(false);
  const root = createVenueWorkspace(projectId, "/venues/compare", {
    kind: "compare",
    items: [item(1), item(2)],
  }) as unknown as FakeElement;
  expect(texts(root)).toContain(" Seulement les différences");
  expect(() =>
    addListener({} as HTMLElement, "click", () => undefined),
  ).not.toThrow();
});

it("renders explicit unavailable workspace state", () => {
  installDocument();
  const root = createVenueWorkspace(projectId, "/venues/not-a-route", {
    kind: "unavailable",
  }) as unknown as FakeElement;
  expect(byAttribute(root, "data-venue-workspace", "unavailable")).toHaveLength(
    1,
  );
});
