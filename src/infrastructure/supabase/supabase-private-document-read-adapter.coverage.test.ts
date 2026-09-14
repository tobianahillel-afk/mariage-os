import { describe, expect, it } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import {
  SupabasePrivateDocumentReadAdapter,
  type SupabasePrivateDocumentReadClientLike,
} from "./supabase-private-document-read-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const otherDocumentId = "77777777-7777-4777-8777-777777777777";
const venueId = "55555555-5555-4555-8555-555555555555";
const path = `${projectId}/documents/${documentId}/original`;

function row(id = documentId) {
  return {
    id,
    project_id: projectId,
    document_type: "venue_contract",
    title: "Venue contract",
    storage_path: `${projectId}/documents/${id}/original`,
    original_filename: "contract.pdf",
    mime_type: "application/pdf",
    size_bytes: 6,
    sha256: "a".repeat(64),
    classification: "private",
    upload_status: "ready",
    source_id: null,
    deleted_at: null,
    revision: 2,
  };
}

function link() {
  return {
    project_id: projectId,
    document_id: documentId,
    target_type: "venue",
    target_id: venueId,
    relationship_type: null,
  };
}

function queryBuilder(result: { data: unknown; error: unknown }) {
  const builder = {
    eq() {
      return builder;
    },
    in() {
      return builder;
    },
    is() {
      return builder;
    },
    maybeSingle() {
      return Promise.resolve(result);
    },
    then(onfulfilled: (value: typeof result) => unknown, onrejected?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };
  return builder;
}

function sequentialClient(results: readonly { data: unknown; error: unknown }[]) {
  const pending = [...results];
  return {
    from: () => ({
      select: () => queryBuilder(pending.shift() ?? { data: null, error: new Error("missing plan") }),
    }),
    storage: {
      from: () => ({ download: async () => ({ data: null, error: null }) }),
    },
  } as unknown as SupabasePrivateDocumentReadClientLike;
}

function storageClient(download: () => Promise<{ data: unknown; error: unknown }>) {
  return {
    from: () => ({ select: () => queryBuilder({ data: null, error: null }) }),
    storage: { from: () => ({ download }) },
  } as unknown as SupabasePrivateDocumentReadClientLike;
}

async function expectCode(run: Promise<unknown>, code: DocumentPersistenceError["code"]) {
  await expect(run).rejects.toMatchObject({
    name: "DocumentPersistenceError",
    code,
  });
}

describe("SupabasePrivateDocumentReadAdapter query coverage", () => {
  it("maps a rejected provider promise to persistence_failed", async () => {
    const rejecting = {
      eq() {
        return rejecting;
      },
      in() {
        return rejecting;
      },
      is() {
        return rejecting;
      },
      maybeSingle() {
        return Promise.reject(new Error("provider detail"));
      },
      then() {
        return Promise.reject(new Error("provider detail"));
      },
    };
    const client = {
      from: () => ({ select: () => rejecting }),
      storage: { from: () => ({ download: async () => ({ data: null, error: null }) }) },
    } as unknown as SupabasePrivateDocumentReadClientLike;

    await expectCode(
      new SupabasePrivateDocumentReadAdapter(client).getActiveDocument(projectId, documentId),
      "persistence_failed",
    );
  });

  it("rejects a non-array document-list response", async () => {
    const client = sequentialClient([
      { data: [link()], error: null },
      { data: null, error: null },
    ]);
    await expectCode(
      new SupabasePrivateDocumentReadAdapter(client).listVenueDocuments(projectId, venueId),
      "provider_response_invalid",
    );
  });

  it("rejects a document row not present in the validated link set", async () => {
    const client = sequentialClient([
      { data: [link()], error: null },
      { data: [row(otherDocumentId)], error: null },
    ]);
    await expectCode(
      new SupabasePrivateDocumentReadAdapter(client).listVenueDocuments(projectId, venueId),
      "provider_response_invalid",
    );
  });
});

describe("SupabasePrivateDocumentReadAdapter Storage coverage", () => {
  it("maps a thrown Storage download to storage_retryable", async () => {
    const client = storageClient(async () => {
      throw new Error("provider detail");
    });
    await expectCode(
      new SupabasePrivateDocumentReadAdapter(client).download(path),
      "storage_retryable",
    );
  });

  it.each([null, 42, { arrayBuffer: "not-a-function" }])(
    "rejects malformed binary provider data %#",
    async (data) => {
      const client = storageClient(async () => ({ data, error: null }));
      await expectCode(
        new SupabasePrivateDocumentReadAdapter(client).download(path),
        "provider_response_invalid",
      );
    },
  );

  it("rejects a non-ArrayBuffer materialization result", async () => {
    const client = storageClient(async () => ({
      data: {
        arrayBuffer: async () => "not-a-buffer" as unknown as ArrayBuffer,
      },
      error: null,
    }));
    await expectCode(
      new SupabasePrivateDocumentReadAdapter(client).download(path),
      "provider_response_invalid",
    );
  });
});
