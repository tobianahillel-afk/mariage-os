import { describe, expect, it } from "vitest";
import { parseVenueContactRow } from "./parse-venue-contact-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const contactId = "33333333-3333-4333-8333-333333333333";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: contactId,
    project_id: projectId,
    parent_type: "venue",
    parent_id: venueId,
    name: "Alice",
    role_label: null,
    email: "contact@example.invalid",
    phone: "+33123456789",
    preferred_channel: "phone",
    notes: null,
    revision: 1,
    ...overrides,
  };
}

describe("parseVenueContactRow", () => {
  it("parses a canonical same-project Venue contact", () => {
    expect(parseVenueContactRow(row(), projectId, venueId, contactId)).toEqual({
      id: contactId,
      projectId,
      parentType: "venue",
      venueId,
      name: "Alice",
      roleLabel: null,
      email: "contact@example.invalid",
      phone: "+33123456789",
      preferredChannel: "phone",
      notes: null,
      revision: 1,
    });
  });

  it("fails closed on provider identity, parent, canonicality and revision mismatches", () => {
    for (const invalid of [
      null,
      [],
      row({ id: "bad" }),
      row({ project_id: "44444444-4444-4444-8444-444444444444" }),
      row({ parent_type: "vendor" }),
      row({ parent_id: "44444444-4444-4444-8444-444444444444" }),
      row({ name: " Alice " }),
      row({ phone: "01 23 45 67 89" }),
      row({ notes: 3 }),
      row({ revision: 0 }),
    ]) {
      expect(() => parseVenueContactRow(invalid, projectId, venueId, contactId)).toThrow(
        "Invalid venue contact response.",
      );
    }
    expect(() =>
      parseVenueContactRow(row(), projectId, venueId, "55555555-5555-4555-8555-555555555555"),
    ).toThrow("Invalid venue contact response.");
  });
});
