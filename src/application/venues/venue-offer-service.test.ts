import { describe, expect, it, vi } from "vitest";
import type {
  CreateVenueOfferInput,
  RemoveVenueOfferComponentInput,
  TransitionVenueOfferInput,
  UpdateVenueOfferInput,
  VenueOfferAggregateRecord,
  VenueOfferComponentMutationInput,
  VenueOfferComponentRecord,
  VenueOfferPort,
  VenueOfferRecord,
} from "./venue-offer-service";
import {
  createVenueOffer,
  createVenueOfferComponent,
  removeVenueOfferComponent,
  transitionVenueOffer,
  updateVenueOfferComponent,
  updateVenueOfferDraft,
} from "./venue-offer-service";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const offerId = "33333333-3333-4333-8333-333333333333";
const componentId = "44444444-4444-4444-8444-444444444444";

function offerRecord(
  status: VenueOfferRecord["status"] = "draft",
): VenueOfferRecord {
  return {
    id: offerId,
    projectId,
    venueId,
    status,
    revision: 1,
    name: "Quote",
    validFrom: null,
    validTo: null,
    weekday: null,
    baseAmountMinor: null,
    currency: "EUR",
    taxMode: "unknown",
    taxRateBasisPoints: null,
    includedGuestCount: null,
    extraGuestAmountMinor: null,
    depositAmountMinor: null,
    depositRefundable: null,
    securityDepositMinor: null,
    securityDepositRefundable: null,
    includedStartTime: null,
    includedEndTime: null,
    includedEndDayOffset: 0,
    extraHourAmountMinor: null,
    sourceId: null,
    notes: null,
  };
}

function componentRecord(): VenueOfferComponentRecord {
  return {
    id: componentId,
    projectId,
    ownerType: "venue_offer",
    offerId,
    revision: 1,
    label: "Room",
    componentType: "included",
    calculationType: "fixed",
    unitAmountMinor: null,
    quantity: null,
    unitLabel: null,
    currency: "EUR",
    taxMode: "unknown",
    taxRateBasisPoints: null,
    notes: null,
  };
}

class FakeVenueOfferPort implements VenueOfferPort {
  readonly listVenueOffers = vi.fn(
    async (): Promise<readonly VenueOfferRecord[]> => [offerRecord()],
  );
  readonly listVenueOfferComponents = vi.fn(
    async (): Promise<readonly VenueOfferComponentRecord[]> => [
      componentRecord(),
    ],
  );
  readonly createVenueOffer = vi.fn(
    async (
      _input: CreateVenueOfferInput,
    ): Promise<VenueOfferAggregateRecord> => ({
      offer: offerRecord(),
      components: [componentRecord()],
    }),
  );
  readonly updateVenueOfferDraft = vi.fn(
    async (_input: UpdateVenueOfferInput): Promise<VenueOfferRecord> =>
      offerRecord(),
  );
  readonly transitionVenueOffer = vi.fn(
    async (input: TransitionVenueOfferInput): Promise<VenueOfferRecord> =>
      offerRecord(input.targetStatus as VenueOfferRecord["status"]),
  );
  readonly createVenueOfferComponent = vi.fn(
    async (
      _input: VenueOfferComponentMutationInput,
    ): Promise<VenueOfferComponentRecord> => componentRecord(),
  );
  readonly updateVenueOfferComponent = vi.fn(
    async (
      _input: VenueOfferComponentMutationInput,
    ): Promise<VenueOfferComponentRecord> => componentRecord(),
  );
  readonly removeVenueOfferComponent = vi.fn(
    async (_input: RemoveVenueOfferComponentInput): Promise<void> => undefined,
  );
}

function validCreate() {
  return {
    offerId,
    projectId,
    venueId,
    status: "draft",
    name: "Quote",
    components: [
      {
        componentId,
        label: "Room",
        componentType: "included",
        calculationType: "fixed",
      },
    ],
  } as const;
}

