export type VenueAvailabilityPersistenceErrorCode =
  | "conflict"
  | "provider_response_invalid"
  | "persistence_failed";

export class VenueAvailabilityPersistenceError extends Error {
  readonly code: VenueAvailabilityPersistenceErrorCode;

  constructor(code: VenueAvailabilityPersistenceErrorCode, message: string) {
    super(message);
    this.name = "VenueAvailabilityPersistenceError";
    this.code = code;
  }
}

export function venueAvailabilityPersistenceErrorCode(
  value: unknown,
): VenueAvailabilityPersistenceErrorCode | null {
  return value instanceof VenueAvailabilityPersistenceError ? value.code : null;
}
