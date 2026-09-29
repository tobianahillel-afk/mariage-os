import {
  TagPersistenceError,
  type ChangeTagInput,
  type CreateTagInput,
  type TagPort,
  type VenueTagLinkInput,
} from "@application/tags/tag-port";
import type {
  ProjectTagRecord,
  VenueTagAssignmentRecord,
} from "@domain/tags/project-tag";
import {
  parseProjectTagRow,
  parseVenueTagAssignmentRow,
} from "./parse-project-tag-row";

const TAG_COLUMNS = "id,project_id,key,label,revision,deleted_at";
const LINK_COLUMNS = "id,project_id,tag_id,target_type,target_id";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface TagQuery extends PromiseLike<SupabaseResult> {
  eq(column: string, value: string | number): TagQuery;
  is(column: string, value: null): TagQuery;
  not(column: string, operator: "is", value: null): TagQuery;
  select(columns: string): TagQuery;
}

interface TagTable {
  select(columns: string): TagQuery;
  insert(value: Readonly<Record<string, unknown>>): TagQuery;
  update(value: Readonly<Record<string, unknown>>): TagQuery;
  delete(): TagQuery;
}

export interface SupabaseTagClientLike {
  from(table: "tags" | "entity_tags"): TagTable;
}

function providerCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null) return null;
  const code = (error as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

function providerFailure(error: unknown): TagPersistenceError {
  const code = providerCode(error);
  return new TagPersistenceError(
    code === "23505" || code === "40001" ? "conflict" : "persistence_failed",
  );
}

function oneRow(value: unknown): unknown {
  if (!Array.isArray(value) || value.length !== 1) {
    throw new TagPersistenceError("conflict");
  }
  return value[0];
}

function parseTag(
  value: unknown,
  projectId: string,
  tagId?: string,
): ProjectTagRecord {
  try {
    return parseProjectTagRow(value, projectId, tagId);
  } catch {
    throw new TagPersistenceError("persistence_failed");
  }
}

function parseLink(
  value: unknown,
  input: Pick<VenueTagLinkInput, "projectId" | "venueId">,
  linkId?: string,
  tagId?: string,
): VenueTagAssignmentRecord {
  try {
    return parseVenueTagAssignmentRow(value, input.projectId, input.venueId, {
      linkId,
      tagId,
    });
  } catch {
    throw new TagPersistenceError("persistence_failed");
  }
}

function listRows(data: unknown): readonly unknown[] {
  if (!Array.isArray(data)) {
    throw new TagPersistenceError("persistence_failed");
  }
  return data;
}

function tagChangePayload(input: ChangeTagInput): Record<string, unknown> {
  if (input.action === "rename") {
    if (input.label === undefined) {
      throw new TagPersistenceError("persistence_failed");
    }
    return { label: input.label };
  }
  return {
    deleted_at: input.action === "restore" ? null : new Date().toISOString(),
  };
}

function tagStateFilter(
  query: TagQuery,
  action: ChangeTagInput["action"],
): TagQuery {
  return action === "restore"
    ? query.not("deleted_at", "is", null)
    : query.is("deleted_at", null);
}

function tagChangeMatches(
  record: ProjectTagRecord,
  input: ChangeTagInput,
): boolean {
  if (record.revision !== input.expectedRevision + 1) return false;
  if (input.action === "restore") return record.deletedAt === null;
  if (input.action === "soft_delete") return record.deletedAt !== null;
  return record.label === input.label && record.deletedAt === null;
}

export class SupabaseTagAdapter implements TagPort {
  constructor(private readonly client: SupabaseTagClientLike) {}

  async createTag(input: CreateTagInput): Promise<ProjectTagRecord> {
    const { data, error } = await this.client
      .from("tags")
      .insert({
        id: input.tagId,
        project_id: input.projectId,
        key: input.key,
        label: input.label,
      })
      .select(TAG_COLUMNS);
    if (error !== null) throw providerFailure(error);
    const record = parseTag(oneRow(data), input.projectId, input.tagId);
    if (
      record.key !== input.key ||
      record.label !== input.label ||
      record.deletedAt !== null ||
      record.revision !== 1
    ) {
      throw new TagPersistenceError("persistence_failed");
    }
    return record;
  }

  async changeTag(input: ChangeTagInput): Promise<ProjectTagRecord> {
    const query = this.client
      .from("tags")
      .update(tagChangePayload(input))
      .eq("project_id", input.projectId)
      .eq("id", input.tagId)
      .eq("revision", input.expectedRevision);
    const { data, error } = await tagStateFilter(query, input.action).select(
      TAG_COLUMNS,
    );
    if (error !== null) throw providerFailure(error);
    const record = parseTag(oneRow(data), input.projectId, input.tagId);
    if (!tagChangeMatches(record, input)) {
      throw new TagPersistenceError("persistence_failed");
    }
    return record;
  }

  async listActiveTags(
    projectId: string,
  ): Promise<readonly ProjectTagRecord[]> {
    const { data, error } = await this.client
      .from("tags")
      .select(TAG_COLUMNS)
      .eq("project_id", projectId)
      .is("deleted_at", null);
    if (error !== null) throw providerFailure(error);
    const ids = new Set<string>();
    const keys = new Set<string>();
    return listRows(data).map((row) => {
      const record = parseTag(row, projectId);
      if (
        record.deletedAt !== null ||
        ids.has(record.id) ||
        keys.has(record.key)
      ) {
        throw new TagPersistenceError("persistence_failed");
      }
      ids.add(record.id);
      keys.add(record.key);
      return record;
    });
  }

  async linkVenueTag(
    input: VenueTagLinkInput,
  ): Promise<VenueTagAssignmentRecord> {
    const { data, error } = await this.client
      .from("entity_tags")
      .insert({
        id: input.linkId,
        project_id: input.projectId,
        tag_id: input.tagId,
        target_type: "venue",
        target_id: input.venueId,
      })
      .select(LINK_COLUMNS);
    if (error !== null) throw providerFailure(error);
    return parseLink(oneRow(data), input, input.linkId, input.tagId);
  }

  async unlinkVenueTag(input: VenueTagLinkInput): Promise<void> {
    const { data, error } = await this.client
      .from("entity_tags")
      .delete()
      .eq("project_id", input.projectId)
      .eq("id", input.linkId)
      .eq("tag_id", input.tagId)
      .eq("target_type", "venue")
      .eq("target_id", input.venueId)
      .select(LINK_COLUMNS);
    if (error !== null) throw providerFailure(error);
    parseLink(oneRow(data), input, input.linkId, input.tagId);
  }

  async listVenueAssignments(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueTagAssignmentRecord[]> {
    const { data, error } = await this.client
      .from("entity_tags")
      .select(LINK_COLUMNS)
      .eq("project_id", projectId)
      .eq("target_type", "venue")
      .eq("target_id", venueId);
    if (error !== null) throw providerFailure(error);
    const ids = new Set<string>();
    const tags = new Set<string>();
    return listRows(data).map((row) => {
      const record = parseLink(row, { projectId, venueId });
      if (ids.has(record.id) || tags.has(record.tagId)) {
        throw new TagPersistenceError("persistence_failed");
      }
      ids.add(record.id);
      tags.add(record.tagId);
      return record;
    });
  }
}
