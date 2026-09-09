export type MediaPersistenceErrorCode =
  | "conflict"
  | "provider_response_invalid"
  | "persistence_failed";

export class MediaPersistenceError extends Error {
  readonly code: MediaPersistenceErrorCode;

  constructor(code: MediaPersistenceErrorCode, message: string) {
    super(message);
    this.name = "MediaPersistenceError";
    this.code = code;
  }
}

export function mediaPersistenceErrorCode(
  value: unknown,
): MediaPersistenceErrorCode | null {
  return value instanceof MediaPersistenceError ? value.code : null;
}
