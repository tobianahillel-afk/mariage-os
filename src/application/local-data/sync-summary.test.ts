import { expect, it } from "vitest";

import { deriveSyncSummary, type SyncSummaryInput } from "./sync-summary";

const base: SyncSummaryInput = {
  durability: "available",
  online: true,
  syncing: false,
  pendingCount: 0,
  conflictCount: 0,
  retryableFailureCount: 0,
  permanentFailureCount: 0,
};

it.each([
  [
    { durability: "unavailable" as const },
    "durability_unavailable",
    "Stockage local indisponible · mode dégradé",
  ],
  [{ conflictCount: 1 }, "conflict", "Conflit de synchronisation à vérifier"],
  [
    { retryableFailureCount: 1 },
    "error",
    "Erreur de sync · travail conservé localement",
  ],
  [
    { permanentFailureCount: 1 },
    "error",
    "Erreur de sync · travail conservé localement",
  ],
  [
    { online: false, pendingCount: 2 },
    "offline_pending",
    "Hors ligne · 2 modifications en attente",
  ],
  [{ syncing: true }, "synchronizing", "Synchronisation…"],
  [
    { pendingCount: 1 },
    "pending",
    "1 modification en attente · enregistrées localement",
  ],
  [
    { pendingCount: 2 },
    "pending",
    "2 modifications en attente · enregistrées localement",
  ],
  [
    { online: false },
    "offline",
    "Hors ligne · aucune modification en attente",
  ],
  [{}, "synced", "En ligne · synchronisé"],
])("derives %s", (override, kind, label) => {
  expect(deriveSyncSummary({ ...base, ...override })).toEqual({
    kind,
    label,
  });
});

it("prioritizes conflict over failures and pending state", () => {
  expect(
    deriveSyncSummary({
      ...base,
      conflictCount: 1,
      retryableFailureCount: 1,
      pendingCount: 2,
    }).kind,
  ).toBe("conflict");
});

it.each([
  ["pendingCount", -1],
  ["conflictCount", 0.5],
  ["retryableFailureCount", -2],
  ["permanentFailureCount", Number.NaN],
] as const)("rejects invalid %s", (field, value) => {
  expect(() => deriveSyncSummary({ ...base, [field]: value })).toThrow(field);
});
