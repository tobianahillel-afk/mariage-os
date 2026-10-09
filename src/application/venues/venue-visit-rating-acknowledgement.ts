import type { VenueMemberRatingRecord } from "./venue-member-opinion-service";
import type { StructuredVenueReplayCommand } from "./venue-visit-replay-dependencies";

type InvalidRatingReceipt = {
  readonly state: "failed_permanent";
  readonly error: "provider_response_invalid";
};

export function ratingAcknowledgementFailure(
  command: Extract<
    StructuredVenueReplayCommand,
    { readonly kind: "member_rating" }
  >,
  rating: unknown,
  expectedUserId: string,
): InvalidRatingReceipt | null {
  if (typeof rating !== "object" || rating === null) {
    return { state: "failed_permanent", error: "provider_response_invalid" };
  }
  const acknowledgement = rating as VenueMemberRatingRecord;
  const expected = command.input;
  const matches = [
    acknowledgement.projectId === expected.projectId,
    acknowledgement.venueId === expected.venueId,
    acknowledgement.userId === expectedUserId,
    acknowledgement.dimensionKey === expected.dimensionKey,
    acknowledgement.rating === expected.rating,
    acknowledgement.revision === expected.expectedRevision + 1,
  ].every(Boolean);
  return matches
    ? null
    : { state: "failed_permanent", error: "provider_response_invalid" };
}
