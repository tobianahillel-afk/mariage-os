import { expect, it } from "vitest";
import type {
  CheckedLinkObservationSourceInput,
  ObservationSourceLinkRecord,
  VenueFactProvenanceLinkPort,
} from "@application/facts/venue-fact-evidence-service";
import { VenueFactPersistenceError } from "@application/facts/venue-fact-persistence-error";
import { checkedVenueVisitSourceLink } from "./venue-visit-checked-source-link";

const input: CheckedLinkObservationSourceInput = {
  projectId: "11111111-1111-4111-8111-111111111111",
  observationId: "22222222-2222-4222-8222-222222222222",
  sourceId: "33333333-3333-4333-8333-333333333333",
  isPrimary: true,
  expectedSourceType: "in_person_visit",
  expectedSourceRevision: 2,
};

function portWith(
  override: Partial<ObservationSourceLinkRecord>,
): VenueFactProvenanceLinkPort {
  return {
    async linkObservationSourceChecked() {
      return { ...input, ...override };
    },
  };
}

it("accepts an exact atomic provenance acknowledgement", async () => {
  await expect(
    checkedVenueVisitSourceLink(portWith({}), input),
  ).resolves.toEqual({ ok: true });
});

it.each([
  ["project", { projectId: "91111111-1111-4111-8111-111111111111" }],
  ["observation", { observationId: "92222222-2222-4222-8222-222222222222" }],
  ["source", { sourceId: "93333333-3333-4333-8333-333333333333" }],
  ["primary", { isPrimary: false }],
] as const)("rejects a wrong %s in a checked-link receipt", async (_name, changed) => {
  await expect(
    checkedVenueVisitSourceLink(portWith(changed), input),
  ).resolves.toEqual({
    ok: false,
    error: "provider_response_invalid",
  });
});

it("retains the typed conflict when the source changed atomically", async () => {
  const port: VenueFactProvenanceLinkPort = {
    async linkObservationSourceChecked() {
      throw new VenueFactPersistenceError("conflict", "source changed");
    },
  };
  await expect(checkedVenueVisitSourceLink(port, input)).resolves.toEqual({
    ok: false,
    error: "conflict",
  });
});

it("maps unknown persistence errors to a retryable failure", async () => {
  const port: VenueFactProvenanceLinkPort = {
    async linkObservationSourceChecked() {
      throw new Error("network");
    },
  };
  await expect(checkedVenueVisitSourceLink(port, input)).resolves.toEqual({
    ok: false,
    error: "persistence_failed",
  });
});
