import { describe, expect, it } from "vitest";
import localStoreSource from "../../../src/application/local-data/local-project-store.ts?raw";
import indexedDbSource from "../../../src/infrastructure/indexeddb/indexeddb-project-store.ts?raw";

const syncModules = import.meta.glob(
  "../../../src/application/venues/venue-local-sync-service.ts",
  { eager: true, import: "default", query: "?raw" },
);

describe("WP-2.10 RED local durability contract", () => {
  it("adds the local mutation lifecycle operations required for ack/retry", () => {
    expect(localStoreSource).toContain("putPendingMutation");
    expect(localStoreSource).toContain("removePendingMutation");
    expect(localStoreSource).toContain("listCachedRecords");
    expect(indexedDbSource).toContain("putPendingMutation");
    expect(indexedDbSource).toContain("removePendingMutation");
    expect(indexedDbSource).toContain("listCachedRecords");
  });

  it("introduces the Venue-local offline/sync coordinator", () => {
    expect(Object.keys(syncModules)).toHaveLength(1);
  });
});
