import { expect, it } from "vitest";
import {
  SupabaseVenueOfferAdapter,
  type SupabaseVenueOfferClientLike,
} from "./supabase-venue-offer-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const offerId = "33333333-3333-4333-8333-333333333333";
const componentId = "44444444-4444-4444-8444-444444444444";

type Result = { readonly data: unknown; readonly error: unknown };

function offerRow() {
  return {
    id: offerId,
    project_id: projectId,
    venue_id: venueId,
    name: "Quote",
    status: "draft",
    valid_from: null,
    valid_to: null,
    weekday: null,
    base_amount_minor: null,
    currency: "EUR",
    tax_mode: "unknown",
    tax_rate_basis_points: null,
    included_guest_count: null,
    extra_guest_amount_minor: null,
    deposit_amount_minor: null,
    deposit_refundable: null,
    security_deposit_minor: null,
    security_deposit_refundable: true,
    included_start_time: null,
    included_end_time: null,
    included_end_day_offset: 0,
    extra_hour_amount_minor: null,
    source_id: null,
    notes: null,
    revision: 1,
  };
}

function componentRow() {
  return {
    id: componentId,
    project_id: projectId,
    owner_type: "venue_offer",
    owner_id: offerId,
    label: "Room",
    component_type: "included",
    calculation_type: "fixed",
    unit_amount_minor: null,
    quantity: null,
    unit_label: null,
    currency: "EUR",
    tax_mode: "unknown",
    tax_rate_basis_points: null,
    notes: null,
    revision: 1,
  };
}

class QueryBuilder implements PromiseLike<Result> {
  constructor(private readonly result: Result) {}

  eq(): QueryBuilder {
    return this;
  }

  order(): PromiseLike<Result> {
    return Promise.resolve(this.result);
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

class FakeClient implements SupabaseVenueOfferClientLike {
  offerQueryResult: Result = { data: [offerRow()], error: null };
  componentQueryResult: Result = { data: [componentRow()], error: null };
  rpcResult: Result = { data: offerRow(), error: null };
  lastRpc: { name: string; args: Readonly<Record<string, unknown>> } | null =
    null;

  from(table: "venue_offers" | "offer_components") {
    const result =
      table === "venue_offers"
        ? this.offerQueryResult
        : this.componentQueryResult;
    return {
      select: () => new QueryBuilder(result),
    };
  }

  rpc(
    functionName:
      | "create_venue_offer"
      | "update_venue_offer_draft"
      | "transition_venue_offer_status"
      | "create_venue_offer_component"
      | "update_venue_offer_component"
      | "remove_venue_offer_component",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<Result> {
    this.lastRpc = { name: functionName, args };
    return Promise.resolve(this.rpcResult);
  }
}

const terms = {
  name: "Quote",
  validFrom: null,
  validTo: null,
  weekday: null,
  baseAmountMinor: null,
  currency: "EUR",
  taxMode: "unknown" as const,
  taxRateBasisPoints: null,
  includedGuestCount: null,
  extraGuestAmountMinor: null,
  depositAmountMinor: null,
  depositRefundable: null,
  securityDepositMinor: null,
  securityDepositRefundable: true,
  includedStartTime: null,
  includedEndTime: null,
  includedEndDayOffset: 0,
  extraHourAmountMinor: null,
  sourceId: null,
  notes: null,
};

const component = {
  label: "Room",
  componentType: "included" as const,
  calculationType: "fixed" as const,
  unitAmountMinor: null,
  quantity: null,
  unitLabel: null,
  currency: "EUR",
  taxMode: "unknown" as const,
  taxRateBasisPoints: null,
  notes: null,
};

it("lists project and Venue-bound offers", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueOfferAdapter(client);
  await expect(adapter.listVenueOffers(projectId, venueId)).resolves.toEqual([
    expect.objectContaining({ id: offerId, projectId, venueId }),
  ]);
  client.offerQueryResult = { data: null, error: null };
  await expect(adapter.listVenueOffers(projectId, venueId)).rejects.toThrow(
    "Venue offer query failed.",
  );
  client.offerQueryResult = { data: [], error: { message: "no" } };
  await expect(adapter.listVenueOffers(projectId, venueId)).rejects.toThrow(
    "Venue offer query failed.",
  );
});

it("lists project and offer-bound components", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueOfferAdapter(client);
  await expect(
    adapter.listVenueOfferComponents(projectId, offerId),
  ).resolves.toEqual([
    expect.objectContaining({ id: componentId, projectId, offerId }),
  ]);
  client.componentQueryResult = { data: null, error: null };
  await expect(
    adapter.listVenueOfferComponents(projectId, offerId),
  ).rejects.toThrow("Venue offer component query failed.");
});

it("creates offer and components atomically through one RPC", async () => {
  const client = new FakeClient();
  client.rpcResult = {
    data: { offer: offerRow(), components: [componentRow()] },
    error: null,
  };
  const adapter = new SupabaseVenueOfferAdapter(client);
  await expect(
    adapter.createVenueOffer({
      offerId,
      projectId,
      venueId,
      status: "draft",
      terms,
      components: [{ componentId, ...component }],
    }),
  ).resolves.toMatchObject({ offer: { id: offerId } });
  expect(client.lastRpc).toMatchObject({
    name: "create_venue_offer",
    args: {
      target_project_id: projectId,
      target_venue_id: venueId,
      target_offer_id: offerId,
      target_status: "draft",
      target_components: [
        expect.objectContaining({ id: componentId, label: "Room" }),
      ],
    },
  });
});

it("updates draft offer terms and transitions lifecycle", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueOfferAdapter(client);
  await expect(
    adapter.updateVenueOfferDraft({
      projectId,
      venueId,
      offerId,
      expectedRevision: 1,
      terms,
    }),
  ).resolves.toMatchObject({ id: offerId });
  expect(client.lastRpc).toMatchObject({
    name: "update_venue_offer_draft",
    args: { target_expected_revision: 1 },
  });

  client.rpcResult = {
    data: { ...offerRow(), status: "quoted" },
    error: null,
  };
  await expect(
    adapter.transitionVenueOffer({
      projectId,
      venueId,
      offerId,
      targetStatus: "quoted",
      expectedRevision: 1,
    }),
  ).resolves.toMatchObject({ status: "quoted" });
  expect(client.lastRpc).toMatchObject({
    name: "transition_venue_offer_status",
    args: { target_status: "quoted" },
  });
});

