import {
  VenueMutationPersistenceError,
  type VenueMutationFailureCode,
} from "@application/venues/venue-mutation-persistence-error";

function providerCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || Array.isArray(error)) {
    return null;
  }
  const code = (error as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

function failureCode(error: unknown): VenueMutationFailureCode {
  const code = providerCode(error);
  if (code === "40001") return "conflict";
  if (code === "42501") return "denied";
  if (code === "22023") return "permanent";
  return "unavailable";
}

export function venueMutationError(
  error: unknown,
  message: string,
): VenueMutationPersistenceError {
  return new VenueMutationPersistenceError(failureCode(error), message);
}
