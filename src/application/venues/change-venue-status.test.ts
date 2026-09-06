import { describe, expect, it } from "vitest";
import type {
  VenueCommandPort,
  VenueTransitionInput,
} from "./venue-command-port";
import { changeVenueStatus } from "./change-venue-status";

function commandPort(
  transitionVenue: VenueCommandPort["transitionVenue"],
): VenueCommandPort {
  return {
    async createVenue() {
      throw new Error("not used");
    },
    transitionVenue,
  };
}

function transitionDraft(status: "shortlist" | "rejected") {
  return {
    projectId: "project-a",
    venueId: "venue-a",
    status,
    rejectionReason: status === "rejected" ? "  too small  " : null,
    operationId: status === "shortlist" ? "operation-a" : null,
  } as const;
}

describe("changeVenueStatus successful persistence", () => {
  it("sends a validated lifecycle transition to persistence", async () => {
    const calls: VenueTransitionInput[] = [];
    const port = commandPort(async (input) => {
      calls.push(input);
      return 4;
    });

    const result = await changeVenueStatus(port, transitionDraft("shortlist"));

    expect(result).toEqual({ ok: true, revision: 4 });
    expect(calls[0]).toEqual({
      projectId: "project-a",
      venueId: "venue-a",
      status: "shortlist",
      rejectionReason: null,
      operationId: "operation-a",
    });
  });

  it("normalizes rejection reason before persistence", async () => {
    const calls: VenueTransitionInput[] = [];
    const port = commandPort(async (input) => {
      calls.push(input);
      return 5;
    });

    await changeVenueStatus(port, transitionDraft("rejected"));

    expect(calls[0]?.rejectionReason).toBe("too small");
  });
});

describe("changeVenueStatus failure handling", () => {
  it("fails validation before persistence", async () => {
    let calls = 0;
    const port = commandPort(async () => {
      calls += 1;
      return 1;
    });

    const result = await changeVenueStatus(port, {
      projectId: "project-a",
      venueId: "venue-a",
      status: "rejected",
      rejectionReason: null,
      operationId: null,
    });

    expect(result).toEqual({ ok: false, error: "rejection_reason_required" });
    expect(calls).toBe(0);
  });

  it("converts persistence failure into a stable application error", async () => {
    const port = commandPort(async () => {
      throw new Error("provider detail");
    });

    const result = await changeVenueStatus(port, transitionDraft("shortlist"));

    expect(result).toEqual({ ok: false, error: "persistence_failed" });
  });
});
