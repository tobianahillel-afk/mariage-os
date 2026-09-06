export type VenueFactPersistenceErrorCode =
  | "conflict"
  | "authorization_failed"
  | "backend_unavailable"
  | "data_integrity_failed"
  | "provider_response_invalid"
  | "persistence_failed";

export class VenueFactPersistenceError extends Error {
  readonly code: VenueFactPersistenceErrorCode;

  constructor(code: VenueFactPersistenceErrorCode, message: string) {
    super(message);
    this.name = "VenueFactPersistenceError";
    this.code = code;
  }
}

export function venueFactPersistenceErrorCode(
  value: unknown,
): VenueFactPersistenceErrorCode | null {
  return value instanceof VenueFactPersistenceError ? value.code : null;
}
