export type VenueAccessPersistenceErrorCode =
  "conflict" | "provider_response_invalid" | "persistence_failed";

export class VenueAccessPersistenceError extends Error {
  readonly code: VenueAccessPersistenceErrorCode;

  constructor(code: VenueAccessPersistenceErrorCode, message: string) {
    super(message);
    this.name = "VenueAccessPersistenceError";
    this.code = code;
  }
}

export function venueAccessPersistenceErrorCode(
  value: unknown,
): VenueAccessPersistenceErrorCode | null {
  return value instanceof VenueAccessPersistenceError ? value.code : null;
}
