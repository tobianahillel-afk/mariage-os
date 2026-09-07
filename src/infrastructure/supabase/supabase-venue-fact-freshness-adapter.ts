import type {
  SetVenueFactFreshnessInput,
  VenueFactFreshnessPort,
  VenueFactFreshnessRecord,
} from "@application/facts/venue-fact-freshness-service";
import {
  VenueFactPersistenceError,
  type VenueFactPersistenceErrorCode,
} from "@application/facts/venue-fact-persistence-error";
import { parseVenueFactFreshnessRow } from "./parse-venue-fact-freshness-row";

const FRESHNESS_MUTATION_FAILED = "Venue fact freshness mutation failed.";
const CONFLICT_CODES = new Set(["40001", "23505"]);
const BACKEND_CODES = new Set(["PGRST000", "PGRST001", "PGRST002", "PGRST003"]);

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

export interface SupabaseVenueFactFreshnessClientLike {
  rpc(
    functionName: "set_venue_fact_freshness",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
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

function fail(code: VenueFactPersistenceErrorCode): never {
  throw new VenueFactPersistenceError(code, FRESHNESS_MUTATION_FAILED);
}

function parseFreshnessData(
  value: unknown,
  input: SetVenueFactFreshnessInput,
): VenueFactFreshnessRecord {
  try {
    return parseVenueFactFreshnessRow(value, input.projectId, input.factId);
  } catch {
    fail("provider_response_invalid");
  }
}

export class SupabaseVenueFactFreshnessAdapter implements VenueFactFreshnessPort {
  constructor(private readonly client: SupabaseVenueFactFreshnessClientLike) {}

  async setFreshness(
    input: SetVenueFactFreshnessInput,
  ): Promise<VenueFactFreshnessRecord> {
    let result: SupabaseResult;
    try {
      result = await this.client.rpc("set_venue_fact_freshness", {
        target_project_id: input.projectId,
        target_fact_id: input.factId,
        target_expected_revision: input.expectedRevision,
        target_last_verified_at: input.lastVerifiedAt,
        target_stale_at: input.staleAt,
      });
    } catch {
      fail("backend_unavailable");
    }
    if (result.error !== null) fail(classifyProviderError(result.error));
    return parseFreshnessData(result.data, input);
  }
}
