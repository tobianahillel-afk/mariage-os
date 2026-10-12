import {
  VenueFactPersistenceError,
  type VenueFactPersistenceErrorCode,
} from "@application/facts/venue-fact-persistence-error";

const CONFLICT_CODES = new Set(["40001", "PT412", "23505"]);
const BACKEND_CODES = new Set(["PGRST000", "PGRST001", "PGRST002", "PGRST003"]);

export interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

function providerErrorCode(value: unknown): string {
  const code = (Object(value) as Record<string, unknown>).code;
  return typeof code === "string" ? code : "";
}

function classifyProviderError(error: unknown): VenueFactPersistenceErrorCode {
  const code = providerErrorCode(error);
  if (CONFLICT_CODES.has(code)) return "conflict";
  if (code === "42501") return "authorization_failed";
  if (BACKEND_CODES.has(code)) return "backend_unavailable";
  if (code === "P0001" || code.startsWith("22") || code.startsWith("23")) {
    return "data_integrity_failed";
  }
  return "persistence_failed";
}

export function fail(
  code: VenueFactPersistenceErrorCode,
  message: string,
): never {
  throw new VenueFactPersistenceError(code, message);
}

export async function providerResult(
  call: () => PromiseLike<SupabaseResult>,
  message: string,
): Promise<SupabaseResult> {
  try {
    return await call();
  } catch {
    fail("backend_unavailable", message);
  }
}

export function providerData(result: SupabaseResult, message: string): unknown {
  if (result.error !== null) fail(classifyProviderError(result.error), message);
  return result.data;
}
