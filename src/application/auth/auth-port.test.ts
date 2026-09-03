import { describe, expect, it } from "vitest";

import { requireVerifiedIdentity, type AuthSessionState } from "./auth-port";

describe("requireVerifiedIdentity", () => {
  it("returns the verified user id", () => {
    const session: AuthSessionState = {
      kind: "authenticated_verified",
      userId: "user-1",
      email: "owner@example.invalid",
      assurance: "aal1",
    };

    expect(requireVerifiedIdentity(session)).toBe("user-1");
  });

  it("fails closed for a non-verified session", () => {
    expect(() => requireVerifiedIdentity({ kind: "signed_out" })).toThrow(
      "A verified authenticated identity is required.",
    );
  });
});
