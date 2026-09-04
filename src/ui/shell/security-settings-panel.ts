import type { LogoutResult } from "@application/auth/safe-logout";
import type { SecurityDiagnosticsSnapshot } from "@application/auth/security-diagnostics-port";

export type SecurityDiagnosticsViewState =
  | {
      readonly kind: "available";
      readonly snapshot: SecurityDiagnosticsSnapshot;
    }
  | { readonly kind: "unavailable" };

export interface SecuritySettingsActions {
  logout(discardPending: boolean): Promise<LogoutResult>;
}

export interface SecuritySettingsState {
  readonly diagnostics: SecurityDiagnosticsViewState;
  readonly actions: SecuritySettingsActions | null;
}

function textElement(tag: string, text: string, className: string): HTMLElement {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

function diagnosticLines(
  state: SecurityDiagnosticsViewState,
): readonly string[] {
  if (state.kind === "unavailable") {
    return ["État MFA indisponible pour le moment."];
  }

  const { snapshot } = state;
  const totpStatus = snapshot.verifiedTotpFactor ? "oui" : "non";
  const stepUpStatus = snapshot.canUpgradeToAal2
    ? "disponible"
    : "non requise ou indisponible";
  return [
    `Niveau de session : ${snapshot.assurance.toUpperCase()}`,
    `Facteur TOTP vérifié : ${totpStatus}`,
    `Étape MFA supplémentaire : ${stepUpStatus}`,
  ];
}

function renderDiagnostics(
  container: HTMLElement,
  state: SecurityDiagnosticsViewState,
): void {
  const list = document.createElement("ul");
  list.className = "security-diagnostics-list";
  for (const line of diagnosticLines(state)) {
    list.append(textElement("li", line, "security-diagnostic"));
  }
  container.append(list);
}

function setStatus(status: HTMLElement, text: string): void {
  status.textContent = text;
  status.setAttribute("role", "status");
}

function appendDiscardAction(
  container: HTMLElement,
  actions: SecuritySettingsActions,
  status: HTMLElement,
): void {
  if (container.querySelector('[data-action="discard-logout"]') !== null) return;

  const discard = document.createElement("button");
  discard.type = "button";
  discard.textContent = "Abandonner les modifications locales et se déconnecter";
  discard.className = "danger-action";
  discard.setAttribute("data-action", "discard-logout");
  discard.addEventListener("click", async () => {
    discard.disabled = true;
    await actions.logout(true);
  });
  container.append(discard);
  setStatus(
    status,
    "Synchronisez ou récupérez votre travail avant de réessayer, ou confirmez explicitement son abandon.",
  );
}

function appendLogoutControls(
  container: HTMLElement,
  actions: SecuritySettingsActions | null,
): void {
  const status = textElement("p", "", "logout-status");
  container.append(status);

  if (actions === null) {
    setStatus(status, "La déconnexion sûre est indisponible sur cet appareil.");
    return;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Se déconnecter";
  button.setAttribute("data-action", "safe-logout");
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      const result = await actions.logout(false);
      if (result.kind === "resolution_required") {
        setStatus(
          status,
          `${result.unresolvedCount} élément(s) local(aux) doivent être résolus avant la déconnexion.`,
        );
        appendDiscardAction(container, actions, status);
      } else if (result.kind === "local_state_unavailable") {
        setStatus(
          status,
          "Impossible de vérifier le travail local sans risque.",
        );
      }
    } catch {
      setStatus(
        status,
        "Impossible de terminer la déconnexion en toute sécurité.",
      );
    } finally {
      button.disabled = false;
    }
  });
  container.append(button);
}

export function createSecuritySettingsPanel(
  state: SecuritySettingsState,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "security-settings-panel";
  section.setAttribute("data-security-settings", "true");
  section.append(
    textElement("h2", "Sécurité du compte", "section-title"),
    textElement(
      "p",
      "L’état affiché aide au diagnostic. Les opérations sensibles restent contrôlées côté serveur.",
      "section-copy",
    ),
  );
  renderDiagnostics(section, state.diagnostics);
  section.append(textElement("h3", "Déconnexion sécurisée", "section-title"));
  appendLogoutControls(section, state.actions);
  return section;
}

export function createSecurityDiagnosticsPanel(
  state: SecurityDiagnosticsViewState,
): HTMLElement {
  const section = document.createElement("section");
  section.className = "security-diagnostics-panel";
  section.setAttribute("data-security-diagnostics", "true");
  section.append(
    textElement("h2", "Diagnostics de sécurité", "section-title"),
    textElement(
      "p",
      "Ces informations sont limitées à l’état d’authentification utile et n’exposent aucun secret ni identifiant de facteur.",
      "section-copy",
    ),
  );
  renderDiagnostics(section, state);
  return section;
}
