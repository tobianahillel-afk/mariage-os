import { normalizeVenueInteraction, type VenueInteractionRecord } from "@domain/venues/venue-interaction";
import type { StructuredVenueReplayCommand } from "./venue-visit-replay-dependencies";

type NoteReplayCommand = Extract<
  StructuredVenueReplayCommand,
  { readonly kind: "visit_note" }
>;

export function venueVisitNoteAcknowledgementMatches(
  command: NoteReplayCommand,
  record: VenueInteractionRecord,
  expectedUserId: string,
): boolean {
  const input = command.input;
  const normalized = normalizeVenueInteraction(input);
  if (!normalized.ok) return false;

  return [
    record.id === input.interactionId,
    record.projectId === input.projectId,
    record.parentType === "venue",
    record.venueId === input.venueId,
    record.contactId === input.contactId,
    record.sourceId === input.sourceId,
    record.interactionType === normalized.value.interactionType,
    record.occurredAt === normalized.value.occurredAt,
    record.summary === normalized.value.summary,
    record.nextFollowUpAt === normalized.value.nextFollowUpAt,
    record.createdBy === expectedUserId,
  ].every(Boolean);
}
