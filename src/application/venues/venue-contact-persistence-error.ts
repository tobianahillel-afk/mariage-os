export type VenueContactPersistenceErrorCode =
  | "conflict"
  | "persistence_failed"
  | "provider_response_invalid";

export class VenueContactPersistenceError extends Error {
  constructor(
    readonly code: VenueContactPersistenceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "VenueContactPersistenceError";
  }
}

export function venueContactPersistenceErrorCode(
  error: unknown,
): VenueContactPersistenceErrorCode | null {
  return error instanceof VenueContactPersistenceError ? error.code : null;
}
