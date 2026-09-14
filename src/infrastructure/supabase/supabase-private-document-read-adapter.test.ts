import { describe, expect, it, vi } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import { SupabasePrivateDocumentReadAdapter } from "./supabase-private-document-read-adapter";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const venueId = "55555555-5555-4555-8555-555555555555";
const path = `${projectId}/documents/${documentId}/original`;
const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);

interface ProviderResult {
  readonly data: unknown;
  readonly error: unknown;
}

interface QueryFake extends PromiseLike<ProviderResult> {
  readonly operations: string[];
  eq(column: string, value: string): QueryFake;
  in(column: string, values: readonly string[]): QueryFake;
  is(column: string, value: null): QueryFake;
  maybeSingle(): PromiseLike<ProviderResult>;
}

function query(result: ProviderResult): QueryFake {
  const operations: string[] = [];
  const builder: QueryFake = {
    operations,
    eq(column, value) {
      operations.push(`eq:${column}:${value}`);
      return builder;
    },
    in(column, values) {
      operations.push(`in:${column}:${values.join(",")}`);
      return builder;
    },
    is(column, value) {
      operations.push(`is:${column}:${String(value)}`);
      return builder;
    },
    maybeSingle() {
      return Promise.resolve(result);
    },
    then(onfulfilled, onrejected) {
      return Promise.resolve(result).then(onfulfilled, onrejected);
    },
  };
  return builder;
}

function documentRow() {
  return {
    id: documentId,
    project_id: projectId,
    document_type: "venue_contract",
    title: "Venue contract",
    storage_path: path,
    original_filename: "contract.pdf",
    mime_type: "application/pdf",
    size_bytes: bytes.byteLength,
    sha256: "a".repeat(64),
    classification: "private",
    upload_status: "ready",
    source_id: null,
    deleted_at: null,
    revision: 2,
  };
}

function linkRow() {
  return {
    project_id: projectId,
    document_id: documentId,
    target_type: "venue",
    target_id: venueId,
    relationship_type: null,
  };
}

function fakeClient(
  queryResults: ProviderResult[],
  storageResult: ProviderResult = {
    data: { arrayBuffer: async () => bytes.slice().buffer },
    error: null,
  },
) {
  const pending = [...queryResults];
  const queries: QueryFake[] = [];
  const download = vi.fn().mockResolvedValue(storageResult);
  const from = vi.fn((_table: string) => ({
    select: vi.fn((_columns: string) => {
      const next = pending.shift() ?? {
        data: null,
        error: new Error("missing plan"),
      };
      const builder = query(next);
      queries.push(builder);
      return builder;
    }),
  }));
  const storageFrom = vi.fn((_bucket: string) => ({ download }));
  return {
    client: { from, storage: { from: storageFrom } },
    queries,
    from,
    storageFrom,
    download,
  };
}

function expectPersistenceCode(
  run: Promise<unknown>,
  code: DocumentPersistenceError["code"],
): Promise<void> {
  return expect(run).rejects.toMatchObject({
    name: "DocumentPersistenceError",
    code,
  } satisfies Partial<DocumentPersistenceError>);
}

describe("SupabasePrivateDocumentReadAdapter queries", () => {
  it("lists active documents linked to the requested Venue", async () => {
    const fake = fakeClient([
      { data: [linkRow()], error: null },
      { data: [documentRow()], error: null },
    ]);
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);

    await expect(
      adapter.listVenueDocuments(projectId, venueId),
    ).resolves.toMatchObject([
      { id: documentId, projectId, uploadStatus: "ready", deletedAt: null },
    ]);
    expect(fake.queries[0]?.operations).toEqual([
      `eq:project_id:${projectId}`,
      "eq:target_type:venue",
      `eq:target_id:${venueId}`,
    ]);
    expect(fake.queries[1]?.operations).toEqual([
      `eq:project_id:${projectId}`,
      "eq:upload_status:ready",
      "is:deleted_at:null",
      `in:id:${documentId}`,
    ]);
  });

  it("returns an empty list without querying documents when no links are visible", async () => {
    const fake = fakeClient([{ data: [], error: null }]);
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);

    await expect(
      adapter.listVenueDocuments(projectId, venueId),
    ).resolves.toEqual([]);
    expect(fake.from).toHaveBeenCalledTimes(1);
  });

  it("gets one active document with project and lifecycle filters", async () => {
    const fake = fakeClient([{ data: documentRow(), error: null }]);
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);

    await expect(
      adapter.getActiveDocument(projectId, documentId),
    ).resolves.toMatchObject({
      id: documentId,
      projectId,
    });
    expect(fake.queries[0]?.operations).toEqual([
      `eq:project_id:${projectId}`,
      `eq:id:${documentId}`,
      "eq:upload_status:ready",
      "is:deleted_at:null",
    ]);
  });

  it("keeps an RLS-filtered miss non-disclosing", async () => {
    const fake = fakeClient([{ data: null, error: null }]);
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);
    await expect(
      adapter.getActiveDocument(projectId, documentId),
    ).resolves.toBeNull();
  });

  it("maps provider query failures without leaking details", async () => {
    const fake = fakeClient([
      { data: null, error: { message: "provider detail" } },
    ]);
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);
    await expectPersistenceCode(
      adapter.getActiveDocument(projectId, documentId),
      "persistence_failed",
    );
  });
});

describe("SupabasePrivateDocumentReadAdapter downloads", () => {
  it("downloads exact bytes from the private bucket", async () => {
    const fake = fakeClient([]);
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);

    await expect(adapter.download(path)).resolves.toEqual(bytes);
    expect(fake.storageFrom).toHaveBeenCalledWith("project-private");
    expect(fake.download).toHaveBeenCalledWith(path);
  });

  it("rejects a non-canonical document path before Storage access", async () => {
    const fake = fakeClient([]);
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);
    await expectPersistenceCode(
      adapter.download(`${path}/extra`),
      "provider_response_invalid",
    );
    expect(fake.download).not.toHaveBeenCalled();
  });

  it("maps Storage errors to retryable failure", async () => {
    const fake = fakeClient([], {
      data: null,
      error: { message: "provider detail" },
    });
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);
    await expectPersistenceCode(adapter.download(path), "storage_retryable");
  });

  it("rejects malformed Storage download data", async () => {
    const fake = fakeClient([], { data: { nope: true }, error: null });
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);
    await expectPersistenceCode(
      adapter.download(path),
      "provider_response_invalid",
    );
  });

  it("maps binary materialization failures to retryable failure", async () => {
    const fake = fakeClient([], {
      data: {
        arrayBuffer: async () => {
          throw new Error("provider detail");
        },
      },
      error: null,
    });
    const adapter = new SupabasePrivateDocumentReadAdapter(fake.client);
    await expectPersistenceCode(adapter.download(path), "storage_retryable");
  });
});
