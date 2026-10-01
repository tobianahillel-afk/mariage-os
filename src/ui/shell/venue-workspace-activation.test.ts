import { afterEach, expect, it, vi } from "vitest";
import type { SyncSummary } from "@application/local-data/sync-summary";
import { renderShell, type ProjectShellState } from "./render-shell";

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

  replaceChildren(...children: FakeElement[]): void {
    this.children = children;
  }
}

function installDocument(): void {
  vi.stubGlobal("document", {
    title: "",
    createElement: () => new FakeElement(),
  });
}

function descendants(element: FakeElement): readonly FakeElement[] {
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

it("activates Gallery, detail and Compare inside the protected shell", () => {
  installDocument();
  const root = new FakeElement();

  renderShell(root as unknown as HTMLElement, state("/venues"));
  expect(countAttribute(root, "data-venue-workspace", "gallery")).toBe(1);

  renderShell(
    root as unknown as HTMLElement,
    state("/venues/91111111-1111-4111-8111-111111111111"),
  );
  expect(countAttribute(root, "data-venue-workspace", "detail")).toBe(1);

  renderShell(root as unknown as HTMLElement, state("/venues/compare"));
  expect(countAttribute(root, "data-venue-workspace", "compare")).toBe(1);
});
