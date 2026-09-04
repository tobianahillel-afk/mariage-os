import { afterEach, expect, it, vi } from "vitest";
import {
  createSecurityDiagnosticsPanel,
  createSecuritySettingsPanel,
  type SecuritySettingsActions,
} from "./security-settings-panel";

class FakeElement {
  textContent: string | null = null;
  className = "";
  type = "";
  disabled = false;
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  private readonly listeners = new Map<string, Array<() => Promise<void> | void>>();

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  append(...children: FakeElement[]): void {
    this.children.push(...children);
  }

  addEventListener(
    type: string,
    listener: () => Promise<void> | void,
  ): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  querySelector(selector: string): FakeElement | null {
    const match = selector.match(/^\[data-action="([^"]+)"\]$/);
    if (match === null) return null;
    const value = match[1];
    return descendants(this).find(
      (element) => element.getAttribute("data-action") === value,
    ) ?? null;
  }

  async click(): Promise<void> {
    for (const listener of this.listeners.get("click") ?? []) {
      await listener();
    }
  }
}

function descendants(element: FakeElement): FakeElement[] {
  return [element, ...element.children.flatMap(descendants)];
}

function texts(element: FakeElement): string[] {
  return descendants(element)
    .map((child) => child.textContent)
    .filter((text): text is string => text !== null);
}

function installDocument(): void {
  vi.stubGlobal("document", {
    createElement: () => new FakeElement(),
  });
}

function actionElement(root: FakeElement, action: string): FakeElement {
  const element = root.querySelector(`[data-action="${action}"]`);
  if (element === null) throw new Error(`Missing action ${action}.`);
  return element;
}

function actions(result: unknown): {
  readonly target: SecuritySettingsActions;
  readonly logout: ReturnType<typeof vi.fn>;
} {
  const logout = vi.fn().mockResolvedValue(result);
  return { target: { logout }, logout };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

it("renders available MFA readiness without factor identifiers", () => {
  installDocument();
  const root = createSecuritySettingsPanel({
    diagnostics: {
      kind: "available",
      snapshot: {
        assurance: "aal1",
        canUpgradeToAal2: true,
        verifiedTotpFactor: true,
      },
    },
    actions: null,
  }) as unknown as FakeElement;

  expect(texts(root)).toContain("Niveau de session : AAL1");
  expect(texts(root)).toContain("Facteur TOTP vérifié : oui");
  expect(texts(root)).toContain("Étape MFA supplémentaire : disponible");
  expect(texts(root)).toContain(
    "La déconnexion sûre est indisponible sur cet appareil.",
  );
});

it("renders negative and unavailable diagnostic branches safely", () => {
  installDocument();
  const negative = createSecurityDiagnosticsPanel({
    kind: "available",
    snapshot: {
      assurance: "unknown",
      canUpgradeToAal2: false,
      verifiedTotpFactor: false,
    },
  }) as unknown as FakeElement;
  const unavailable = createSecurityDiagnosticsPanel({
    kind: "unavailable",
  }) as unknown as FakeElement;

  expect(texts(negative)).toContain("Facteur TOTP vérifié : non");
  expect(texts(negative)).toContain(
    "Étape MFA supplémentaire : non requise ou indisponible",
  );
  expect(texts(unavailable)).toContain("État MFA indisponible pour le moment.");
});

it("requires explicit discard when unresolved local work blocks logout", async () => {
  installDocument();
  const target = actions({ kind: "resolution_required", unresolvedCount: 3 });
  const root = createSecuritySettingsPanel({
    diagnostics: { kind: "unavailable" },
    actions: target.target,
  }) as unknown as FakeElement;

  await actionElement(root, "safe-logout").click();
  expect(texts(root)).toContain(
    "Synchronisez ou récupérez votre travail avant de réessayer, ou confirmez explicitement son abandon.",
  );
  const discard = actionElement(root, "discard-logout");
  await actionElement(root, "safe-logout").click();
  expect(
    descendants(root).filter(
      (element) => element.getAttribute("data-action") === "discard-logout",
    ),
  ).toHaveLength(1);

  target.logout.mockResolvedValueOnce({ kind: "completed" });
  await discard.click();
  expect(target.logout).toHaveBeenLastCalledWith(true);
});

it("reports unavailable local inspection without destructive fallback", async () => {
  installDocument();
  const target = actions({ kind: "local_state_unavailable" });
  const root = createSecuritySettingsPanel({
    diagnostics: { kind: "unavailable" },
    actions: target.target,
  }) as unknown as FakeElement;

  await actionElement(root, "safe-logout").click();
  expect(texts(root)).toContain(
    "Impossible de vérifier le travail local sans risque.",
  );
  expect(root.querySelector('[data-action="discard-logout"]')).toBeNull();
});

it("allows a completed logout result without rendering private recovery details", async () => {
  installDocument();
  const target = actions({ kind: "completed" });
  const root = createSecuritySettingsPanel({
    diagnostics: { kind: "unavailable" },
    actions: target.target,
  }) as unknown as FakeElement;

  await actionElement(root, "safe-logout").click();
  expect(target.logout).toHaveBeenCalledWith(false);
});

it("handles unexpected logout action rejection with a generic message", async () => {
  installDocument();
  const logout = vi.fn().mockRejectedValue(new Error("unexpected"));
  const root = createSecuritySettingsPanel({
    diagnostics: { kind: "unavailable" },
    actions: { logout },
  }) as unknown as FakeElement;

  await actionElement(root, "safe-logout").click();
  expect(texts(root)).toContain(
    "Impossible de terminer la déconnexion en toute sécurité.",
  );
});
