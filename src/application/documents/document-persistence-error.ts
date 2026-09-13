export type DocumentPersistenceErrorCode =
  | "conflict"
  | "provider_response_invalid"
  | "persistence_failed"
  | "storage_retryable";

export class DocumentPersistenceError extends Error {
  readonly code: DocumentPersistenceErrorCode;

  constructor(code: DocumentPersistenceErrorCode, message: string) {
    super(message);
    this.name = "DocumentPersistenceError";
    this.code = code;
  }
}

export function documentPersistenceErrorCode(
  value: unknown,
): DocumentPersistenceErrorCode | null {
  return value instanceof DocumentPersistenceError ? value.code : null;
}
