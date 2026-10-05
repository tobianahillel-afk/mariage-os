import { expect, it } from "vitest";

import { createCachedRecordEnvelope } from "@application/local-data/local-records";
import type { CachedRecordEnvelope } from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

const venueId = "a2111111-1111-4111-8111-111111111111";

interface OfflinePin {
  readonly key: string;
  readonly entityType: "venue";
  readonly entityId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly reason: "manual";
  readonly preparedAt: string;
  readonly updatedAt: string;
  readonly mediaPolicy: "thumbnails";
  readonly packageRevision: number;
}

interface OfflinePinStoreContract {
  putOfflinePinWithCachedRecord(
    pin: OfflinePin,
    record: CachedRecordEnvelope,
  ): Promise<void>;
  getOfflinePin(
    entityType: string,
    entityId: string,
  ): Promise<OfflinePin | null>;
}

function requireOfflinePinContract(
  store: IndexedDbProjectStore,
): OfflinePinStoreContract {
  const candidate = store as unknown as Partial<OfflinePinStoreContract>;
  if (
    typeof candidate.putOfflinePinWithCachedRecord !== "function" ||
    typeof candidate.getOfflinePin !== "function"
  ) {
    throw new Error("WP-2.12 offline pin store contract is not implemented.");
  }
  return candidate as OfflinePinStoreContract;
}

function pin(overrides: Partial<OfflinePin> = {}): OfflinePin {
  return {
    key: `venue:${venueId}`,
    entityType: "venue",
    entityId: venueId,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    reason: "manual",
    preparedAt: "2026-10-05T00:00:00.000Z",
    updatedAt: "2026-10-05T00:00:00.000Z",
    mediaPolicy: "thumbnails",
    packageRevision: 1,
    ...overrides,
  };
}

function visitPackage(): CachedRecordEnvelope {
  return createCachedRecordEnvelope(scope, {
    recordType: "venue_visit_package",
    entityId: venueId,
    serverRevision: null,
    serverUpdatedAt: null,
    syncMarker: "synced",
    payload: {
      venue: { id: venueId, name: "Venue offline fixture" },
      checklist: ["capacity", "access"],
      preparedAt: "2026-10-05T00:00:00.000Z",
      mediaPolicy: "thumbnails",
      packageRevision: 1,
    },
  });
}

it("durably writes a scoped offline pin and visit package together", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );
  const contract = requireOfflinePinContract(store);
  const expectedPin = pin();
  const expectedPackage = visitPackage();

  await contract.putOfflinePinWithCachedRecord(expectedPin, expectedPackage);

  expect(await contract.getOfflinePin("venue", venueId)).toEqual(expectedPin);
  expect(
    await store.getCachedRecord("venue_visit_package", venueId),
  ).toEqual(expectedPackage);
});

it("retains the offline pin and package after store reopen", async () => {
  const factory = new FakeFactory();
  const first = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );
  const firstContract = requireOfflinePinContract(first);

  await firstContract.putOfflinePinWithCachedRecord(pin(), visitPackage());
  first.close();

  const reopened = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );
  const reopenedContract = requireOfflinePinContract(reopened);

  expect(await reopenedContract.getOfflinePin("venue", venueId)).toEqual(pin());
  expect(
    await reopened.getCachedRecord("venue_visit_package", venueId),
  ).toEqual(visitPackage());
});

it("fails closed when a persisted offline pin belongs to another local scope", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );
  const contract = requireOfflinePinContract(store);

  rawStore(factory, "offline_pins").set(
    `venue:${venueId}`,
    pin({ userId: "b2111111-1111-4111-8111-111111111111" }),
  );

  await expect(contract.getOfflinePin("venue", venueId)).rejects.toThrow(
    "another local scope",
  );
});

it("fails closed on malformed persisted offline pin metadata", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );
  const contract = requireOfflinePinContract(store);

  rawStore(factory, "offline_pins").set(`venue:${venueId}`, {
    ...pin(),
    preparedAt: "not-a-timestamp",
  });

  await expect(contract.getOfflinePin("venue", venueId)).rejects.toThrow(
    "offline pin",
  );
});

it("does not leave a partial pin or package when durable preparation fails", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-red",
  );
  const contract = requireOfflinePinContract(store);
  factory.state.failure = "request";

  await expect(
    contract.putOfflinePinWithCachedRecord(pin(), visitPackage()),
  ).rejects.toThrow();

  expect(rawStore(factory, "offline_pins").size).toBe(0);
  expect(rawStore(factory, "cached_records").size).toBe(0);
});
