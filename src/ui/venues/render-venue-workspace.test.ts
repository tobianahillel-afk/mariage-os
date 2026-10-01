import { afterEach, expect, it, vi } from "vitest";
import { createVenueWorkspace } from "./render-venue-workspace";

class FakeElement {
  textContent: string | null = null;
  className = "";
  readonly attributes = new Map<string, string>();
  children: FakeElement[] = [];

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  append(...children: FakeElement[]): void {
    this.children.push(...children);
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

function hasAttribute(
  root: FakeElement,
  name: string,
  value: string,
): boolean {
  return descendants(root).some(
    (element) => element.getAttribute(name) === value,
  );
}

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111111";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("creates the Gallery default without synthetic Venue data", () => {
  installDocument();
  const root = createVenueWorkspace(
    projectId,
    "/venues",
  ) as unknown as FakeElement;
  expect(hasAttribute(root, "data-venue-workspace", "gallery")).toBe(true);
  expect(hasAttribute(root, "data-venue-mode", "gallery")).toBe(true);
  expect(descendants(root).some((item) => item.textContent === "Galerie")).toBe(
    true,
  );
});

it("keeps detail and downstream visit links project scoped", () => {
  installDocument();
  const root = createVenueWorkspace(
    projectId,
    `/venues/${venueId}`,
  ) as unknown as FakeElement;
  expect(hasAttribute(root, "data-venue-workspace", "detail")).toBe(true);
  expect(hasAttribute(root, "data-venue-id", venueId)).toBe(true);
  expect(
    hasAttribute(
      root,
      "href",
      `/app/p/${projectId}/venues/${venueId}/visit`,
    ),
  ).toBe(true);
});

it("creates Compare without declaring a winner", () => {
  installDocument();
  const root = createVenueWorkspace(
    projectId,
    "/venues/compare",
  ) as unknown as FakeElement;
  expect(hasAttribute(root, "data-venue-workspace", "compare")).toBe(true);
  expect(
    descendants(root).some((item) =>
      item.textContent?.toLowerCase().includes("gagnant"),
    ),
  ).toBe(false);
});

it("fails closed for malformed Venue detail paths", () => {
  installDocument();
  const root = createVenueWorkspace(
    projectId,
    "/venues/not-a-venue",
  ) as unknown as FakeElement;
  expect(hasAttribute(root, "data-venue-workspace", "unavailable")).toBe(true);
});
