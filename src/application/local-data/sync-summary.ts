type LocalDurability = "available" | "unavailable";

export interface SyncSummaryInput {
  readonly durability: LocalDurability;
  readonly online: boolean;
  readonly syncing: boolean;
  readonly pendingCount: number;
  readonly conflictCount: number;
  readonly retryableFailureCount: number;
  readonly permanentFailureCount: number;
}

export type SyncSummary =
  | { readonly kind: "durability_unavailable"; readonly label: string }
  | { readonly kind: "conflict"; readonly label: string }
  | { readonly kind: "error"; readonly label: string }
  | { readonly kind: "offline_pending"; readonly label: string }
  | { readonly kind: "synchronizing"; readonly label: string }
  | { readonly kind: "pending"; readonly label: string }
  | { readonly kind: "offline"; readonly label: string }
  | { readonly kind: "synced"; readonly label: string };

function pendingLabel(count: number): string {
  const noun = count === 1 ? "modification" : "modifications";
  return `${count} ${noun} en attente`;
}

function assertCount(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

function settledConnectivitySummary(online: boolean): SyncSummary {
  if (!online) {
    return {
      kind: "offline",
      label: "Hors ligne · aucune modification en attente",
    };
  }
  return { kind: "synced", label: "En ligne · synchronisé" };
}

export function deriveSyncSummary(input: SyncSummaryInput): SyncSummary {
  assertCount(input.pendingCount, "pendingCount");
  assertCount(input.conflictCount, "conflictCount");
  assertCount(input.retryableFailureCount, "retryableFailureCount");
  assertCount(input.permanentFailureCount, "permanentFailureCount");

  if (input.durability === "unavailable") {
    return {
      kind: "durability_unavailable",
      label: "Stockage local indisponible · mode dégradé",
    };
  }
  if (input.conflictCount > 0) {
    return { kind: "conflict", label: "Conflit de synchronisation à vérifier" };
  }
  if (input.retryableFailureCount + input.permanentFailureCount > 0) {
    return {
      kind: "error",
      label: "Erreur de sync · travail conservé localement",
    };
  }
  if (!input.online && input.pendingCount > 0) {
    return {
      kind: "offline_pending",
      label: `Hors ligne · ${pendingLabel(input.pendingCount)}`,
    };
  }
  if (input.syncing) {
    return { kind: "synchronizing", label: "Synchronisation…" };
  }
  if (input.pendingCount > 0) {
    return {
      kind: "pending",
      label: `${pendingLabel(input.pendingCount)} · enregistrées localement`,
    };
  }
  return settledConnectivitySummary(input.online);
}
