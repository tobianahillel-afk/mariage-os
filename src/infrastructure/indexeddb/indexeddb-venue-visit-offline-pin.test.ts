import { expect, it } from "vitest";

import type {
  LocalOfflinePin,
} from "@application/local-data/local-offline-pin";
import {
  createCachedRecordEnvelope,
  type CachedRecordEnvelope,
} from "@application/local-data/local-records";

import { IndexedDbProjectStore } from "./indexeddb-project-store";
import {
  FakeFactory,
  rawStore,
  scope,
} from "../../../tests/support/indexeddb-project-store-test-support";

const venueId = "a2111111-1111-4111-8111-111111111111";
const otherVenueId = "a2222222-2222-4222-8222-222222222222";

function pin(overrides: Partial<LocalOfflinePin> = {}): LocalOfflinePin {
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

function visitPackage(
  recordType = "venue_visit_package",
  entityId = venueId,
): CachedRecordEnvelope {
  return createCachedRecordEnvelope(scope, {
    recordType,
    entityId,
    serverRevision: null,
    serverUpdatedAt: null,
    syncMarker: "synced",
    payload: {
      venue: { id: entityId, name: "Venue offline fixture" },
      checklist: ["capacity", "access"],
      preparedAt: "2026-10-05T00:00:00.000Z",
      mediaPolicy: "thumbnails",
      packageRevision: 1,
    },
  });
}

it("writes a scoped offline pin and visit package together", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );
  const expectedPin = pin();
  const expectedPackage = visitPackage();

  await store.putOfflinePinWithCachedRecord(expectedPin, expectedPackage);

  const storedPin = await store.getOfflinePin("venue", venueId);
  const storedPackage = await store.getCachedRecord(
    "venue_visit_package",
    venueId,
  );
  expect(storedPin).toEqual(expectedPin);
  expect(storedPackage).toEqual(expectedPackage);
});

it("retains the pin and package after reopen", async () => {
  const factory = new FakeFactory();
  const first = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  await first.putOfflinePinWithCachedRecord(pin(), visitPackage());
  first.close();

  const reopened = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  expect(await reopened.getOfflinePin("venue", venueId)).toEqual(pin());
  expect(
    await reopened.getCachedRecord("venue_visit_package", venueId),
  ).toEqual(visitPackage());
});

it("returns null when no offline pin is prepared", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  await expect(store.getOfflinePin("venue", venueId)).resolves.toBeNull();
});

it("fails closed on a foreign offline pin", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  rawStore(factory, "offline_pins").set(`venue:${venueId}`, {
    ...pin({ userId: "b2111111-1111-4111-8111-111111111111" }),
  });

  await expect(store.getOfflinePin("venue", venueId)).rejects.toThrow(
    "another local scope",
  );
});

it("fails closed on malformed offline pin metadata", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  rawStore(factory, "offline_pins").set(`venue:${venueId}`, {
    ...pin(),
    preparedAt: "not-a-timestamp",
  });

  await expect(store.getOfflinePin("venue", venueId)).rejects.toThrow(
    "offline pin",
  );
});

it("does not partially write pin/package on local failure", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );
  factory.state.failure = "request";

  await expect(
    store.putOfflinePinWithCachedRecord(pin(), visitPackage()),
  ).rejects.toThrow("offline pin/cache transaction");

  expect(rawStore(factory, "offline_pins").size).toBe(0);
  expect(rawStore(factory, "cached_records").size).toBe(0);
});

it("rejects a non-visit package for an offline Venue pin", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  await expect(
    store.putOfflinePinWithCachedRecord(
      pin(),
      visitPackage("venue", venueId),
    ),
  ).rejects.toThrow("visit package target does not match");
});

it("rejects a visit package for another Venue", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );

  await expect(
    store.putOfflinePinWithCachedRecord(
      pin(),
      visitPackage("venue_visit_package", otherVenueId),
    ),
  ).rejects.toThrow("visit package target does not match");
});

it("rejects an incomplete persisted visit package before pinning", async () => {
  const factory = new FakeFactory();
  const store = await IndexedDbProjectStore.open(
    factory as unknown as IDBFactory,
    scope,
    "2.12-green",
  );
  const incomplete = {
    ...visitPackage(),
    payload: {
      venue: { id: venueId, name: "Venue offline fixture" },
      preparedAt: "2026-10-05T00:00:00.000Z",
      mediaPolicy: "thumbnails",
      packageRevision: 1,
    },
  } as CachedRecordEnvelope;

  await expect(
    store.putOfflinePinWithCachedRecord(pin(), incomplete),
  ).rejects.toThrow("Invalid persisted Venue visit package checklist");
  expect(rawStore(factory, "offline_pins").size).toBe(0);
  expect(rawStore(factory, "cached_records").size).toBe(0);
});

it.each([
  ["preparedAt", { preparedAt: "2026-10-05T00:01:00.000Z" }],
  ["mediaPolicy", { mediaPolicy: "none" }],
  ["packageRevision", { packageRevision: 2 }],
])(
  "rejects visit package %s that disagrees with the pin",
  async (_label, override) => {
    const factory = new FakeFactory();
    const store = await IndexedDbProjectStore.open(
      factory as unknown as IDBFactory,
      scope,
      "2.12-green",
    );
    const expected = visitPackage();
    const mismatched = {
      ...expected,
      payload: {
        ...(expected.payload as Record<string, unknown>),
        ...override,
      },
    } as CachedRecordEnvelope;

    await expect(
      store.putOfflinePinWithCachedRecord(pin(), mismatched),
    ).rejects.toThrow("metadata does not match");
    expect(rawStore(factory, "offline_pins").size).toBe(0);
    expect(rawStore(factory, "cached_records").size).toBe(0);
  },
);
