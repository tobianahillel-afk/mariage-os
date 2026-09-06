import { describe, expect, it } from "vitest";
import {
  createVenueSpace,
  updateVenueSpace,
  type CreateVenueSpaceInput,
  type UpdateVenueSpaceInput,
  type VenueSpacePort,
  type VenueSpaceRecord,
} from "./venue-space-service";

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const venueId = "a1000000-0000-4000-8000-000000000001";
const spaceId = "a2000000-0000-4000-8000-000000000001";

const record: VenueSpaceRecord = {
  id: spaceId,
  projectId,
  venueId,
  name: "Orangerie",
  spaceType: "reception_room",
  indoor: true,
  areaM2: 300,
  lengthM: 20,
  widthM: 15,
  heightM: 4,
  capacitySeated: 180,
  capacityCocktail: 240,
  sortOrder: 1,
  notes: null,
  revision: 1,
};

interface Captures {
  create: CreateVenueSpaceInput | null;
  update: UpdateVenueSpaceInput | null;
}

function portWith(
  captures: Captures,
  options: { readonly failCreate?: boolean; readonly failUpdate?: boolean } = {},
): VenueSpacePort {
  return {
    async listVenueSpaces() {
      return [record];
    },
    async createVenueSpace(input) {
      captures.create = input;
      if (options.failCreate === true) throw new Error("provider detail");
      return record;
    },
    async updateVenueSpace(input) {
      captures.update = input;
      if (options.failUpdate === true) throw new Error("provider detail");
      return { ...record, name: input.name, revision: input.expectedRevision + 1 };
    },
  };
}

const validDraft = {
  projectId,
  venueId,
  name: "  Orangerie  ",
  spaceType: " reception_room ",
  indoor: true,
  capacitySeated: 180,
};

describe("createVenueSpace", () => {
  it("normalizes and forwards safe physical-space input", async () => {
    const captures: Captures = { create: null, update: null };
    const result = await createVenueSpace(portWith(captures), validDraft);

    expect(result).toEqual({ ok: true, space: record });
    expect(captures.create).toMatchObject({
      projectId,
      venueId,
      name: "Orangerie",
      spaceType: "reception_room",
      capacitySeated: 180,
      capacityCocktail: null,
      sortOrder: 0,
    });
  });

  it("returns validation errors before persistence", async () => {
    const captures: Captures = { create: null, update: null };
    const result = await createVenueSpace(portWith(captures), {
      ...validDraft,
      name: "   ",
    });

    expect(result).toEqual({ ok: false, error: "name_required" });
    expect(captures.create).toBeNull();
  });

  it("hides provider details behind persistence_failed", async () => {
    const captures: Captures = { create: null, update: null };
    await expect(
      createVenueSpace(portWith(captures, { failCreate: true }), validDraft),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});

describe("updateVenueSpace", () => {
  it("uses optimistic revision and normalized fields", async () => {
    const captures: Captures = { create: null, update: null };
    const result = await updateVenueSpace(portWith(captures), {
      ...validDraft,
      spaceId,
      expectedRevision: 1,
      name: "  Main room  ",
    });

    expect(result.ok && result.space.name).toBe("Main room");
    expect(captures.update).toMatchObject({
      projectId,
      venueId,
      spaceId,
      expectedRevision: 1,
      name: "Main room",
    });
  });

  it("returns domain validation before revision validation", async () => {
    const captures: Captures = { create: null, update: null };
    const result = await updateVenueSpace(portWith(captures), {
      ...validDraft,
      spaceId,
      expectedRevision: 0,
      name: " ",
    });

    expect(result).toEqual({ ok: false, error: "name_required" });
    expect(captures.update).toBeNull();
  });

  it("rejects invalid expected revision before persistence", async () => {
    const captures: Captures = { create: null, update: null };
    const result = await updateVenueSpace(portWith(captures), {
      ...validDraft,
      spaceId,
      expectedRevision: 0,
    });

    expect(result).toEqual({ ok: false, error: "expected_revision_invalid" });
    expect(captures.update).toBeNull();
  });

  it("hides provider failures", async () => {
    const captures: Captures = { create: null, update: null };
    await expect(
      updateVenueSpace(portWith(captures, { failUpdate: true }), {
        ...validDraft,
        spaceId,
        expectedRevision: 1,
      }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});
