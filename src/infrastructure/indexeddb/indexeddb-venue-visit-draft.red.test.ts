import { expect, it } from "vitest";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

const venueId = "d2111111-1111-4111-8111-111111111111";

interface VisitQuestionSnapshot {
  readonly questionId: string;
  readonly prompt: string;
  readonly response: string | null;
}

interface VisitMeasurement {
  readonly key: string;
  readonly value: number;
  readonly unit: string;
}

interface VenueVisitDraft {
  readonly venueId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly draftRevision: number;
  readonly questionSetRevision: number;
  readonly questions: readonly VisitQuestionSnapshot[];
  readonly notes: string;
  readonly measurements: readonly VisitMeasurement[];
  readonly personalRatingIntent: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface VenueVisitDraftStoreContract {
  putVenueVisitDraft(draft: VenueVisitDraft): Promise<void>;
  getVenueVisitDraft(venueId: string): Promise<VenueVisitDraft | null>;
}

function requireVenueVisitDraftContract(
  store: IndexedDbProjectStore,
): VenueVisitDraftStoreContract {
  const candidate = store as unknown as Partial<VenueVisitDraftStoreContract>;
  if (
    typeof candidate.putVenueVisitDraft !== "function" ||
    typeof candidate.getVenueVisitDraft !== "function"
  ) {
    throw new Error("WP-2.12 Venue visit draft contract is not implemented.");
  }
  return candidate as VenueVisitDraftStoreContract;
}

function draft(overrides: Partial<VenueVisitDraft> = {}): VenueVisitDraft {
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

it("persists and reads a scoped Venue visit draft", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-red",
  );
  const contract = requireVenueVisitDraftContract(store);
  const expected = draft();

  await contract.putVenueVisitDraft(expected);

  expect(await contract.getVenueVisitDraft(venueId)).toEqual(expected);
});

it("retains the Venue visit draft after store reopen", async () => {
  const factory = new FakeFactory();
  const first = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-red",
  );
  const firstContract = requireVenueVisitDraftContract(first);
  await firstContract.putVenueVisitDraft(draft());
  first.close();

  const reopened = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-red",
  );
  const reopenedContract = requireVenueVisitDraftContract(reopened);

  expect(await reopenedContract.getVenueVisitDraft(venueId)).toEqual(draft());
});

it("fails closed on malformed persisted Venue visit draft data", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-draft-red",
  );
  const contract = requireVenueVisitDraftContract(store);

  rawStore(factory, "cached_records").set(`venue_visit_draft:${venueId}`, {
    key: `venue_visit_draft:${venueId}`,
    recordType: "venue_visit_draft",
    entityId: venueId,
    projectId: scope.projectId,
    serverRevision: null,
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: {
      ...draft(),
      personalRatingIntent: 6,
    },
  });

  await expect(contract.getVenueVisitDraft(venueId)).rejects.toThrow(
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
    "2.12-draft-red",
  );
  const contract = requireVenueVisitDraftContract(store);

  rawStore(factory, "cached_records").set(`venue_visit_draft:${venueId}`, {
    key: `venue_visit_draft:${venueId}`,
    recordType: "venue_visit_draft",
    entityId: venueId,
    projectId: scope.projectId,
    serverRevision: null,
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: {
      ...draft(),
      [field]: value,
    },
  });

  await expect(contract.getVenueVisitDraft(venueId)).rejects.toThrow(
    "another local scope",
  );
});
