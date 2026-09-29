import type {
  ProjectTagRecord,
  VenueTagAssignmentRecord,
} from "@domain/tags/project-tag";

export interface CreateTagInput {
  readonly projectId: string;
  readonly tagId: string;
  readonly key: string;
  readonly label: string;
}

export interface ChangeTagInput {
  readonly projectId: string;
  readonly tagId: string;
  readonly expectedRevision: number;
  readonly action: "rename" | "soft_delete" | "restore";
  readonly label?: string;
}

export interface VenueTagLinkInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly tagId: string;
  readonly linkId: string;
}

export interface TagPort {
  createTag(input: CreateTagInput): Promise<ProjectTagRecord>;
  changeTag(input: ChangeTagInput): Promise<ProjectTagRecord>;
  listActiveTags(projectId: string): Promise<readonly ProjectTagRecord[]>;
  linkVenueTag(input: VenueTagLinkInput): Promise<VenueTagAssignmentRecord>;
  unlinkVenueTag(input: VenueTagLinkInput): Promise<void>;
  listVenueAssignments(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueTagAssignmentRecord[]>;
}

export class TagPersistenceError extends Error {
  constructor(readonly code: "conflict" | "persistence_failed") {
    super("Project tag persistence failed.");
  }
}
