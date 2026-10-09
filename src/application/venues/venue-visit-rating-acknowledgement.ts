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
  rating: VenueMemberRatingRecord,
  expectedUserId: string,
): InvalidRatingReceipt | null {
  const expected = command.input;
  return rating.projectId === expected.projectId &&
    rating.venueId === expected.venueId &&
    rating.userId === expectedUserId &&
    rating.dimensionKey === expected.dimensionKey &&
    rating.rating === expected.rating &&
    rating.revision === expected.expectedRevision + 1
    ? null
    : { state: "failed_permanent", error: "provider_response_invalid" };
}
