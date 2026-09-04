import { describe, expect, it } from "vitest";
import {
  parseAppRoute,
  protectedRoutePath,
  safeProtectedReturnPath,
} from "./app-route";

const projectId = "81111111-1111-4111-8111-111111111111";

describe("app route classification", () => {
  it.each([
    ["/", { kind: "landing" }],
    ["/login", { kind: "login" }],
    ["/onboarding", { kind: "onboarding" }],
    ["/invite/opaque-capability", { kind: "invite" }],
    ["/rsvp/opaque-capability", { kind: "public_rsvp" }],
  ])("classifies %s without retaining capability material", (path, expected) => {
    expect(parseAppRoute(path)).toEqual(expected);
  });

  it("keeps explicit project context for protected deep links", () => {
    const route = parseAppRoute(`/app/p/${projectId}/venues/example`);

    expect(route).toEqual({
      kind: "protected_project",
      projectId,
      projectPath: "/venues/example",
    });

    if (route.kind !== "protected_project") {
      throw new Error("Expected a protected project route.");
    }

    expect(protectedRoutePath(route)).toBe(
      `/app/p/${projectId}/venues/example`,
    );
  });

  it.each([
    "/app/p/not-a-uuid/dashboard",
    `/app/p/${projectId}`,
    "/rsvp/one/two",
    "/invite",
    "/unknown",
  ])("fails closed for malformed route %s", (path) => {
    expect(parseAppRoute(path)).toEqual({ kind: "not_found" });
  });
});

describe("safe protected return paths", () => {
  it("accepts only canonical local protected project routes", () => {
    const path = `/app/p/${projectId}/dashboard`;
    expect(safeProtectedReturnPath(path)).toBe(path);
  });

  it.each([
    null,
    "https://example.invalid/app/p/81111111-1111-4111-8111-111111111111/dashboard",
    "//example.invalid/app/p/81111111-1111-4111-8111-111111111111/dashboard",
    `/app/p/${projectId}/dashboard?next=https://example.invalid`,
    `/app/p/${projectId}/dashboard#private-fragment`,
    "/rsvp/opaque-capability",
    "/login",
  ])("rejects unsafe or non-protected candidate %s", (candidate) => {
    expect(safeProtectedReturnPath(candidate)).toBeNull();
  });
});
