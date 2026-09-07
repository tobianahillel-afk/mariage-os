import {
  VenueFactPersistenceError,
  type VenueFactPersistenceErrorCode,
} from "@application/facts/venue-fact-persistence-error";
import type {
  AppendVenueFactObservationInput,
  CreateVenueFactSourceInput,
  LinkObservationSourceInput,
  ObservationSourceLinkRecord,
  ResolvedVenueFactRecord,
  ResolveVenueFactObservationInput,
  UpdateVenueFactSourceInput,
  VenueFactContext,
  VenueFactEvidencePort,
  VenueFactObservationRecord,
  VenueFactSourceRecord,
} from "@application/facts/venue-fact-evidence-service";
import { parseVenueFactDefinitionRow } from "./parse-venue-fact-row";
import {
  parseObservationSourceLinkRow,
  parseResolvedVenueFactEvidenceRow,
  parseVenueFactContextIdentity,
  parseVenueFactObservationRow,
  parseVenueFactSourceRow,
  venueFactContextFromIdentity,
} from "./parse-venue-fact-evidence-row";

const FACT_CONTEXT_COLUMNS =
  "id,project_id,target_type,target_id,definition_id";
const DEFINITION_COLUMNS =
  "id,project_id,key,label,entity_type,value_type,unit,priority,weight,freshness_policy,system_defined,options_json,evaluation_rule_json,revision";
const CONTEXT_QUERY_FAILED = "Venue fact evidence context query failed.";
const SOURCE_MUTATION_FAILED = "Venue fact source mutation failed.";
const OBSERVATION_MUTATION_FAILED = "Venue fact observation mutation failed.";
const LINK_MUTATION_FAILED = "Venue fact evidence link mutation failed.";
const RESOLUTION_MUTATION_FAILED = "Venue fact resolution mutation failed.";
const CONFLICT_CODES = new Set(["40001", "23505"]);
const BACKEND_CODES = new Set(["PGRST000", "PGRST001", "PGRST002", "PGRST003"]);

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface EvidenceQueryBuilder {
  eq(column: string, value: string): EvidenceQueryBuilder;
  single(): PromiseLike<SupabaseResult>;
}

interface EvidenceTable {
  select(columns: string): EvidenceQueryBuilder;
}

type EvidenceRpcName =
  | "create_venue_fact_source"
  | "update_venue_fact_source"
  | "append_venue_fact_observation"
  | "link_venue_fact_observation_source"
  | "resolve_venue_fact_from_observation";

