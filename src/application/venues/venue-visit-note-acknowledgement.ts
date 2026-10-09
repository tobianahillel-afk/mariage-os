import {
  normalizeVenueInteraction,
  type VenueInteractionRecord,
} from "@domain/venues/venue-interaction";
import type { StructuredVenueReplayCommand } from "./venue-visit-replay-dependencies";

type NoteReplayCommand = Extract<
  StructuredVenueReplayCommand,
  { readonly kind: "visit_note" }
>;

export function venueVisitNoteAcknowledgementMatches(
  command: NoteReplayCommand,
  record: unknown,
  expectedUserId: string,
): boolean {
  if (typeof record !== "object" || record === null) return false;
  const acknowledgement = record as VenueInteractionRecord;
  const input = command.input;
  const normalized = normalizeVenueInteraction(input);
  if (!normalized.ok) return false;

  return [
    acknowledgement.id === input.interactionId,
    acknowledgement.projectId === input.projectId,
    acknowledgement.parentType === "venue",
    acknowledgement.venueId === input.venueId,
    acknowledgement.contactId === input.contactId,
    acknowledgement.sourceId === input.sourceId,
    acknowledgement.interactionType === normalized.value.interactionType,
    acknowledgement.occurredAt === normalized.value.occurredAt,
    acknowledgement.summary === normalized.value.summary,
    acknowledgement.nextFollowUpAt === normalized.value.nextFollowUpAt,
    acknowledgement.createdBy === expectedUserId,
  ].every(Boolean);
}
