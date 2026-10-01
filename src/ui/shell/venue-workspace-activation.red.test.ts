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

function installDocument(): void {
  vi.stubGlobal("document", {
    title: "",
    createElement: (tagName: string) => new FakeElement(tagName),
  });
}

function descendants(element: FakeElement): FakeElement[] {
  return [element, ...element.children.flatMap(descendants)];
}

function countAttribute(
  root: FakeElement,
  name: string,
  value: string,
): number {
  return descendants(root).filter(
    (element) => element.getAttribute(name) === value,
  ).length;
}

const synced: SyncSummary = { kind: "synced", label: "Synchronisé" };

function state(projectPath: string): ProjectShellState {
  return {
    kind: "project_allowed",
    userId: "71111111-1111-4111-8111-111111111111",
    projectId: "81111111-1111-4111-8111-111111111111",
    projectPath,
    syncSummary: synced,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("RED: /venues owns a real Gallery workspace", () => {
  installDocument();
  const root = new FakeElement("div");
  renderShell(root as unknown as HTMLElement, state("/venues"));

  expect(countAttribute(root, "data-venue-workspace", "gallery")).toBe(1);
  expect(countAttribute(root, "data-venue-mode", "gallery")).toBe(1);
});

it("RED: canonical Venue detail deep link owns a detail workspace", () => {
  installDocument();
  const root = new FakeElement("div");
  renderShell(
    root as unknown as HTMLElement,
    state("/venues/91111111-1111-4111-8111-111111111111"),
  );

  expect(countAttribute(root, "data-venue-workspace", "detail")).toBe(1);
});

it("RED: /venues/compare owns a comparison workspace", () => {
  installDocument();
  const root = new FakeElement("div");
  renderShell(root as unknown as HTMLElement, state("/venues/compare"));

  expect(countAttribute(root, "data-venue-workspace", "compare")).toBe(1);
});
