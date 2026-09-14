import { describe, expect, it, vi } from "vitest";
import { SupabasePrivateDocumentLifecycleAdapter } from "./supabase-private-document-lifecycle-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";

function documentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: documentId,
    project_id: projectId,
    document_type: "venue_contract",
    title: "Venue contract",
    storage_path: `${projectId}/documents/${documentId}/original`,
    remote_url: null,
    original_filename: "contract.pdf",
    mime_type: "application/pdf",
    size_bytes: 8,
    sha256: "a".repeat(64),
    classification: "private",
    upload_status: "pending",
    source_id: null,
    deleted_at: null,
    revision: 1,
    ...overrides,
  };
}

function client(data: unknown, error: unknown = null) {
  return { rpc: vi.fn().mockResolvedValue({ data, error }) };
}

const reserveInput = {
  operationId,
  projectId,
  documentId,
  documentType: "venue_contract",
  title: "Venue contract",
  originalFilename: "contract.pdf",
  mimeType: "application/pdf" as const,
  sizeBytes: 8,
  sha256: "a".repeat(64),
  sourceId: null,
};

describe("Supabase private document reservation adapter", () => {
  it("parses an exact reservation receipt and sends the protected RPC shape", async () => {
    const fake = client({
      action: "reserve_upload",
      replayed: false,
      document: documentRow(),
    });
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(fake);

    await expect(adapter.reserveUpload(reserveInput)).resolves.toMatchObject({
      replayed: false,
      document: {
        id: documentId,
        projectId,
        storagePath: `${projectId}/documents/${documentId}/original`,
        uploadStatus: "pending",
      },
    });
    expect(fake.rpc).toHaveBeenCalledWith(
      "manage_private_document",
      expect.objectContaining({
        target_action: "reserve_upload",
        target_operation_id: operationId,
        target_project_id: projectId,
        target_document_id: documentId,
        target_original_filename: "contract.pdf",
        target_sha256: "a".repeat(64),
      }),
    );
  });

  it.each([
    documentRow({ project_id: "99999999-9999-4999-8999-999999999999" }),
    documentRow({
      storage_path: `${projectId}/documents/${documentId}/contract.pdf`,
    }),
    documentRow({ sha256: "A".repeat(64) }),
    documentRow({ original_filename: "other.pdf" }),
  ])(
    "fails closed on substituted or malformed reservation rows",
    async (row) => {
      const adapter = new SupabasePrivateDocumentLifecycleAdapter(
        client({ action: "reserve_upload", replayed: false, document: row }),
      );
      await expect(adapter.reserveUpload(reserveInput)).rejects.toMatchObject({
        code: "provider_response_invalid",
      });
    },
  );
});

describe("Supabase private document transition adapter", () => {
  it("maps stale/conflict SQLSTATE to a conflict without exposing provider details", async () => {
    const adapter = new SupabasePrivateDocumentLifecycleAdapter(
      client(null, { code: "40001", message: "stale private document" }),
    );
    await expect(
      adapter.softDelete({
        operationId,
        projectId,
        documentId,
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({ code: "conflict" });
  });
});
