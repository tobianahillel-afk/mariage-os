import { expect, it, vi } from "vitest";
import type { VenueWorkspaceReadService } from "./venue-workspace-read-service";
import { loadVenueWorkspaceState } from "./venue-workspace-state";

const projectId = "81111111-1111-4111-8111-111111111111";
const venueId = "91111111-1111-4111-8111-111111111111";

function service() {
  return {
    list: vi.fn().mockResolvedValue([{ venue: { id: venueId } }]),
    detail: vi.fn().mockResolvedValue({ venue: { id: venueId } }),
  } as unknown as VenueWorkspaceReadService;
}

it("loads project-scoped collection state for Gallery and Compare", async () => {
  const read = service();

  const gallery = await loadVenueWorkspaceState(
    read,
    projectId,
    "/venues",
    null,
  );
  const compare = await loadVenueWorkspaceState(
    read,
    projectId,
    "/venues/compare",
    null,
  );

  expect(gallery.kind).toBe("gallery");
  expect(compare.kind).toBe("compare");
  expect(read.list).toHaveBeenCalledTimes(2);
  expect(read.list).toHaveBeenCalledWith(projectId, null);
});

it("loads one canonical detail and fails closed on unsupported Venue paths", async () => {
  const read = service();

  const detail = await loadVenueWorkspaceState(
    read,
    projectId,
    `/venues/${venueId}`,
    null,
  );
  const unavailable = await loadVenueWorkspaceState(
    read,
    projectId,
    "/venues/not-a-venue",
    null,
  );

  expect(detail.kind).toBe("detail");
  expect(read.detail).toHaveBeenCalledWith(projectId, venueId, null);
  expect(unavailable).toEqual({ kind: "unavailable" });
  expect(read.list).not.toHaveBeenCalled();
});