export interface SupabaseVenueFactEvidenceClientLike {
  from(table: "facts" | "fact_definitions"): EvidenceTable;
  rpc(
    functionName: EvidenceRpcName,
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

function fail(code: VenueFactPersistenceErrorCode, message: string): never {
  throw new VenueFactPersistenceError(code, message);
}

async function providerResult(
  call: () => PromiseLike<SupabaseResult>,
  message: string,
): Promise<SupabaseResult> {
  try {
    return await call();
  } catch {
    fail("backend_unavailable", message);
  }
}

function providerData(result: SupabaseResult, message: string): unknown {
  if (result.error !== null) fail(classifyProviderError(result.error), message);
  return result.data;
}

async function querySingle(
  client: SupabaseVenueFactEvidenceClientLike,
  table: "facts" | "fact_definitions",
  columns: string,
  filters: ReadonlyArray<readonly [string, string]>,
): Promise<unknown> {
  const result = await providerResult(() => {
    let query = client.from(table).select(columns);
    for (const [column, value] of filters) query = query.eq(column, value);
    return query.single();
  }, CONTEXT_QUERY_FAILED);
  return providerData(result, CONTEXT_QUERY_FAILED);
}

function parseContextResponse(
  value: unknown,
  expectedProjectId: string,
  expectedFactId: string,
) {
  try {
    return parseVenueFactContextIdentity(
      value,
      expectedProjectId,
      expectedFactId,
    );
  } catch {
    fail("provider_response_invalid", CONTEXT_QUERY_FAILED);
  }
}

function parseDefinitionResponse(
  value: unknown,
  projectId: string,
  definitionId: string,
) {
  try {
    return parseVenueFactDefinitionRow(value, projectId, definitionId);
  } catch {
    fail("provider_response_invalid", CONTEXT_QUERY_FAILED);
  }
}

async function rpcData(
  client: SupabaseVenueFactEvidenceClientLike,
  name: EvidenceRpcName,
  args: Readonly<Record<string, unknown>>,
  message: string,
): Promise<unknown> {
  const result = await providerResult(() => client.rpc(name, args), message);
  return providerData(result, message);
}

function sourceData(
  value: unknown,
  projectId: string,
  sourceId: string | null,
): VenueFactSourceRecord {
  try {
    return parseVenueFactSourceRow(value, projectId, sourceId);
  } catch {
    fail("provider_response_invalid", SOURCE_MUTATION_FAILED);
  }
}

function observationData(
  value: unknown,
  context: VenueFactContext,
): VenueFactObservationRecord {
  try {
    return parseVenueFactObservationRow(value, context);
  } catch {
    fail("provider_response_invalid", OBSERVATION_MUTATION_FAILED);
  }
}

function linkData(
  value: unknown,
  input: LinkObservationSourceInput,
): ObservationSourceLinkRecord {
  try {
    return parseObservationSourceLinkRow(
      value,
      input.projectId,
      input.observationId,
      input.sourceId,
    );
  } catch {
    fail("provider_response_invalid", LINK_MUTATION_FAILED);
  }
}

function resolutionData(
  value: unknown,
  input: ResolveVenueFactObservationInput,
  context: VenueFactContext,
): ResolvedVenueFactRecord {
  try {
    return parseResolvedVenueFactEvidenceRow(
      value,
      context,
      input.observationId,
    );
  } catch {
    fail("provider_response_invalid", RESOLUTION_MUTATION_FAILED);
  }
}

function sourcePayload(
  input: CreateVenueFactSourceInput | UpdateVenueFactSourceInput,
): Readonly<Record<string, unknown>> {
  return {
    target_project_id: input.projectId,
    target_source_type: input.sourceType,
    target_title: input.title,
    target_url: input.url,
    target_evidence_level: input.evidenceLevel,
    target_observed_at: input.observedAt,
    target_notes: input.notes,
    target_status: input.status,
  };
}

export class SupabaseVenueFactEvidenceAdapter implements VenueFactEvidencePort {
  constructor(private readonly client: SupabaseVenueFactEvidenceClientLike) {}

  async getFactContext(
    projectId: string,
    factId: string,
  ): Promise<VenueFactContext> {
    const identity = parseContextResponse(
      await querySingle(this.client, "facts", FACT_CONTEXT_COLUMNS, [
        ["project_id", projectId],
        ["id", factId],
      ]),
      projectId,
      factId,
    );
    const definition = parseDefinitionResponse(
      await querySingle(this.client, "fact_definitions", DEFINITION_COLUMNS, [
        ["project_id", projectId],
        ["id", identity.definitionId],
      ]),
      projectId,
      identity.definitionId,
    );
    try {
      return venueFactContextFromIdentity(identity, definition);
    } catch {
      fail("provider_response_invalid", CONTEXT_QUERY_FAILED);
    }
  }

  async createSource(
    input: CreateVenueFactSourceInput,
  ): Promise<VenueFactSourceRecord> {
    const data = await rpcData(
      this.client,
      "create_venue_fact_source",
      sourcePayload(input),
      SOURCE_MUTATION_FAILED,
    );
    return sourceData(data, input.projectId, null);
  }

  async updateSource(
    input: UpdateVenueFactSourceInput,
  ): Promise<VenueFactSourceRecord> {
    const data = await rpcData(
      this.client,
      "update_venue_fact_source",
      {
        ...sourcePayload(input),
        target_source_id: input.sourceId,
        target_expected_revision: input.expectedRevision,
      },
      SOURCE_MUTATION_FAILED,
    );
    return sourceData(data, input.projectId, input.sourceId);
  }

  async appendObservation(
    input: AppendVenueFactObservationInput,
  ): Promise<VenueFactObservationRecord> {
    const context = await this.getFactContext(input.projectId, input.factId);
    const data = await rpcData(
      this.client,
      "append_venue_fact_observation",
      {
        target_project_id: input.projectId,
        target_fact_id: input.factId,
        target_value: input.value,
        target_raw_value_text: input.rawValueText,
        target_evidence_level: input.evidenceLevel,
        target_confidence: input.confidence,
        target_observed_at: input.observedAt,
        target_note: input.note,
        target_supersedes_observation_id: input.supersedesObservationId,
      },
      OBSERVATION_MUTATION_FAILED,
    );
    return observationData(data, context);
  }

  async linkObservationSource(
    input: LinkObservationSourceInput,
  ): Promise<ObservationSourceLinkRecord> {
    const data = await rpcData(
      this.client,
      "link_venue_fact_observation_source",
      {
        target_project_id: input.projectId,
        target_observation_id: input.observationId,
        target_source_id: input.sourceId,
        target_is_primary: input.isPrimary,
      },
      LINK_MUTATION_FAILED,
    );
    return linkData(data, input);
  }

  async resolveFromObservation(
    input: ResolveVenueFactObservationInput,
  ): Promise<ResolvedVenueFactRecord> {
    const context = await this.getFactContext(input.projectId, input.factId);
    const data = await rpcData(
      this.client,
      "resolve_venue_fact_from_observation",
      {
        target_project_id: input.projectId,
        target_fact_id: input.factId,
        target_observation_id: input.observationId,
        target_expected_revision: input.expectedRevision,
        target_state: input.state,
        target_resolution_note: input.resolutionNote,
      },
      RESOLUTION_MUTATION_FAILED,
    );
    return resolutionData(data, input, context);
  }
}
