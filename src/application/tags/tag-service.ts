import type {
  ProjectTagRecord,
  VenueTagAssignmentRecord,
} from "@domain/tags/project-tag";
import { normalizeTagKey, normalizeTagLabel } from "@domain/tags/project-tag";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";
import {
  TagPersistenceError,
  type ChangeTagInput,
  type TagPort,
  type VenueTagLinkInput,
} from "./tag-port";

type TagError =
  | "invalid_identity"
  | "invalid_key"
  | "invalid_label"
  | "invalid_revision"
  | "conflict"
  | "persistence_failed";
export type TagResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: TagError };

export interface TagDraft {
  readonly projectId: unknown;
  readonly tagId: unknown;
  readonly key: unknown;
  readonly label: unknown;
}

export interface TagChangeDraft {
  readonly projectId: unknown;
  readonly tagId: unknown;
  readonly expectedRevision: unknown;
  readonly label?: unknown;
}

export interface VenueTagDraft {
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly tagId: unknown;
  readonly linkId: unknown;
}

export interface VenueTagView {
  readonly assignment: VenueTagAssignmentRecord;
  readonly tag: ProjectTagRecord;
}

function persistenceError(error: unknown): TagError {
  return error instanceof TagPersistenceError
    ? error.code
    : "persistence_failed";
}

function isRevision(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1;
}

function isChangeIdentity(
  draft: TagChangeDraft,
): draft is TagChangeDraft & { projectId: string; tagId: string } {
  return (
    isVenueCommercialUuid(draft.projectId) && isVenueCommercialUuid(draft.tagId)
  );
}

function isLinkIdentity(
  draft: VenueTagDraft,
): draft is VenueTagDraft & VenueTagLinkInput {
  return (
    isVenueCommercialUuid(draft.projectId) &&
    isVenueCommercialUuid(draft.venueId) &&
    isVenueCommercialUuid(draft.tagId) &&
    isVenueCommercialUuid(draft.linkId)
  );
}

export class TagService {
  constructor(private readonly port: TagPort) {}

  async createTag(draft: TagDraft): Promise<TagResult<ProjectTagRecord>> {
    if (
      !isVenueCommercialUuid(draft.projectId) ||
      !isVenueCommercialUuid(draft.tagId)
    ) {
      return { ok: false, error: "invalid_identity" };
    }
    const key = normalizeTagKey(draft.key);
    if (key === null) return { ok: false, error: "invalid_key" };
    const label = normalizeTagLabel(draft.label);
    if (label === null) return { ok: false, error: "invalid_label" };
    try {
      return {
        ok: true,
        value: await this.port.createTag({
          projectId: draft.projectId,
          tagId: draft.tagId,
          key,
          label,
        }),
      };
    } catch (error) {
      return { ok: false, error: persistenceError(error) };
    }
  }

  async renameTag(draft: TagChangeDraft): Promise<TagResult<ProjectTagRecord>> {
    const prepared = this.prepareChange(draft, "rename");
    if (!prepared.ok) return prepared;
    const label = normalizeTagLabel(draft.label);
    if (label === null) return { ok: false, error: "invalid_label" };
    return this.changeTag({ ...prepared.value, label });
  }

  async softDeleteTag(
    draft: TagChangeDraft,
  ): Promise<TagResult<ProjectTagRecord>> {
    const prepared = this.prepareChange(draft, "soft_delete");
    return prepared.ok ? this.changeTag(prepared.value) : prepared;
  }

  async restoreTag(
    draft: TagChangeDraft,
  ): Promise<TagResult<ProjectTagRecord>> {
    const prepared = this.prepareChange(draft, "restore");
    return prepared.ok ? this.changeTag(prepared.value) : prepared;
  }

  async listActiveTags(
    projectId: unknown,
  ): Promise<TagResult<readonly ProjectTagRecord[]>> {
    if (!isVenueCommercialUuid(projectId)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      return { ok: true, value: await this.port.listActiveTags(projectId) };
    } catch (error) {
      return { ok: false, error: persistenceError(error) };
    }
  }

  async linkVenueTag(
    draft: VenueTagDraft,
  ): Promise<TagResult<VenueTagAssignmentRecord>> {
    if (!isLinkIdentity(draft)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      return { ok: true, value: await this.port.linkVenueTag(draft) };
    } catch (error) {
      return { ok: false, error: persistenceError(error) };
    }
  }

  async unlinkVenueTag(draft: VenueTagDraft): Promise<TagResult<true>> {
    if (!isLinkIdentity(draft)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      await this.port.unlinkVenueTag(draft);
      return { ok: true, value: true };
    } catch (error) {
      return { ok: false, error: persistenceError(error) };
    }
  }

  async listVenueTags(
    projectId: unknown,
    venueId: unknown,
  ): Promise<TagResult<readonly VenueTagView[]>> {
    if (!isVenueCommercialUuid(projectId) || !isVenueCommercialUuid(venueId)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      const [tags, assignments] = await Promise.all([
        this.port.listActiveTags(projectId),
        this.port.listVenueAssignments(projectId, venueId),
      ]);
      const byId = new Map(tags.map((tag) => [tag.id, tag]));
      const views = assignments.map((assignment) => {
        const tag = byId.get(assignment.tagId);
        if (tag === undefined) {
          throw new TagPersistenceError("persistence_failed");
        }
        return { assignment, tag };
      });
      return { ok: true, value: views };
    } catch (error) {
      return { ok: false, error: persistenceError(error) };
    }
  }

  private prepareChange(
    draft: TagChangeDraft,
    action: ChangeTagInput["action"],
  ): TagResult<ChangeTagInput> {
    if (!isChangeIdentity(draft)) {
      return { ok: false, error: "invalid_identity" };
    }
    if (!isRevision(draft.expectedRevision)) {
      return { ok: false, error: "invalid_revision" };
    }
    return {
      ok: true,
      value: {
        projectId: draft.projectId,
        tagId: draft.tagId,
        expectedRevision: draft.expectedRevision,
        action,
      },
    };
  }

  private async changeTag(
    input: ChangeTagInput,
  ): Promise<TagResult<ProjectTagRecord>> {
    try {
      return { ok: true, value: await this.port.changeTag(input) };
    } catch (error) {
      return { ok: false, error: persistenceError(error) };
    }
  }
}
