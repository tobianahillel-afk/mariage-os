import { describe, expect, it } from "vitest";

import { normalizeInvitationEmail } from "./invitation-port";

describe("invitation application boundary", () => {
  it("normalizes intended identity deterministically", () => {
    expect(normalizeInvitationEmail("  Partner.Two@Example.Invalid  ")).toBe(
      "partner.two@example.invalid",
    );
  });
});