function validComponent() {
  return {
    projectId,
    offerId,
    componentId,
    expectedOfferRevision: 1,
    label: "Room",
    componentType: "included",
    calculationType: "fixed",
  } as const;
}

describe("venue offer application service", () => {
  it("creates an atomic normalized offer aggregate", async () => {
    const port = new FakeVenueOfferPort();
    const result = await createVenueOffer(port, validCreate());
    expect(result.ok).toBe(true);
    expect(port.createVenueOffer).toHaveBeenCalledWith({
      offerId,
      projectId,
      venueId,
      status: "draft",
      terms: expect.objectContaining({ name: "Quote", currency: "EUR" }),
      components: [
        expect.objectContaining({
          componentId,
          label: "Room",
          currency: "EUR",
        }),
      ],
    });
  });

  it("rejects invalid offer and component creation inputs", async () => {
    const port = new FakeVenueOfferPort();
    await expect(
      createVenueOffer(port, { ...validCreate(), projectId: "bad" }),
    ).resolves.toEqual({ ok: false, error: "identity_invalid" });
    await expect(
      createVenueOffer(port, { ...validCreate(), name: "" }),
    ).resolves.toEqual({ ok: false, error: "name_required_or_too_long" });
    await expect(
      createVenueOffer(port, {
        ...validCreate(),
        components: [{ ...validCreate().components[0], componentId: "bad" }],
      }),
    ).resolves.toEqual({ ok: false, error: "identity_invalid" });
    await expect(
      createVenueOffer(port, {
        ...validCreate(),
        components: [validCreate().components[0], validCreate().components[0]],
      }),
    ).resolves.toEqual({ ok: false, error: "duplicate_component_id" });
    await expect(
      createVenueOffer(port, {
        ...validCreate(),
        components: [{ ...validCreate().components[0], label: "" }],
      }),
    ).resolves.toEqual({ ok: false, error: "label_required_or_too_long" });
  });

  it("supports creation without components and maps persistence failures", async () => {
    const port = new FakeVenueOfferPort();
    const noComponents = {
      offerId,
      projectId,
      venueId,
      status: "draft",
      name: "Quote",
    } as const;
    expect((await createVenueOffer(port, noComponents)).ok).toBe(true);
    expect(port.createVenueOffer).toHaveBeenLastCalledWith(
      expect.objectContaining({ components: [] }),
    );

    port.createVenueOffer.mockRejectedValueOnce(new Error("backend"));
    await expect(createVenueOffer(port, validCreate())).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });

  it("updates only valid expected-revision draft terms", async () => {
    const port = new FakeVenueOfferPort();
    const input = {
      projectId,
      venueId,
      offerId,
      expectedRevision: 2,
      name: "  Updated  ",
    } as const;
    expect((await updateVenueOfferDraft(port, input)).ok).toBe(true);
    expect(port.updateVenueOfferDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
        venueId,
        offerId,
        expectedRevision: 2,
        terms: expect.objectContaining({ name: "Updated" }),
      }),
    );
    await expect(
      updateVenueOfferDraft(port, { ...input, offerId: "bad" }),
    ).resolves.toEqual({ ok: false, error: "identity_invalid" });
    await expect(
      updateVenueOfferDraft(port, { ...input, expectedRevision: 0 }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    await expect(
      updateVenueOfferDraft(port, { ...input, name: "" }),
    ).resolves.toEqual({ ok: false, error: "name_required_or_too_long" });
    port.updateVenueOfferDraft.mockRejectedValueOnce(new Error("backend"));
    await expect(updateVenueOfferDraft(port, input)).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });

  it("validates lifecycle transition identity, revision and target", async () => {
    const port = new FakeVenueOfferPort();
    const input = {
      projectId,
      venueId,
      offerId,
      targetStatus: "quoted",
      expectedRevision: 1,
    } as const;
    expect((await transitionVenueOffer(port, input)).ok).toBe(true);
    await expect(
      transitionVenueOffer(port, { ...input, venueId: "bad" }),
    ).resolves.toEqual({ ok: false, error: "identity_invalid" });
    await expect(
      transitionVenueOffer(port, { ...input, expectedRevision: 0 }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    await expect(
      transitionVenueOffer(port, { ...input, targetStatus: "draft" }),
    ).resolves.toEqual({ ok: false, error: "transition_target_invalid" });
    await expect(
      transitionVenueOffer(port, { ...input, targetStatus: "pending" }),
    ).resolves.toEqual({ ok: false, error: "transition_target_invalid" });
    port.transitionVenueOffer.mockRejectedValueOnce(new Error("backend"));
    await expect(transitionVenueOffer(port, input)).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });

  it("creates normalized draft components with parent revision protection", async () => {
    const port = new FakeVenueOfferPort();
    expect((await createVenueOfferComponent(port, validComponent())).ok).toBe(
      true,
    );
    expect(port.createVenueOfferComponent).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
        offerId,
        componentId,
        expectedOfferRevision: 1,
        label: "Room",
      }),
    );
    await expect(
      createVenueOfferComponent(port, {
        ...validComponent(),
        componentId: "bad",
      }),
    ).resolves.toEqual({ ok: false, error: "identity_invalid" });
    await expect(
      createVenueOfferComponent(port, {
        ...validComponent(),
        expectedOfferRevision: 0,
      }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    await expect(
      createVenueOfferComponent(port, { ...validComponent(), label: "" }),
    ).resolves.toEqual({ ok: false, error: "label_required_or_too_long" });
    port.createVenueOfferComponent.mockRejectedValueOnce(new Error("backend"));
    await expect(
      createVenueOfferComponent(port, validComponent()),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });

  it("updates draft components with parent and component revisions", async () => {
    const port = new FakeVenueOfferPort();
    const input = { ...validComponent(), expectedComponentRevision: 2 };
    expect((await updateVenueOfferComponent(port, input)).ok).toBe(true);
    expect(port.updateVenueOfferComponent).toHaveBeenCalledWith(
      expect.objectContaining({ expectedComponentRevision: 2 }),
    );
    await expect(
      updateVenueOfferComponent(port, {
        ...input,
        expectedComponentRevision: 0,
      }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    await expect(
      updateVenueOfferComponent(port, { ...input, projectId: "bad" }),
    ).resolves.toEqual({ ok: false, error: "identity_invalid" });
    await expect(
      updateVenueOfferComponent(port, { ...input, label: "" }),
    ).resolves.toEqual({ ok: false, error: "label_required_or_too_long" });
    port.updateVenueOfferComponent.mockRejectedValueOnce(new Error("backend"));
    await expect(updateVenueOfferComponent(port, input)).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });

  it("removes only revision-protected draft components", async () => {
    const port = new FakeVenueOfferPort();
    const input = {
      projectId,
      offerId,
      componentId,
      expectedOfferRevision: 1,
      expectedComponentRevision: 1,
    } as const;
    await expect(removeVenueOfferComponent(port, input)).resolves.toEqual({
      ok: true,
      value: undefined,
    });
    await expect(
      removeVenueOfferComponent(port, { ...input, offerId: "bad" }),
    ).resolves.toEqual({ ok: false, error: "identity_invalid" });
    await expect(
      removeVenueOfferComponent(port, { ...input, expectedOfferRevision: 0 }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    await expect(
      removeVenueOfferComponent(port, {
        ...input,
        expectedComponentRevision: 0,
      }),
    ).resolves.toEqual({ ok: false, error: "expected_revision_invalid" });
    port.removeVenueOfferComponent.mockRejectedValueOnce(new Error("backend"));
    await expect(removeVenueOfferComponent(port, input)).resolves.toEqual({
      ok: false,
      error: "persistence_failed",
    });
  });
});
