import { describe, expect, it, vi } from "vitest";
import { VenueContactPersistenceError } from "./venue-contact-persistence-error";
import {
  VenueContactService,
  type SaveVenueContactInput,
  type VenueContactPort,
} from "./venue-contact-service";
import type { VenueContactRecord } from "@domain/venues/venue-contact";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const contactId = "33333333-3333-4333-8333-333333333333";

const record: VenueContactRecord = {
  id: contactId,
  projectId,
  parentType: "venue",
  venueId,
  name: "Alice",
  roleLabel: null,
  email: null,
  phone: "+33123456789",
  preferredChannel: null,
  notes: null,
  revision: 1,
};

function port(overrides: Partial<VenueContactPort> = {}): VenueContactPort {
  return {
    saveVenueContact: vi.fn(async (_input: SaveVenueContactInput) => record),
    listVenueContacts: vi.fn(async () => [record]),
    ...overrides,
  };
}

describe("VenueContactService", () => {
  it("normalizes and saves create/update through one command family", async () => {
    const target = port();
    const service = new VenueContactService(target);
    expect(
      await service.saveVenueContact({
        projectId,
        venueId,
        contactId,
        name: " Alice ",
        phone: " +33123456789 ",
      }),
    ).toEqual({ ok: true, value: record });
    expect(target.saveVenueContact).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
        venueId,
        contactId,
        expectedRevision: null,
        name: "Alice",
        phone: "+33123456789",
      }),
    );

    await service.saveVenueContact({
      projectId,
      venueId,
      contactId,
      expectedRevision: 4,
      name: "Alice",
    });
    expect(target.saveVenueContact).toHaveBeenLastCalledWith(
      expect.objectContaining({ expectedRevision: 4 }),
    );
  });

  it("rejects invalid identities, revisions and fields before persistence", async () => {
    const target = port();
    const service = new VenueContactService(target);
    expect(
      await service.saveVenueContact({ projectId: "bad", venueId, contactId }),
    ).toEqual({ ok: false, error: "invalid_identity" });
    expect(
      await service.saveVenueContact({ projectId, venueId: "bad", contactId }),
    ).toEqual({ ok: false, error: "invalid_identity" });
    expect(
      await service.saveVenueContact({ projectId, venueId, contactId: "bad" }),
    ).toEqual({ ok: false, error: "invalid_identity" });
    expect(
      await service.saveVenueContact({
        projectId,
        venueId,
        contactId,
        expectedRevision: 0,
      }),
    ).toEqual({ ok: false, error: "expected_revision_invalid" });
    expect(
      await service.saveVenueContact({
        projectId,
        venueId,
        contactId,
        expectedRevision: "1",
      }),
    ).toEqual({ ok: false, error: "expected_revision_invalid" });
    expect(
      await service.saveVenueContact({
        projectId,
        venueId,
        contactId,
        phone: "01 23 45 67 89",
      }),
    ).toEqual({ ok: false, error: "phone_invalid" });
    expect(target.saveVenueContact).not.toHaveBeenCalled();
  });

  it("maps typed conflicts separately from generic persistence failures", async () => {
    const conflictService = new VenueContactService(
      port({
        saveVenueContact: vi.fn(async () => {
          throw new VenueContactPersistenceError("conflict", "conflict");
        }),
      }),
    );
    expect(
      await conflictService.saveVenueContact({ projectId, venueId, contactId }),
    ).toEqual({ ok: false, error: "conflict" });

    const failedService = new VenueContactService(
      port({ saveVenueContact: vi.fn(async () => Promise.reject(new Error("x"))) }),
    );
    expect(
      await failedService.saveVenueContact({ projectId, venueId, contactId }),
    ).toEqual({ ok: false, error: "persistence_failed" });
  });

  it("lists only through validated project/Venue identities", async () => {
    const target = port();
    const service = new VenueContactService(target);
    expect(await service.listVenueContacts(projectId, venueId)).toEqual({
      ok: true,
      value: [record],
    });
    expect(await service.listVenueContacts("bad", venueId)).toEqual({
      ok: false,
      error: "invalid_identity",
    });
    const failed = new VenueContactService(
      port({ listVenueContacts: vi.fn(async () => Promise.reject(new Error("x"))) }),
    );
    expect(await failed.listVenueContacts(projectId, venueId)).toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });
});
