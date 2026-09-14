import { describe, expect, it, vi } from "vitest";
import { SupabasePrivateDocumentLifecycleAdapter } from "./supabase-private-document-lifecycle-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
const venueId = "44444444-4444-4444-8444-444444444444";
const linkId = "55555555-5555-4555-8555-555555555555";
const sha256 = "a".repeat(64);

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: documentId,
    project_id: projectId,
    document_type: "venue_contract",
    title: "Venue contract",
    storage_path: `${projectId}/documents/${documentId}/original`,
    original_filename: "contract.pdf",
    mime_type: "application/pdf",
    size_bytes: 8,
    sha256,
    classification: "private",
    upload_status: "ready",
    source_id: null,
    deleted_at: null,
    revision: 2,
    ...overrides,
  };
}

function linkRow() {
  return {
    id: linkId,
    project_id: projectId,
    document_id: documentId,
    target_type: "venue",
    target_id: venueId,
    relationship_type: null,
  };
}

function rpcClient(data: unknown, error: unknown = null) {
  return { rpc: vi.fn().mockResolvedValue({ data, error }) };
}

const identity = { operationId, projectId, documentId };
const transition = { ...identity, expectedRevision: 2 };
const linkInput = { ...transition, venueId, linkId };

describe("SupabasePrivateDocumentLifecycleAdapter action coverage", () => {
  it("finalizes a ready document", async () => {
    const client = rpcClient({
      action: "finalize_upload",
      replayed: false,
      document: row(),
    });
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(client);
    await expect(adapter.finalizeUpload(identity)).resolves.toMatchObject({
      document: { uploadStatus: "ready" },
    });
    expect(client.rpc).toHaveBeenCalledWith(
      "manage_private_document",
      expect.objectContaining({ target_action: "finalize_upload" }),
    );
  });

  it("abandons an absent pending reservation", async () => {
    const client = rpcClient({
      action: "abandon_upload",
      replayed: false,
      projectId,
      documentId,
      absent: true,
    });
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(client);
    await expect(adapter.abandonUpload(identity)).resolves.toEqual({
      replayed: false,
      projectId,
      documentId,
      absent: true,
    });
  });

  it("links a ready document to a Venue", async () => {
    const client = rpcClient({
      action: "link_venue",
      replayed: false,
      document: row({ revision: 3 }),
      link: linkRow(),
    });
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(client);
    await expect(adapter.linkVenue(linkInput)).resolves.toMatchObject({
      link: { id: linkId, venueId },
    });
    expect(client.rpc).toHaveBeenCalledWith(
      "manage_private_document",
      expect.objectContaining({
        target_action: "link_venue",
        target_venue_id: venueId,
        target_link_id: linkId,
        target_expected_revision: 2,
      }),
    );
  });

  it("unlinks a ready document from a Venue", async () => {
    const client = rpcClient({
      action: "unlink_venue",
      replayed: false,
      document: row({ revision: 3 }),
      linkId,
      absent: true,
    });
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(client);
    await expect(adapter.unlinkVenue(linkInput)).resolves.toMatchObject({
      linkId,
      absent: true,
    });
  });
});

describe("SupabasePrivateDocumentLifecycleAdapter transition coverage", () => {
  it("soft-deletes a ready document", async () => {
    const client = rpcClient({
      action: "soft_delete",
      replayed: false,
      document: row({ deleted_at: "2026-09-14T00:00:00.000Z", revision: 3 }),
    });
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(client);
    await expect(adapter.softDelete(transition)).resolves.toMatchObject({
      document: { deletedAt: expect.any(String) },
    });
    expect(client.rpc).toHaveBeenCalledWith(
      "manage_private_document",
      expect.objectContaining({
        target_action: "soft_delete",
        target_expected_revision: 2,
      }),
    );
  });

  it("restores the same ready document", async () => {
    const client = rpcClient({
      action: "restore",
      replayed: false,
      document: row({ revision: 4 }),
    });
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(client);
    await expect(adapter.restore(transition)).resolves.toMatchObject({
      document: { deletedAt: null },
    });
    expect(client.rpc).toHaveBeenCalledWith(
      "manage_private_document",
      expect.objectContaining({ target_action: "restore" }),
    );
  });
});

describe("SupabasePrivateDocumentLifecycleAdapter RPC error coverage", () => {
  it("maps a rejected RPC call to persistence_failed", async () => {
    const client = { rpc: vi.fn().mockRejectedValue(new Error("network")) };
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(client);
    await expect(adapter.finalizeUpload(identity)).rejects.toMatchObject({
      code: "persistence_failed",
    });
  });

  it.each([
    [{ code: "23505", message: "unique" }, "conflict"],
    [{ code: "40001", message: "stale" }, "conflict"],
    [{ code: "22023", message: "invalid" }, "persistence_failed"],
    [42, "persistence_failed"],
  ] as const)("maps provider error %# to %s", async (error, expected) => {
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(
      rpcClient(null, error),
    );
    await expect(adapter.finalizeUpload(identity)).rejects.toMatchObject({
      code: expected,
    });
  });
});
