import { describe, expect, it } from "vitest";
import {
  withdrawVenueFactObservation,
  type VenueFactObservationLifecyclePort,
  type WithdrawnVenueFactObservationRecord,
} from "./venue-fact-observation-lifecycle-service";

const projectId = "81111111-1111-4111-8111-111111111111";
const factId = "84444444-4444-4444-8444-444444444444";
const observationId = "86666666-6666-4666-8666-666666666666";

const record: WithdrawnVenueFactObservationRecord = {
  id: observationId,
  projectId,
  factId,
  status: "withdrawn",
  supersededByObservationId: null,
};

describe("venue fact observation lifecycle service", () => {
  it("delegates withdrawal without rewriting retained truth", async () => {
    let received: unknown;
    const port: VenueFactObservationLifecyclePort = {
      withdrawObservation: async (input) => {
        received = input;
        return record;
      },
    };
    await expect(
      withdrawVenueFactObservation(port, { projectId, factId, observationId }),
    ).resolves.toEqual({ ok: true, observation: record });
    expect(received).toEqual({ projectId, factId, observationId });
  });

  it("maps persistence failure without leaking provider details", async () => {
    const port: VenueFactObservationLifecyclePort = {
      withdrawObservation: async () => {
        throw new Error("secret provider detail");
      },
    };
    await expect(
      withdrawVenueFactObservation(port, { projectId, factId, observationId }),
    ).resolves.toEqual({ ok: false, error: "persistence_failed" });
  });
});
