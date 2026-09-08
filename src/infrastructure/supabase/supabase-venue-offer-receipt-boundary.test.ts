import { expect, it } from "vitest";
import {
  SupabaseVenueOfferAdapter,
  type SupabaseVenueOfferClientLike,
} from "./supabase-venue-offer-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const offerId = "33333333-3333-4333-8333-333333333333";
const componentId = "44444444-4444-4444-8444-444444444444";
const substitutedComponentId = "55555555-5555-4555-8555-555555555555";
const sourceId = "66666666-6666-4666-8666-666666666666";
const substitutedSourceId = "77777777-7777-4777-8777-777777777777";

type Result = { readonly data: unknown; readonly error: unknown };

function offerRow(status = "draft", rowSourceId: string | null = null) {
  return {
    id: offerId,
    project_id: projectId,
    venue_id: venueId,
    name: "Quote",
    status,
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
    source_id: rowSourceId,
    notes: null,
    revision: 1,
  };
}

function componentRow(id = componentId) {
  return {
    id,
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
  eq(): QueryBuilder {
    return this;
  }

  order(): PromiseLike<Result> {
    return Promise.resolve({ data: [], error: null });
  }

  then<TResult1 = Result, TResult2 = never>(
    onfulfilled?: ((value: Result) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve({ data: [], error: null }).then(
      onfulfilled,
      onrejected,
    );
  }
}

class FakeClient implements SupabaseVenueOfferClientLike {
  rpcResult: Result = { data: offerRow(), error: null };

  from() {
    return { select: () => new QueryBuilder() };
  }

  rpc(): PromiseLike<Result> {
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
  componentId,
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

function createInput(status: "draft" | "quoted" = "draft") {
  return {
    offerId,
    projectId,
    venueId,
    status,
    terms,
    components: [component],
  } as const;
}

it("rejects substituted or omitted component identities in atomic create receipts", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueOfferAdapter(client);

  client.rpcResult = {
    data: {
      offer: offerRow(),
      components: [componentRow(substitutedComponentId)],
    },
    error: null,
  };
  await expect(adapter.createVenueOffer(createInput())).rejects.toThrow(
    "Invalid venue commercial response.",
  );

  client.rpcResult = {
    data: { offer: offerRow(), components: [] },
    error: null,
  };
  await expect(adapter.createVenueOffer(createInput())).rejects.toThrow(
    "Invalid venue commercial response.",
  );
});

it("rejects mutation receipts whose lifecycle status contradicts the command", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueOfferAdapter(client);

  client.rpcResult = {
    data: { offer: offerRow("draft"), components: [componentRow()] },
    error: null,
  };
  await expect(adapter.createVenueOffer(createInput("quoted"))).rejects.toThrow(
    "Invalid venue commercial response.",
  );

  client.rpcResult = { data: offerRow("accepted"), error: null };
  await expect(
    adapter.transitionVenueOffer({
      projectId,
      venueId,
      offerId,
      targetStatus: "quoted",
      expectedRevision: 1,
    }),
  ).rejects.toThrow("Invalid venue commercial response.");

  client.rpcResult = { data: offerRow("quoted"), error: null };
  await expect(
    adapter.updateVenueOfferDraft({
      projectId,
      venueId,
      offerId,
      expectedRevision: 1,
      terms,
    }),
  ).rejects.toThrow("Invalid venue commercial response.");
});

it("rejects create and update receipts with substituted source identity", async () => {
  const client = new FakeClient();
  const adapter = new SupabaseVenueOfferAdapter(client);
  const sourcedTerms = { ...terms, sourceId };

  client.rpcResult = {
    data: {
      offer: offerRow("draft", substitutedSourceId),
      components: [componentRow()],
    },
    error: null,
  };
  await expect(
    adapter.createVenueOffer({
      ...createInput(),
      terms: sourcedTerms,
    }),
  ).rejects.toThrow("Invalid venue commercial response.");

  client.rpcResult = {
    data: offerRow("draft", substitutedSourceId),
    error: null,
  };
  await expect(
    adapter.updateVenueOfferDraft({
      projectId,
      venueId,
      offerId,
      expectedRevision: 1,
      terms: sourcedTerms,
    }),
  ).rejects.toThrow("Invalid venue commercial response.");
});
