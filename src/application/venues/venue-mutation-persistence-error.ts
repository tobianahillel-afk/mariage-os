export type VenueMutationFailureCode =
  "conflict" | "denied" | "permanent" | "unavailable";

export class VenueMutationPersistenceError extends Error {
  constructor(readonly code: VenueMutationFailureCode, message: string) {
    super(message);
    this.name = "VenueMutationPersistenceError";
  }
}
