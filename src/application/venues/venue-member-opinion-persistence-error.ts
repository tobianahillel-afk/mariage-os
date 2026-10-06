export type VenueMemberOpinionPersistenceErrorCode =
  | "conflict"
  | "persistence_failed";

export class VenueMemberOpinionPersistenceError extends Error {
  readonly code: VenueMemberOpinionPersistenceErrorCode;

  constructor(code: VenueMemberOpinionPersistenceErrorCode, message: string) {
    super(message);
    this.name = "VenueMemberOpinionPersistenceError";
    this.code = code;
  }
}

export function venueMemberOpinionPersistenceErrorCode(
  value: unknown,
): VenueMemberOpinionPersistenceErrorCode | null {
  return value instanceof VenueMemberOpinionPersistenceError
    ? value.code
    : null;
}
