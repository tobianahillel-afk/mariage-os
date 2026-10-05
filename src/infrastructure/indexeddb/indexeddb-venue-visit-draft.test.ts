import { expect, it } from "vitest";

import type { LocalVenueVisitDraft } from "@application/local-data/local-venue-visit-draft";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

const venueId = "d2111111-1111-4111-8111-111111111111";
const otherVenueId = "d3111111-1111-4111-8111-111111111111";

function draft(
  overrides: Partial<LocalVenueVisitDraft> = {},
): LocalVenueVisitDraft {
  return {
    venueId,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    draftRevision: 1,
    questionSetRevision: 1,
    questions: [
      {
        questionId: "access-loading",
        prompt: "Accès livraison praticable ?",
        response: null,
      },
      {
        questionId: "capacity-seated",
        prompt: "Capacité assise vérifiée ?",
        response: "180 personnes",
      },
    ],
    notes: "Vérifier le groupe électrogène.",
    measurements: [
      {
        key: "ceiling_height",
        value: 4.2,
        unit: "m",
      },
    ],
    personalRatingIntent: 4,
    createdAt: "2026-10-05T01:00:00.000Z",
    updatedAt: "2026-10-05T01:05:00.000Z",
    ...overrides,
  };
}

function rawDraftRow(payload: unknown, entityId = venueId) {
  return {
    key: `venue_visit_draft:${entityId}`,
    recordType: "venue_visit_draft",
    entityId,
    projectId: scope.projectId,
    serverRevision: null,
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload,
  };
}

it("returns null when no Venue visit draft exists", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );

  await expect(store.getVenueVisitDraft(venueId)).resolves.toBeNull();
});

it("persists and reads a scoped Venue visit draft", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );
  const expected = draft();

  await store.putVenueVisitDraft(expected);

  expect(await store.getVenueVisitDraft(venueId)).toEqual(expected);
});

it("retains the Venue visit draft after store reopen", async () => {
  const factory = new FakeFactory();
  const first = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );
  await first.putVenueVisitDraft(draft());
  first.close();

  const reopened = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );

  expect(await reopened.getVenueVisitDraft(venueId)).toEqual(draft());
});

it("fails closed on malformed persisted Venue visit draft data", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );

  rawStore(factory, "cached_records").set(
    `venue_visit_draft:${venueId}`,
    rawDraftRow({
      ...draft(),
      personalRatingIntent: 6,
    }),
  );

  await expect(store.getVenueVisitDraft(venueId)).rejects.toThrow(
    "Venue visit draft",
  );
});

it.each([
  ["userId", "e2111111-1111-4111-8111-111111111111"],
  ["deviceId", "f2111111-1111-4111-8111-111111111111"],
] as const)("fails closed on foreign draft %s", async (field, value) => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );

  rawStore(factory, "cached_records").set(
    `venue_visit_draft:${venueId}`,
    rawDraftRow({
      ...draft(),
      [field]: value,
    }),
  );

  await expect(store.getVenueVisitDraft(venueId)).rejects.toThrow(
    "another local scope",
  );
});

it("fails closed when the cached target and draft Venue differ", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );

  rawStore(factory, "cached_records").set(
    `venue_visit_draft:${venueId}`,
    rawDraftRow(draft({ venueId: otherVenueId })),
  );

  await expect(store.getVenueVisitDraft(venueId)).rejects.toThrow(
    "target does not match cache key",
  );
});

it("counts a persisted Venue visit draft as unresolved local work", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );

  await store.putVenueVisitDraft(draft());

  await expect(store.readSyncCounters()).resolves.toMatchObject({
    pendingCount: 1,
  });
});

it("rejects an older autosave snapshot and preserves the newer draft", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );
  const newer = draft({
    draftRevision: 2,
    notes: "Nouvelle note.",
    updatedAt: "2026-10-05T01:06:00.000Z",
  });

  await store.putVenueVisitDraft(newer);
  await expect(store.putVenueVisitDraft(draft())).rejects.toThrow("stale");
  await expect(store.getVenueVisitDraft(venueId)).resolves.toEqual(newer);
});

it("accepts an idempotent retry of the same draft revision", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );
  const expected = draft({
    draftRevision: 2,
    updatedAt: "2026-10-05T01:06:00.000Z",
  });

  await store.putVenueVisitDraft(expected);
  await expect(store.putVenueVisitDraft(expected)).resolves.toBeUndefined();
  await expect(store.getVenueVisitDraft(venueId)).resolves.toEqual(expected);
});

it("rejects changed content that reuses the same draft revision", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );
  const current = draft({
    draftRevision: 2,
    updatedAt: "2026-10-05T01:06:00.000Z",
  });

  await store.putVenueVisitDraft(current);
  await expect(
    store.putVenueVisitDraft({
      ...current,
      notes: "Contenu concurrent.",
    }),
  ).rejects.toThrow("revision was reused");
  await expect(store.getVenueVisitDraft(venueId)).resolves.toEqual(current);
});

it("fails closed when the local draft transaction request fails", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );
  factory.state.failure = "request";

  await expect(store.putVenueVisitDraft(draft())).rejects.toThrow(
    "Venue visit draft transaction failed",
  );
});

it("rejects a corrupt existing cache target before replacing a draft", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );
  rawStore(factory, "cached_records").set(
    `venue_visit_draft:${venueId}`,
    rawDraftRow(draft(), otherVenueId),
  );

  await expect(
    store.putVenueVisitDraft(
      draft({
        draftRevision: 2,
        updatedAt: "2026-10-05T01:06:00.000Z",
      }),
    ),
  ).rejects.toThrow("target does not match cache key");
});

it("rejects a mismatched pending visit draft while reading sync counters", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-green",
  );
  rawStore(factory, "cached_records").set(
    `venue_visit_draft:${venueId}`,
    rawDraftRow(draft({ venueId: otherVenueId }), venueId),
  );

  await expect(store.readSyncCounters()).rejects.toThrow(
    "target does not match cache key",
  );
});
