import { afterEach, describe, expect, it, vi } from "vitest";
import type { VenueWorkspaceItem } from "@application/venues/venue-workspace-read-service";
import { createVenueWorkspace } from "./render-venue-workspace";

class FakeElement {
  textContent: string | null = null;
  className = "";
  type = "";
  checked = false;
  hidden = false;
  readonly attributes = new Map<string, string>();
  children: FakeElement[] = [];
  private readonly listeners = new Map<string, Array<() => void>>();

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

  addEventListener(type: string, listener: () => void): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  trigger(type: string): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

function installDocument(): void {
  vi.stubGlobal("document", {
    createElement: () => new FakeElement(),
  });
}

function descendants(element: FakeElement): readonly FakeElement[] {
  return [element, ...element.children.flatMap(descendants)];
}

function byAttribute(
  root: FakeElement,
  name: string,
  value: string,
): readonly FakeElement[] {
  return descendants(root).filter(
    (element) => element.getAttribute(name) === value,
  );
}

const projectId = "81111111-1111-4111-8111-111111111111";

function item(index: number, compatibility = true): VenueWorkspaceItem {
  const suffix = String(index).padStart(12, "0");
  return {
    venue: {
      id: `91111111-1111-4111-8111-${suffix}`,
      projectId,
      code: `V-${index}`,
      name: index === 1 ? "<img src=x onerror=alert(1)>" : `Salle ${index}`,
      status: index % 2 === 0 ? "shortlisted" : "researching",
      rejectionReason: null,
      websiteUrl: null,
      city: index === 2 ? null : "Paris",
      revision: 1,
    },
    syncState: index === 2 ? "pending" : "synced",
    compatibility: compatibility
      ? {
          blockingStatus: index === 2 ? "FAIL" : "PASS",
          weightedScore: index / 10,
          evidenceReadiness: index / 12,
          unknownImportantCriteria: index,
          conflictingCriteria: index === 2 ? 1 : 0,
        }
      : null,
    opinions: {
      ownPreference: {
        id: `a1111111-1111-4111-8111-${suffix}`,
        projectId,
        userId: "71111111-1111-4111-8111-111111111111",
        venueId: `91111111-1111-4111-8111-${suffix}`,
        favorite: index === 1,
        personalNote: null,
        revision: 1,
      },
      ratings:
        index === 2
          ? []
          : [
              {
                id: `b1111111-1111-4111-8111-${suffix}`,
                projectId,
                userId: "71111111-1111-4111-8111-111111111111",
                venueId: `91111111-1111-4111-8111-${suffix}`,
                dimensionKey: "overall_fit",
                rating: 8,
                revision: 1,
              },
            ],
    },
  } as VenueWorkspaceItem;
}

afterEach(() => vi.unstubAllGlobals());

describe("Venue workspace rendering", () => {
  it("renders safe Gallery cards and switches to the controlled table", () => {
    installDocument();
    const root = createVenueWorkspace(projectId, "/venues", {
      kind: "collection",
      items: [item(1), item(2), item(3, false)],
    }) as unknown as FakeElement;

    expect(byAttribute(root, "data-venue-card", item(1).venue.id)).toHaveLength(1);
    expect(byAttribute(root, "data-venue-table", "true")).toHaveLength(1);
    expect(descendants(root).map((element) => element.textContent)).toContain(
      "<img src=x onerror=alert(1)>",
    );
    const gallery = byAttribute(root, "data-venue-gallery", "true")[0] as FakeElement;
    const tableButton = byAttribute(root, "data-venue-mode-target", "table")[0] as FakeElement;
    const galleryButton = byAttribute(root, "data-venue-mode-target", "gallery")[0] as FakeElement;
    tableButton.trigger("click");
    expect(gallery.hidden).toBe(true);
    expect(root.getAttribute("data-venue-mode")).toBe("table");
    galleryButton.trigger("click");
    expect(gallery.hidden).toBe(false);
  });

  it("renders empty collection without pretending data exists", () => {
    installDocument();
    const root = createVenueWorkspace(projectId, "/venues", {
      kind: "collection",
      items: [],
    }) as unknown as FakeElement;
    expect(descendants(root).map((element) => element.textContent)).toContain(
      "Aucune salle disponible.",
    );
  });

  it("renders blocker before score on the detail summary", () => {
    installDocument();
    const selected = item(1);
    const root = createVenueWorkspace(
      projectId,
      `/venues/${selected.venue.id}`,
      { kind: "detail", item: selected },
    ) as unknown as FakeElement;
    const all = descendants(root);
    const blocking = all.findIndex(
      (element) => element.getAttribute("data-venue-blocking-status") === "true",
    );
    const score = all.findIndex(
      (element) => element.getAttribute("data-venue-weighted-score") === "true",
    );
    expect(blocking).toBeGreaterThan(-1);
    expect(score).toBeGreaterThan(blocking);
    expect(byAttribute(root, "data-downstream-visit", "true")).toHaveLength(1);
  });

  it("compares two to five venues and supports differences-only filtering", () => {
    installDocument();
    const items = [1, 2, 3, 4, 5, 6].map((value) => item(value));
    const root = createVenueWorkspace(projectId, "/venues/compare", {
      kind: "compare",
      items,
    }) as unknown as FakeElement;
    expect(byAttribute(root, "data-venue-compare-grid", "true")).toHaveLength(1);

    const differences = byAttribute(root, "data-only-differences", "true")[0] as FakeElement;
    differences.checked = true;
    differences.trigger("change");
    expect(byAttribute(root, "data-venue-compare-grid", "true")).toHaveLength(1);

    const selectors = descendants(root).filter(
      (element) => element.getAttribute("data-compare-venue") !== null,
    );
    for (const selector of selectors.slice(2, 5)) {
      selector.checked = true;
      selector.trigger("change");
    }
    const sixth = selectors[5] as FakeElement;
    sixth.checked = true;
    sixth.trigger("change");
    expect(sixth.checked).toBe(false);

    const first = selectors[0] as FakeElement;
    first.checked = false;
    first.trigger("change");
    expect(byAttribute(root, "data-venue-compare-grid", "true")).toHaveLength(1);
  });

  it("shows compare guidance with fewer than two venues", () => {
    installDocument();
    const root = createVenueWorkspace(projectId, "/venues/compare", {
      kind: "compare",
      items: [item(1)],
    }) as unknown as FakeElement;
    expect(descendants(root).map((element) => element.textContent)).toContain(
      "Sélectionnez au moins deux salles.",
    );
  });

  it("fails closed for mismatched route/state identities", () => {
    installDocument();
    const selected = item(1);
    for (const [path, state] of [
      ["/venues/not-a-venue", { kind: "collection", items: [selected] }],
      [`/venues/${item(2).venue.id}`, { kind: "detail", item: selected }],
      ["/venues", { kind: "unavailable" }],
    ] as const) {
      const root = createVenueWorkspace(
        projectId,
        path,
        state as never,
      ) as unknown as FakeElement;
      expect(byAttribute(root, "data-venue-workspace", "unavailable")).toHaveLength(1);
    }
  });
});
