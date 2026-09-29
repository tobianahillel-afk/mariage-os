import { describe, expect, it } from "vitest";
import storePortSource from "../../../application/local-data/local-project-store.ts?raw";
import indexedDbSource from "../indexeddb-project-store.ts?raw";

const coordinatorModules = import.meta.glob(
  "../../../application/venues/venue-local-sync-coordinator.ts",
  { eager: true, import: "default", query: "?raw" },
);

describe("WP-2.10 local cache/queue RED", () => {
  it("requires mutation replacement and acknowledgement removal primitives", () => {
    expect(storePortSource).toContain("putPendingMutation");
    expect(storePortSource).toContain("removePendingMutation");
    expect(indexedDbSource).toContain("async putPendingMutation");
    expect(indexedDbSource).toContain("async removePendingMutation");
  });

  it("requires project-scoped cached Venue listing", () => {
    expect(storePortSource).toContain("listCachedRecords");
    expect(indexedDbSource).toContain("async listCachedRecords");
  });

  it("requires the Venue-local replay coordinator", () => {
    expect(Object.keys(coordinatorModules)).toHaveLength(1);
  });
});
