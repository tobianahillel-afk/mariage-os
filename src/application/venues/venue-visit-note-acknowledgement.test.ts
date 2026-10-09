import { describe, expect, it } from "vitest";
import { VenueInteractionService } from "./venue-interaction-service";
import { venueReplayCommand } from "./venue-local-mutation";
import { venueVisitNoteAcknowledgementMatches } from "./venue-visit-note-acknowledgement";
import {
  MemoryLocalStore,
  RemoteHarness,
  coordinator,
  noteId,
  noteMutation,
  scope,
  seed,
} from "../../../tests/support/venue-visit-structured-replay-test-support";

describe("Venue visit structured replay note ACK validation", () => {
  it.each([
    ["interaction ID", { id: "69999999-9999-4999-8999-999999999999" }],
    ["project", { projectId: "69999999-9999-4999-8999-999999999999" }],
    ["Venue", { venueId: "69999999-9999-4999-8999-999999999999" }],
    ["contact", { contactId: "69999999-9999-4999-8999-999999999999" }],
    ["source", { sourceId: "69999999-9999-4999-8999-999999999999" }],
    ["interaction type", { interactionType: "phone_call" }],
    ["occurred time", { occurredAt: "2026-10-06T13:00:00.000Z" }],
    ["summary", { summary: "A different note" }],
    ["follow-up", { nextFollowUpAt: "2026-10-07T13:00:00.000Z" }],
    ["author", { createdBy: "69999999-9999-4999-8999-999999999999" }],
  ])(
    "retains local note on mismatched provider %s",
    async (_label, override) => {
      const local = new MemoryLocalStore();
      const remote = new RemoteHarness();
      remote.noteResponseOverride = override;
      await seed(local, noteMutation());

      await expect(coordinator(local, remote).replayPending()).resolves.toEqual(
        [
          {
            operationId: noteId,
            state: "failed_permanent",
            error: "provider_response_invalid",
          },
        ],
      );
      expect(remote.notes).toHaveLength(1);
      expect(local.pending.get(noteId)).toMatchObject({
        status: "failed_permanent",
        lastErrorCode: "provider_response_invalid",
      });
    },
  );

  it("rejects a malformed note before receipt", async () => {
    const command = venueReplayCommand(noteMutation(), scope);
    if (command.kind !== "visit_note") throw new Error("Invalid fixture");
    const remote = new RemoteHarness();
    const service = new VenueInteractionService(remote.interactions);
    const receiptResult = await service.appendVenueInteraction(command.input);
    if (!receiptResult.ok) throw new Error("Invalid note fixture");
    const receipt = receiptResult.value;
    expect(
      venueVisitNoteAcknowledgementMatches(
        { ...command, input: { ...command.input, summary: "" } },
        receipt,
        scope.userId,
      ),
    ).toBe(false);
  });
});
