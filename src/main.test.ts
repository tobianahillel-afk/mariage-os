import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeElement {
  readonly tagName: string;
  textContent: string | null = null;
  children: FakeElement[] = [];

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  replaceChildren(...children: FakeElement[]): void {
    this.children = children;
  }
}

function createFakeDocument(root: FakeElement | null) {
  return {
    querySelector: () => root,
    createElement: (tagName: string) => new FakeElement(tagName),
  };
}

describe("Lot 0 application bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the engineering bootstrap into the application root", async () => {
    const root = new FakeElement("main");
    vi.stubGlobal("document", createFakeDocument(root));

    await import("./main");

    expect(root.children.map((child) => child.tagName)).toEqual([
      "H1",
      "P",
      "P",
    ]);
    expect(root.children.map((child) => child.textContent)).toEqual([
      "Mariage OS",
      "Socle d’ingénierie Lot 0 initialisé.",
      "Aucune fonctionnalité métier n’est encore implémentée.",
    ]);
  });

  it("fails fast when the application root is missing", async () => {
    vi.stubGlobal("document", createFakeDocument(null));

    await expect(import("./main")).rejects.toThrow(
      "Mariage OS bootstrap root #app is missing.",
    );
  });
});
