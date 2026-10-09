import { expect, it } from "vitest";
import { venueReplayCommand } from "./venue-local-mutation";
import {
  addReplayFailureBlockers,
  createReplayDependencyBlockers,
  hasReplayBlockedDependency,
  orderStructuredReplayEntries,
  type StructuredReplayEntry,
  type StructuredVenueReplayCommand,
} from "./venue-visit-replay-dependencies";
import {
  factMutation,
  noteMutation,
  ratingMutation,
  scope,
} from "../../../tests/support/venue-visit-structured-replay-test-support";

function entry(
  mutation: ReturnType<typeof factMutation>,
): StructuredReplayEntry {
  return {
    mutation,
    command: venueReplayCommand(
      mutation,
      scope,
    ) as StructuredVenueReplayCommand,
  };
}

it("normalizes an uppercase queued visit note interaction ID", () => {
  const id = "a1111111-1111-4111-8111-111111111111";
  const command = venueReplayCommand(noteMutation(id.toUpperCase()), scope);
  expect(command.kind).toBe("visit_note");
  if (command.kind !== "visit_note") return;
  expect(command.input.interactionId).toBe(id);
});

it("accepts case-equivalent durable note identity", () => {
  const id = "a1111111-1111-4111-8111-111111111111";
  const queued = noteMutation(id.toUpperCase());
  const payload = queued.payload as Record<string, string | null>;
  const mutation = { ...queued, payload: { ...payload, interactionId: id } };
  const command = venueReplayCommand(mutation, scope);
  expect(command.kind).toBe("visit_note");
});

it("normalizes an uppercase queued Fact observation ID", () => {
  const id = "a2222222-2222-4222-8222-222222222222";
  const command = venueReplayCommand(factMutation(id.toUpperCase()), scope);
  expect(command.kind).toBe("fact_observation");
  if (command.kind !== "fact_observation") return;
  expect(command.input.observationId).toBe(id);
});

it("orders mixed-case Fact dependencies before UUID tie-breaking", () => {
  const predecessorId = "f2222222-2222-4222-8222-222222222222";
  const successorId = "12222222-2222-4222-8222-222222222222";
  const at = "2026-10-06T12:00:00.000Z";
  const predecessor = entry(factMutation(predecessorId.toUpperCase(), at));
  const successor = entry(factMutation(successorId, at, predecessorId));
  const ordered = orderStructuredReplayEntries([successor, predecessor]);
  expect(ordered[0]?.mutation.operationId).toBe(predecessorId.toUpperCase());
});

it("blocks mixed-case supersession after a prior Fact failed", () => {
  const predecessorId = "f2222222-2222-4222-8222-222222222222";
  const predecessor = entry(factMutation(predecessorId.toUpperCase()));
  const successorId = "12222222-2222-4222-8222-222222222222";
  const at = "2026-10-06T12:02:00.000Z";
  const successor = entry(factMutation(successorId, at, predecessorId));
  const blockers = createReplayDependencyBlockers();
  addReplayFailureBlockers(blockers, predecessor);
  expect(
    hasReplayBlockedDependency(
      blockers,
      successor.command as StructuredVenueReplayCommand,
    ),
  ).toBe(true);
});

it("canonicalizes the member-rating replay receipt operation ID", () => {
  const id = "a3333333-3333-4333-8333-333333333333";
  const command = venueReplayCommand(ratingMutation(id.toUpperCase()), scope);
  expect(command.kind).toBe("member_rating");
  if (command.kind !== "member_rating") return;
  expect(command.input.operationId).toBe(id);
});
