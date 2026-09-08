import { describe, expect, it } from "vitest";
import {
  isCanonicalVenueContactPhone,
  normalizeVenueContact,
} from "./venue-contact";

describe("venue contact domain", () => {
  it("normalizes optional human details without inventing required fields", () => {
    expect(normalizeVenueContact({})).toEqual({
      ok: true,
      value: {
        name: null,
        roleLabel: null,
        email: null,
        phone: null,
        preferredChannel: null,
        notes: null,
      },
    });
    expect(
      normalizeVenueContact({
        name: "  Alice Martin  ",
        roleLabel: "  commerciale ",
        email: " contact@example.invalid ",
        phone: " +33123456789 ",
        preferredChannel: " phone ",
        notes: "  rappel devis  ",
      }),
    ).toEqual({
      ok: true,
      value: {
        name: "Alice Martin",
        roleLabel: "commerciale",
        email: "contact@example.invalid",
        phone: "+33123456789",
        preferredChannel: "phone",
        notes: "rappel devis",
      },
    });
    expect(normalizeVenueContact({ name: "  ", phone: "   " })).toMatchObject({
      ok: true,
      value: { name: null, phone: null },
    });
  });

  it("enforces the exact canonical international numeric phone grammar", () => {
    expect(isCanonicalVenueContactPhone("+12")).toBe(true);
    expect(isCanonicalVenueContactPhone("+123456789012345")).toBe(true);
    for (const value of [
      "+1",
      "+012",
      "+1234567890123456",
      "33123456789",
      "0033123456789",
      "+33 1 23 45 67 89",
      "+33-123456789",
      "+٣٣١٢٣٤٥٦٧٨٩",
      "+33\u0007123456789",
      33123456789,
    ]) {
      expect(isCanonicalVenueContactPhone(value)).toBe(false);
    }
    expect(normalizeVenueContact({ phone: "+1" })).toEqual({
      ok: false,
      error: "phone_invalid",
    });
    expect(normalizeVenueContact({ phone: 42 })).toEqual({
      ok: false,
      error: "phone_invalid",
    });
  });

  it("rejects wrong types, overlong values and invalid Unicode", () => {
    expect(normalizeVenueContact({ name: 3 })).toEqual({
      ok: false,
      error: "name_invalid",
    });
    expect(normalizeVenueContact({ roleLabel: "x".repeat(161) })).toEqual({
      ok: false,
      error: "role_label_invalid",
    });
    expect(normalizeVenueContact({ email: "x".repeat(321) })).toEqual({
      ok: false,
      error: "email_invalid",
    });
    expect(normalizeVenueContact({ preferredChannel: "x".repeat(81) })).toEqual(
      {
        ok: false,
        error: "preferred_channel_invalid",
      },
    );
    expect(normalizeVenueContact({ notes: "x".repeat(5_001) })).toEqual({
      ok: false,
      error: "notes_invalid",
    });
    expect(normalizeVenueContact({ name: "\ud800" })).toEqual({
      ok: false,
      error: "name_invalid",
    });
  });
});
