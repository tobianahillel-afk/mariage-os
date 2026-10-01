import { describe, expect, it, vi } from "vitest";
import type { LocalProjectStore } from "@application/local-data/local-project-store";
import type {
  VenueWorkspaceItem,
  VenueWorkspaceReadPort,
} from "./venue-workspace-read-service";
import { readVenueWorkspaceState } from "./venue-workspace-state";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111111";
const item = {
  venue: { id: venueId, projectId },
} as unknown as VenueWorkspaceItem;
const local = {} as LocalProjectStore;

function reader(): VenueWorkspaceReadPort & {
  list: ReturnType<typeof vi.fn>;
  detail: ReturnType<typeof vi.fn>;
} {
  return {
    list: vi.fn().mockResolvedValue([item]),
    detail: vi.fn().mockResolvedValue(item),
  };
}

describe("readVenueWorkspaceState", () => {
  it("does not read providers for unavailable paths or absent composition", async () => {
    const read = reader();
    await expect(
      readVenueWorkspaceState(read, projectId, "/venues/not-valid", local),
    ).resolves.toEqual({ kind: "unavailable" });
    await expect(
      readVenueWorkspaceState(null, projectId, "/venues", local),
    ).resolves.toEqual({ kind: "unavailable" });
    expect(read.list).not.toHaveBeenCalled();
    expect(read.detail).not.toHaveBeenCalled();
  });

  it("loads collection and compare states through the list boundary", async () => {
    const read = reader();
    await expect(
      readVenueWorkspaceState(read, projectId, "/venues", local),
    ).resolves.toEqual({ kind: "collection", items: [item] });
    await expect(
      readVenueWorkspaceState(read, projectId, "/venues/compare", local),
    ).resolves.toEqual({ kind: "compare", items: [item] });
    expect(read.list).toHaveBeenNthCalledWith(1, projectId, local);
    expect(read.list).toHaveBeenNthCalledWith(2, projectId, local);
  });

  it("loads detail and hides missing identities", async () => {
    const read = reader();
    await expect(
      readVenueWorkspaceState(read, projectId, `/venues/${venueId}`, local),
    ).resolves.toEqual({ kind: "detail", item });
    read.detail.mockResolvedValueOnce(null);
    await expect(
      readVenueWorkspaceState(read, projectId, `/venues/${venueId}`, local),
    ).resolves.toEqual({ kind: "unavailable" });
  });

  it("fails closed when the read boundary rejects", async () => {
    const read = reader();
    read.list.mockRejectedValueOnce(new Error("provider unavailable"));
    await expect(
      readVenueWorkspaceState(read, projectId, "/venues", local),
    ).resolves.toEqual({ kind: "unavailable" });
  });
});
