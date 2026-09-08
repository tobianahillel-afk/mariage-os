import { describe, expect, it } from "vitest";
import {
  parseVenueOfferAggregate,
  parseVenueOfferComponentRow,
  parseVenueOfferRemovalReceipt,
  parseVenueOfferRow,
} from "./parse-venue-offer-row";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const offerId = "33333333-3333-4333-8333-333333333333";
const componentId = "44444444-4444-4444-8444-444444444444";
const sourceId = "55555555-5555-4555-8555-555555555555";

function offerRow(overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  };
}

function componentRow(overrides: Record<string, unknown> = {}) {
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
    ...overrides,
  };
}

function expectOfferFailure(overrides: Record<string, unknown>): void {
  expect(() =>
    parseVenueOfferRow(offerRow(overrides), projectId, venueId, offerId),
  ).toThrow("Invalid venue commercial response.");
}

function expectComponentFailure(overrides: Record<string, unknown>): void {
  expect(() =>
    parseVenueOfferComponentRow(
      componentRow(overrides),
      projectId,
      offerId,
      componentId,
    ),
  ).toThrow("Invalid venue commercial response.");
}

describe("venue commercial provider parsing", () => {
  it("parses canonical offer rows and provider time seconds", () => {
    expect(
      parseVenueOfferRow(
        offerRow({
          status: "quoted",
          valid_from: "2026-10-01",
          valid_to: "2026-10-31",
          weekday: 6,
          base_amount_minor: 100_000,
          tax_mode: "included",
          tax_rate_basis_points: 2_000,
          included_guest_count: 150,
          extra_guest_amount_minor: 1_000,
          deposit_amount_minor: 20_000,
          deposit_refundable: false,
          security_deposit_minor: 10_000,
          security_deposit_refundable: true,
          included_start_time: "18:30:00",
          included_end_time: "01:00:00",
          included_end_day_offset: 1,
          extra_hour_amount_minor: 5_000,
          source_id: sourceId,
          notes: "terms",
          revision: 2,
        }),
        projectId,
        venueId,
        offerId,
      ),
    ).toMatchObject({
      id: offerId,
      projectId,
      venueId,
      status: "quoted",
      includedStartTime: "18:30",
      includedEndTime: "01:00",
      sourceId,
      revision: 2,
    });
  });

  it("fails closed on malformed offer containers, identity and status", () => {
    expect(() => parseVenueOfferRow(null, projectId, venueId)).toThrow(
      "Invalid venue commercial response.",
    );
    expect(() => parseVenueOfferRow([], projectId, venueId)).toThrow(
      "Invalid venue commercial response.",
    );
    expectOfferFailure({ id: 42 });
    expectOfferFailure({ id: "bad" });
    expectOfferFailure({ project_id: venueId });
    expectOfferFailure({ venue_id: projectId });
    expectOfferFailure({ status: "pending" });
    expect(() =>
      parseVenueOfferRow(offerRow(), projectId, venueId, componentId),
    ).toThrow("Invalid venue commercial response.");
  });

  it("fails closed on malformed offer commercial values", () => {
    expectOfferFailure({ name: 42 });
    expectOfferFailure({ name: "" });
    expectOfferFailure({ valid_from: 42 });
    expectOfferFailure({ valid_from: "2026-02-30" });
    expectOfferFailure({ weekday: "6" });
    expectOfferFailure({ base_amount_minor: -1 });
    expectOfferFailure({ currency: "eur" });
    expectOfferFailure({ tax_mode: "gross" });
    expectOfferFailure({ tax_rate_basis_points: 10_001 });
    expectOfferFailure({ included_guest_count: 1.5 });
    expectOfferFailure({ deposit_refundable: "false" });
    expectOfferFailure({ security_deposit_refundable: 1 });
    expectOfferFailure({ included_start_time: "18:30:01" });
    expectOfferFailure({ included_start_time: 1830 });
    expectOfferFailure({ included_end_day_offset: "1" });
    expectOfferFailure({ source_id: "bad" });
    expectOfferFailure({ notes: 42 });
    expectOfferFailure({ revision: 0 });
    expectOfferFailure({ revision: 1.5 });
  });

  it("parses canonical component rows", () => {
    expect(
      parseVenueOfferComponentRow(
        componentRow({
          component_type: "optional",
          calculation_type: "quantity_unit",
          unit_amount_minor: 250,
          quantity: 4.5,
          unit_label: "chair",
          tax_mode: "excluded",
          tax_rate_basis_points: 2_000,
          notes: "extra",
          revision: 3,
        }),
        projectId,
        offerId,
        componentId,
      ),
    ).toMatchObject({
      id: componentId,
      projectId,
      ownerType: "venue_offer",
      offerId,
      quantity: 4.5,
      revision: 3,
    });
  });

  it("fails closed on malformed component identity and values", () => {
    expectComponentFailure({ id: "bad" });
    expectComponentFailure({ project_id: venueId });
    expectComponentFailure({ owner_type: "vendor_offer" });
    expectComponentFailure({ owner_id: componentId });
    expectComponentFailure({ label: 42 });
    expectComponentFailure({ component_type: "required" });
    expectComponentFailure({ calculation_type: "tiered" });
    expectComponentFailure({ unit_amount_minor: -1 });
    expectComponentFailure({ quantity: 1.2345 });
    expectComponentFailure({ unit_label: 42 });
    expectComponentFailure({ currency: "eur" });
    expectComponentFailure({ tax_mode: "gross" });
    expectComponentFailure({ tax_rate_basis_points: -1 });
    expectComponentFailure({ notes: 42 });
    expectComponentFailure({ revision: 0 });
    expect(() =>
      parseVenueOfferComponentRow(componentRow(), projectId, offerId, sourceId),
    ).toThrow("Invalid venue commercial response.");
  });

  it("parses aggregate creation responses and rejects malformed payloads", () => {
    expect(
      parseVenueOfferAggregate(
        { offer: offerRow(), components: [componentRow()] },
        projectId,
        venueId,
        offerId,
      ),
    ).toMatchObject({
      offer: { id: offerId },
      components: [{ id: componentId }],
    });
    expect(() =>
      parseVenueOfferAggregate(
        { offer: offerRow(), components: null },
        projectId,
        venueId,
        offerId,
      ),
    ).toThrow("Invalid venue commercial response.");
    expect(() =>
      parseVenueOfferAggregate(null, projectId, venueId, offerId),
    ).toThrow("Invalid venue commercial response.");
  });

  it("validates component removal receipts exactly", () => {
    expect(
      parseVenueOfferRemovalReceipt(
        {
          project_id: projectId,
          offer_id: offerId,
          component_id: componentId,
          removed: true,
        },
        projectId,
        offerId,
        componentId,
      ),
    ).toBeUndefined();
    for (const payload of [
      null,
      {
        project_id: venueId,
        offer_id: offerId,
        component_id: componentId,
        removed: true,
      },
      {
        project_id: projectId,
        offer_id: venueId,
        component_id: componentId,
        removed: true,
      },
      {
        project_id: projectId,
        offer_id: offerId,
        component_id: venueId,
        removed: true,
      },
      {
        project_id: projectId,
        offer_id: offerId,
        component_id: componentId,
        removed: false,
      },
    ]) {
      expect(() =>
        parseVenueOfferRemovalReceipt(payload, projectId, offerId, componentId),
      ).toThrow("Invalid venue commercial response.");
    }
  });
});
