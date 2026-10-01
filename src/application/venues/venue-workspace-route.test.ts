import { describe, expect, it } from "vitest";
import { parseVenueWorkspaceRoute } from "./venue-workspace-route";

describe("parseVenueWorkspaceRoute", () => {
  it("uses Gallery as the canonical collection default", () => {
    expect(parseVenueWorkspaceRoute("/venues")).toEqual({ kind: "gallery" });
  });

  it("recognizes the canonical comparison route", () => {
    expect(parseVenueWorkspaceRoute("/venues/compare")).toEqual({
      kind: "compare",
    });
  });

  it("recognizes only canonical UUID detail routes", () => {
    expect(
      parseVenueWorkspaceRoute("/venues/91111111-1111-4111-8111-111111111111"),
    ).toEqual({
      kind: "detail",
      venueId: "91111111-1111-4111-8111-111111111111",
    });
    expect(parseVenueWorkspaceRoute("/venues/not-a-venue")).toEqual({
      kind: "unavailable",
    });
  });

  it("does not implement the downstream visit route", () => {
    expect(
      parseVenueWorkspaceRoute(
        "/venues/91111111-1111-4111-8111-111111111111/visit",
      ),
    ).toEqual({ kind: "unavailable" });
  });
});
