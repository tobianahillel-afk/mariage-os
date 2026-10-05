type LocalDurability = "available" | "unavailable";

export interface SyncSummaryInput {
  readonly durability: LocalDurability;
  readonly online: boolean;
  readonly syncing: boolean;
  readonly cloudSynchronized: boolean;
  readonly pendingCount: number;
  readonly conflictCount: number;
  readonly retryableFailureCount: number;
  readonly permanentFailureCount: number;
  readonly unsyncedBinaryCount: number;
}

export type SyncSummary =
  | { readonly kind: "durability_unavailable"; readonly label: string }
  | { readonly kind: "conflict"; readonly label: string }
  | { readonly kind: "error"; readonly label: string }
  | { readonly kind: "offline_pending"; readonly label: string }
  | { readonly kind: "synchronizing"; readonly label: string }
  | { readonly kind: "pending"; readonly label: string }
  | { readonly kind: "offline"; readonly label: string }
  | { readonly kind: "online_idle"; readonly label: string }
  | { readonly kind: "synced"; readonly label: string };

function pendingLabel(count: number): string {
  const noun = count === 1 ? "modification" : "modifications";
  return `${count} ${noun} en attente`;
}

function binaryPendingLabel(count: number): string {
  const noun = count === 1 ? "fichier local" : "fichiers locaux";
  return `${count} ${noun} en attente d’envoi`;
}

function pendingWorkLabel(
  pendingCount: number,
  unsyncedBinaryCount: number,
): string {
  if (pendingCount === 0) return binaryPendingLabel(unsyncedBinaryCount);
  if (unsyncedBinaryCount === 0) return pendingLabel(pendingCount);
  return `${pendingLabel(pendingCount)} · ${binaryPendingLabel(unsyncedBinaryCount)}`;
}

function assertCount(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer.`);
  }
}

function settledConnectivitySummary(
  online: boolean,
  cloudSynchronized: boolean,
): SyncSummary {
  if (!online) {
    return {
      kind: "offline",
      label: "Hors ligne · aucune modification en attente",
    };
  }
  if (!cloudSynchronized) {
    return {
      kind: "online_idle",
      label: "En ligne · aucune modification locale en attente",
    };
  }
  return { kind: "synced", label: "En ligne · synchronisé" };
}

export function deriveSyncSummary(input: SyncSummaryInput): SyncSummary {
  assertCount(input.pendingCount, "pendingCount");
  assertCount(input.conflictCount, "conflictCount");
  assertCount(input.retryableFailureCount, "retryableFailureCount");
  assertCount(input.permanentFailureCount, "permanentFailureCount");
  assertCount(input.unsyncedBinaryCount, "unsyncedBinaryCount");

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

  const hasPendingWork =
    input.pendingCount > 0 || input.unsyncedBinaryCount > 0;
  if (!input.online && hasPendingWork) {
    return {
      kind: "offline_pending",
      label: `Hors ligne · ${pendingWorkLabel(
        input.pendingCount,
        input.unsyncedBinaryCount,
      )}`,
    };
  }
  if (input.syncing) {
    return { kind: "synchronizing", label: "Synchronisation…" };
  }
  if (hasPendingWork) {
    const work = pendingWorkLabel(
      input.pendingCount,
      input.unsyncedBinaryCount,
    );
    const suffix =
      input.pendingCount === 0
        ? "conservé localement"
        : "enregistrées localement";
    return {
      kind: "pending",
      label: `${work} · ${suffix}`,
    };
  }
  return settledConnectivitySummary(input.online, input.cloudSynchronized);
}
