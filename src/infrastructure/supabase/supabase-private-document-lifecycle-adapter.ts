import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import type {
  LinkPrivateDocumentVenueInput,
  PrivateDocumentIdentityInput,
  PrivateDocumentLifecyclePort,
  ReservePrivateDocumentInput,
  TransitionPrivateDocumentInput,
} from "@application/documents/private-document-lifecycle-port";
import {
  parsePrivateDocumentAbandonReceipt,
  parsePrivateDocumentLinkReceipt,
  parsePrivateDocumentReceipt,
  parsePrivateDocumentUnlinkReceipt,
} from "./parse-private-document-receipt";

interface SupabaseResult {
  readonly data: unknown;
  readonly error: unknown;
}

export interface SupabasePrivateDocumentClientLike {
  rpc(
    functionName: "manage_private_document",
    args: Readonly<Record<string, unknown>>,
  ): PromiseLike<SupabaseResult>;
}

function isConflictError(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const code = (value as Record<string, unknown>).code;
  return code === "23505" || code === "40001";
}

function baseArgs(
  action: string,
  input: PrivateDocumentIdentityInput,
): Record<string, unknown> {
  return {
    target_action: action,
    target_operation_id: input.operationId,
    target_project_id: input.projectId,
    target_document_id: input.documentId,
    target_venue_id: null,
    target_link_id: null,
    target_expected_revision: null,
    target_document_type: null,
    target_title: null,
    target_original_filename: null,
    target_mime_type: null,
    target_size_bytes: null,
    target_sha256: null,
    target_source_id: null,
  };
}

async function callRpc(
  client: SupabasePrivateDocumentClientLike,
  args: Readonly<Record<string, unknown>>,
): Promise<unknown> {
  let result: SupabaseResult;
  try {
    result = await client.rpc("manage_private_document", args);
  } catch {
    throw new DocumentPersistenceError(
      "persistence_failed",
      "Private document persistence failed.",
    );
  }
  if (result.error !== null) {
    throw new DocumentPersistenceError(
      isConflictError(result.error) ? "conflict" : "persistence_failed",
      "Private document persistence failed.",
    );
  }
  return result.data;
}

function linkArgs(
  action: "link_venue" | "unlink_venue",
  input: LinkPrivateDocumentVenueInput,
): Record<string, unknown> {
  return {
    ...baseArgs(action, input),
    target_venue_id: input.venueId,
    target_link_id: input.linkId,
    target_expected_revision: input.expectedRevision,
  };
}

function transitionArgs(
  action: "soft_delete" | "restore",
  input: TransitionPrivateDocumentInput,
): Record<string, unknown> {
  return {
    ...baseArgs(action, input),
    target_expected_revision: input.expectedRevision,
  };
}

export class SupabasePrivateDocumentLifecycleAdapter implements PrivateDocumentLifecyclePort {
  constructor(private readonly client: SupabasePrivateDocumentClientLike) {}

  async reserveUpload(input: ReservePrivateDocumentInput) {
    const data = await callRpc(this.client, {
      ...baseArgs("reserve_upload", input),
      target_document_type: input.documentType,
      target_title: input.title,
      target_original_filename: input.originalFilename,
      target_mime_type: input.mimeType,
      target_size_bytes: input.sizeBytes,
      target_sha256: input.sha256,
      target_source_id: input.sourceId,
    });
    return parsePrivateDocumentReceipt(data, "reserve_upload", input);
  }

  async finalizeUpload(input: PrivateDocumentIdentityInput) {
    const data = await callRpc(this.client, baseArgs("finalize_upload", input));
    return parsePrivateDocumentReceipt(data, "finalize_upload", input);
  }

  async abandonUpload(input: PrivateDocumentIdentityInput) {
    const data = await callRpc(this.client, baseArgs("abandon_upload", input));
    return parsePrivateDocumentAbandonReceipt(data, input);
  }

  async linkVenue(input: LinkPrivateDocumentVenueInput) {
    const data = await callRpc(this.client, linkArgs("link_venue", input));
    return parsePrivateDocumentLinkReceipt(data, input);
  }

  async unlinkVenue(input: LinkPrivateDocumentVenueInput) {
    const data = await callRpc(this.client, linkArgs("unlink_venue", input));
    return parsePrivateDocumentUnlinkReceipt(data, input);
  }

  async softDelete(input: TransitionPrivateDocumentInput) {
    const data = await callRpc(
      this.client,
      transitionArgs("soft_delete", input),
    );
    return parsePrivateDocumentReceipt(data, "soft_delete", input);
  }

  async restore(input: TransitionPrivateDocumentInput) {
    const data = await callRpc(this.client, transitionArgs("restore", input));
    return parsePrivateDocumentReceipt(data, "restore", input);
  }
}
