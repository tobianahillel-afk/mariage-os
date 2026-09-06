export type VenueRevisionError = "expected_revision_invalid";

export function validateExpectedVenueRevision(
  value: number,
): VenueRevisionError | null {
  return Number.isSafeInteger(value) && value > 0
    ? null
    : "expected_revision_invalid";
}
