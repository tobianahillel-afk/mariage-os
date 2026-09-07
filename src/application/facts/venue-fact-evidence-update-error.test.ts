import { expect, it } from "vitest";
import {
  updateVenueFactSource,
  type VenueFactEvidencePort,
} from "./venue-fact-evidence-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const sourceId = "85555555-5555-4555-8555-555555555555";

function unexpected(): never {
  throw new Error("unexpected test path");
}

const port: VenueFactEvidencePort = {
  getFactContext: async () => unexpected(),
  createSource: async () => unexpected(),
  updateSource: async () => {
    throw new Error("hidden provider detail");
  },
  appendObservation: async () => unexpected(),
  linkObservationSource: async () => unexpected(),
  resolveFromObservation: async () => unexpected(),
};

it("maps source update persistence failures without leaking provider detail", async () => {
  await expect(
    updateVenueFactSource(port, {
      projectId,
      sourceId,
      expectedRevision: 1,
      sourceType: "written_confirmation",
      title: "Venue email",
      url: "https://venue.example/confirmation",
      evidenceLevel: "confirmed_for_event",
      observedAt: "2026-09-07T06:20:00.000Z",
      notes: null,
      status: "active",
    }),
  ).resolves.toEqual({ ok: false, error: "persistence_failed" });
});