it("creates and updates draft components", async () => {
  const client = new FakeClient();
  client.rpcResult = { data: componentRow(), error: null };
  const adapter = new SupabaseVenueOfferAdapter(client);
  await expect(
    adapter.createVenueOfferComponent({
      projectId,
      offerId,
      componentId,
      expectedOfferRevision: 1,
      ...component,
    }),
  ).resolves.toMatchObject({ id: componentId });
  expect(client.lastRpc).toMatchObject({
    name: "create_venue_offer_component",
  });

  await expect(
    adapter.updateVenueOfferComponent({
      projectId,
      offerId,
      componentId,
      expectedOfferRevision: 1,
      expectedComponentRevision: 1,
      ...component,
    }),
  ).resolves.toMatchObject({ id: componentId });
  expect(client.lastRpc).toMatchObject({
    name: "update_venue_offer_component",
    args: { target_expected_component_revision: 1 },
  });
});

it("removes draft components only after validating receipt", async () => {
  const client = new FakeClient();
  client.rpcResult = {
    data: {
      project_id: projectId,
      offer_id: offerId,
      component_id: componentId,
      removed: true,
    },
    error: null,
  };
  const adapter = new SupabaseVenueOfferAdapter(client);
  await expect(
    adapter.removeVenueOfferComponent({
      projectId,
      offerId,
      componentId,
      expectedOfferRevision: 1,
      expectedComponentRevision: 1,
    }),
  ).resolves.toBeUndefined();
  expect(client.lastRpc).toMatchObject({
    name: "remove_venue_offer_component",
  });
});

it("fails all mutation methods closed on provider errors or malformed data", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueOfferAdapter(client);
  client.rpcResult = { data: null, error: { message: "backend" } };
  await expect(
    adapter.updateVenueOfferDraft({
      projectId,
      venueId,
      offerId,
      expectedRevision: 1,
      terms,
    }),
  ).rejects.toThrow("Venue offer update failed.");

  client.rpcResult = {
    data: { ...offerRow(), project_id: venueId },
    error: null,
  };
  await expect(
    adapter.transitionVenueOffer({
      projectId,
      venueId,
      offerId,
      targetStatus: "quoted",
      expectedRevision: 1,
    }),
  ).rejects.toThrow("Invalid venue commercial response.");

  client.rpcResult = {
    data: { ...componentRow(), owner_type: "vendor_offer" },
    error: null,
  };
  await expect(
    adapter.createVenueOfferComponent({
      projectId,
      offerId,
      componentId,
      expectedOfferRevision: 1,
      ...component,
    }),
  ).rejects.toThrow("Invalid venue commercial response.");

  await expect(
    adapter.updateVenueOfferComponent({
      projectId,
      offerId,
      componentId,
      expectedOfferRevision: 1,
      expectedComponentRevision: 1,
      ...component,
    }),
  ).rejects.toThrow("Invalid venue commercial response.");

  client.rpcResult = { data: { removed: false }, error: null };
  await expect(
    adapter.removeVenueOfferComponent({
      projectId,
      offerId,
      componentId,
      expectedOfferRevision: 1,
      expectedComponentRevision: 1,
    }),
  ).rejects.toThrow("Invalid venue commercial response.");
});
