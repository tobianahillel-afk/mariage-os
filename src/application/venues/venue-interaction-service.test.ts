import { expect, it } from "vitest";
import type { VenueInteractionRecord } from "@domain/venues/venue-interaction";
import {
  VenueInteractionService,
  type NormalizedAppendVenueInteractionInput,
  type VenueInteractionPort,
} from "./venue-interaction-service";
import {
  VenueInteractionPersistenceError,
  venueInteractionPersistenceErrorCode,
} from "./venue-interaction-persistence-error";

const projectId = "11111111-1111-4111-8111-111111111111";
const venueId = "22222222-2222-4222-8222-222222222222";
const interactionId = "33333333-3333-4333-8333-333333333333";
const contactId = "44444444-4444-4444-8444-444444444444";
const sourceId = "55555555-5555-4555-8555-555555555555";

function record(
  overrides: Partial<VenueInteractionRecord> = {},
): VenueInteractionRecord {
  return {
    id: interactionId,
    projectId,
    parentType: "venue",
    venueId,
    contactId,
    interactionType: "phone_call",
    occurredAt: "2026-09-08T10:00:00.000Z",
    summary: "Quote confirmed.",
    nextFollowUpAt: null,
    sourceId,
    createdAt: "2026-09-08T10:01:00.000Z",
    createdBy: projectId,
    updatedAt: "2026-09-08T10:01:00.000Z",
    updatedBy: projectId,
    revision: 1,
    ...overrides,
  };
}

function input(overrides: Record<string, unknown> = {}) {
  return {
    projectId,
    venueId,
    interactionId,
    contactId,
    interactionType: " phone_call ",
    occurredAt: "2026-09-08T12:00:00+02:00",
    summary: " Quote confirmed. ",
    nextFollowUpAt: null,
    sourceId,
    ...overrides,
  };
}

function port(overrides: Partial<VenueInteractionPort> = {}): VenueInteractionPort {
  return {
    appendVenueInteraction: async () => record(),
    listVenueInteractionHistory: async () => [record()],
    ...overrides,
  };
}

it("normalizes and appends through the provider-neutral port", async () => {
  let captured: NormalizedAppendVenueInteractionInput | null = null;
  const service = new VenueInteractionService(
    port({
      appendVenueInteraction: async (value) => {
        captured = value;
        return record();
      },
    }),
  );
  await expect(service.appendVenueInteraction(input())).resolves.toEqual({
    ok: true,
    value: record(),
  });
  expect(captured).toEqual({
    projectId,
    venueId,
    interactionId,
    contactId,
    sourceId,
    interactionType: "phone_call",
    occurredAt: "2026-09-08T10:00:00.000Z",
    summary: "Quote confirmed.",
    nextFollowUpAt: null,
  });
});

it("rejects invalid command identities before persistence", async () => {
  const service = new VenueInteractionService(port());
  for (const overrides of [
    { projectId: "bad" },
    { venueId: "bad" },
    { interactionId: "bad" },
    { contactId: "bad" },
    { sourceId: "bad" },
  ]) {
    await expect(service.appendVenueInteraction(input(overrides))).resolves.toEqual(
      { ok: false, error: "invalid_identity" },
    );
  }
  await expect(
    service.appendVenueInteraction(
      input({ contactId: undefined, sourceId: undefined }),
    ),
  ).resolves.toMatchObject({ ok: true });
});

it("propagates domain validation errors without hitting persistence", async () => {
  const service = new VenueInteractionService(port());
  await expect(
    service.appendVenueInteraction(input({ summary: "   " })),
  ).resolves.toEqual({ ok: false, error: "invalid_summary" });
});

it("maps replay conflicts distinctly from generic persistence failure", async () => {
  const conflict = new VenueInteractionPersistenceError("conflict", "conflict");
  expect(conflict.name).toBe("VenueInteractionPersistenceError");
  expect(conflict.code).toBe("conflict");
  expect(venueInteractionPersistenceErrorCode(conflict)).toBe("conflict");
  expect(venueInteractionPersistenceErrorCode(new Error("x"))).toBeNull();

  const conflicting = new VenueInteractionService(
    port({
      appendVenueInteraction: async () => {
        throw conflict;
      },
    }),
  );
  await expect(conflicting.appendVenueInteraction(input())).resolves.toEqual({
    ok: false,
    error: "replay_conflict",
  });

  const unavailable = new VenueInteractionService(
    port({
      appendVenueInteraction: async () => {
        throw new VenueInteractionPersistenceError(
          "provider_response_invalid",
          "bad",
        );
      },
    }),
  );
  await expect(unavailable.appendVenueInteraction(input())).resolves.toEqual({
    ok: false,
    error: "persistence_failed",
  });
});

it("lists canonical provider order and fails closed on invalid identity or provider errors", async () => {
  const service = new VenueInteractionService(port());
  await expect(
    service.listVenueInteractionHistory(projectId, venueId),
  ).resolves.toEqual({ ok: true, value: [record()] });
  await expect(
    service.listVenueInteractionHistory("bad", venueId),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });
  await expect(
    service.listVenueInteractionHistory(projectId, "bad"),
  ).resolves.toEqual({ ok: false, error: "invalid_identity" });

  const failing = new VenueInteractionService(
    port({
      listVenueInteractionHistory: async () => {
        throw new Error("down");
      },
    }),
  );
  await expect(
    failing.listVenueInteractionHistory(projectId, venueId),
  ).resolves.toEqual({ ok: false, error: "persistence_failed" });
});
