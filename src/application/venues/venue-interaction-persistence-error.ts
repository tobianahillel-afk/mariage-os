export type VenueInteractionPersistenceErrorCode =
  "conflict" | "provider_response_invalid" | "persistence_failed";

export class VenueInteractionPersistenceError extends Error {
  readonly code: VenueInteractionPersistenceErrorCode;

  constructor(code: VenueInteractionPersistenceErrorCode, message: string) {
    super(message);
    this.name = "VenueInteractionPersistenceError";
    this.code = code;
  }
}

export function venueInteractionPersistenceErrorCode(
  value: unknown,
): VenueInteractionPersistenceErrorCode | null {
  return value instanceof VenueInteractionPersistenceError ? value.code : null;
}
