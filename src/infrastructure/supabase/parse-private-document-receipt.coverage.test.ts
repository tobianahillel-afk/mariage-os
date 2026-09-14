import { describe, expect, it } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import {
  parsePrivateDocumentAbandonReceipt,
  parsePrivateDocumentLinkReceipt,
  parsePrivateDocumentReceipt,
  parsePrivateDocumentUnlinkReceipt,
} from "./parse-private-document-receipt";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
const sourceId = "44444444-4444-4444-8444-444444444444";
const venueId = "55555555-5555-4555-8555-555555555555";
const linkId = "66666666-6666-4666-8666-666666666666";
const otherId = "77777777-7777-4777-8777-777777777777";
const sha256 = "a".repeat(64);

function documentRow(overrides: Record<string, unknown> = {}) {
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
    upload_status: "pending",
    source_id: null,
    deleted_at: null,
    revision: 1,
    ...overrides,
  };
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
  sha256,
  sourceId: null,
};
const identityInput = { operationId, projectId, documentId };
const transitionInput = { ...identityInput, expectedRevision: 2 };
const linkInput = {
  ...transitionInput,
  venueId,
  linkId,
};

function reserveReceipt(document: unknown = documentRow(), replayed: unknown = false) {
  return { action: "reserve_upload", replayed, document };
}

function expectInvalid(run: () => unknown): void {
  expect(run).toThrowError(DocumentPersistenceError);
  try {
    run();
  } catch (error) {
    expect(error).toMatchObject({ code: "provider_response_invalid" });
  }
}

describe("private document parser structural coverage", () => {
  it.each([42, null, []])("rejects non-record receipt %j", (value) => {
    expectInvalid(() => parsePrivateDocumentReceipt(value, "reserve_upload", reserveInput));
  });

  it.each([42, null, []])("rejects non-record document %j", (document) => {
    expectInvalid(() =>
      parsePrivateDocumentReceipt(reserveReceipt(document), "reserve_upload", reserveInput),
    );
  });

  it("accepts valid non-null source and deleted timestamp shapes where applicable", () => {
    const deleted = documentRow({
      upload_status: "ready",
      source_id: sourceId,
      deleted_at: "2026-09-14T00:00:00.000Z",
      revision: 3,
    });
    expect(
      parsePrivateDocumentReceipt(
        { action: "soft_delete", replayed: false, document: deleted },
        "soft_delete",
        transitionInput,
      ),
    ).toMatchObject({ document: { sourceId, deletedAt: expect.any(String), revision: 3 } });
  });
});

describe("private document parser primitive field coverage", () => {
  it.each([
    ["project_id", 42],
    ["project_id", "bad"],
    ["id", 42],
    ["id", "bad"],
    ["revision", "1"],
    ["revision", 1.5],
    ["revision", 0],
    ["revision", Number.MAX_SAFE_INTEGER + 1],
    ["source_id", "bad"],
    ["deleted_at", 42],
  ])("rejects malformed %s", (field, value) => {
    expectInvalid(() =>
      parsePrivateDocumentReceipt(
        reserveReceipt(documentRow({ [field]: value })),
        "reserve_upload",
        reserveInput,
      ),
    );
  });
});

describe("private document parser bounded text coverage", () => {
  it.each([
    ["document_type", 42],
    ["document_type", ""],
    ["document_type", "x".repeat(121)],
    ["document_type", " venue_contract"],
    ["document_type", "bad\u0000type"],
    ["title", 42],
    ["title", ""],
    ["title", "x".repeat(501)],
    ["title", "Venue contract "],
    ["title", "bad\u007ftitle"],
  ])("rejects malformed bounded field %s", (field, value) => {
    expectInvalid(() =>
      parsePrivateDocumentReceipt(
        reserveReceipt(documentRow({ [field]: value })),
        "reserve_upload",
        reserveInput,
      ),
    );
  });
});

describe("private document parser binary metadata coverage", () => {
  it.each([
    ["original_filename", 42],
    ["original_filename", ""],
    ["original_filename", `${"a".repeat(509)}.pdf`],
    ["original_filename", "bad\u0000.pdf"],
    ["original_filename", "folder/contract.pdf"],
    ["original_filename", "folder\\contract.pdf"],
    ["original_filename", "contract.txt"],
    ["storage_path", 42],
    ["storage_path", `${projectId}/documents/${documentId}/wrong`],
    ["mime_type", "application/octet-stream"],
    ["classification", "public"],
  ])("rejects malformed binary metadata %s", (field, value) => {
    expectInvalid(() =>
      parsePrivateDocumentReceipt(
        reserveReceipt(documentRow({ [field]: value })),
        "reserve_upload",
        reserveInput,
      ),
    );
  });
});

describe("private document parser size hash and status coverage", () => {
  it.each([
    ["size_bytes", "8"],
    ["size_bytes", 1.5],
    ["size_bytes", 0],
    ["size_bytes", 25_000_001],
    ["sha256", 42],
    ["sha256", "A".repeat(64)],
    ["upload_status", "failed"],
  ])("rejects malformed field %s", (field, value) => {
    expectInvalid(() =>
      parsePrivateDocumentReceipt(
        reserveReceipt(documentRow({ [field]: value })),
        "reserve_upload",
        reserveInput,
      ),
    );
  });

  it("accepts the ready upload status on finalize", () => {
    const receipt = {
      action: "finalize_upload",
      replayed: false,
      document: documentRow({ upload_status: "ready", revision: 2 }),
    };
    expect(parsePrivateDocumentReceipt(receipt, "finalize_upload", identityInput)).toMatchObject({
      document: { uploadStatus: "ready" },
    });
  });
});

describe("private document reserve semantic parity coverage", () => {
  it.each([
    ["upload_status", "ready"],
    ["document_type", "other"],
    ["title", "Other title"],
    ["source_id", sourceId],
    ["deleted_at", "2026-09-14T00:00:00.000Z"],
    ["original_filename", "other.pdf"],
    ["size_bytes", 9],
    ["sha256", "b".repeat(64)],
  ])("rejects semantically substituted %s", (field, value) => {
    expectInvalid(() =>
      parsePrivateDocumentReceipt(
        reserveReceipt(documentRow({ [field]: value })),
        "reserve_upload",
        reserveInput,
      ),
    );
  });

  it("rejects a runtime MIME mismatch against the reserve input", () => {
    const malformedInput = { ...reserveInput, mimeType: "text/plain" } as never;
    expectInvalid(() =>
      parsePrivateDocumentReceipt(reserveReceipt(), "reserve_upload", malformedInput),
    );
  });
});

describe("private document lifecycle state coverage", () => {
  it.each([
    ["finalize_upload", documentRow(), identityInput],
    ["soft_delete", documentRow({ upload_status: "ready" }), transitionInput],
    [
      "restore",
      documentRow({
        upload_status: "ready",
        deleted_at: "2026-09-14T00:00:00.000Z",
      }),
      transitionInput,
    ],
  ] as const)("rejects wrong state for %s", (action, document, input) => {
    expectInvalid(() =>
      parsePrivateDocumentReceipt({ action, replayed: false, document }, action, input),
    );
  });

  it("accepts restore and rejects malformed replay/action/substitution", () => {
    const ready = documentRow({ upload_status: "ready", revision: 3 });
    expect(
      parsePrivateDocumentReceipt(
        { action: "restore", replayed: true, document: ready },
        "restore",
        transitionInput,
      ),
    ).toMatchObject({ replayed: true, document: { deletedAt: null } });
    expectInvalid(() =>
      parsePrivateDocumentReceipt({ action: "wrong", replayed: false, document: ready }, "restore", transitionInput),
    );
    expectInvalid(() =>
      parsePrivateDocumentReceipt({ action: "restore", replayed: "no", document: ready }, "restore", transitionInput),
    );
  });

  it.each([
    ["project_id", otherId],
    ["id", otherId],
  ])("rejects substituted expected document %s", (field, value) => {
    expectInvalid(() =>
      parsePrivateDocumentReceipt(
        reserveReceipt(documentRow({ [field]: value })),
        "reserve_upload",
        reserveInput,
      ),
    );
  });
});

function linkRow(overrides: Record<string, unknown> = {}) {
  return {
    id: linkId,
    project_id: projectId,
    document_id: documentId,
    target_type: "venue",
    target_id: venueId,
    relationship_type: null,
    ...overrides,
  };
}

describe("private document link parser coverage", () => {
  it("accepts a canonical Venue link", () => {
    const receipt = {
      action: "link_venue",
      replayed: false,
      document: documentRow({ upload_status: "ready", revision: 2 }),
      link: linkRow(),
    };
    expect(parsePrivateDocumentLinkReceipt(receipt, linkInput)).toMatchObject({
      link: { id: linkId, venueId },
    });
  });

  it.each([
    ["id", otherId],
    ["project_id", otherId],
    ["document_id", otherId],
    ["target_type", "vendor"],
    ["target_id", otherId],
    ["relationship_type", "attachment"],
  ])("rejects substituted link field %s", (field, value) => {
    const receipt = {
      action: "link_venue",
      replayed: false,
      document: documentRow({ upload_status: "ready" }),
      link: linkRow({ [field]: value }),
    };
    expectInvalid(() => parsePrivateDocumentLinkReceipt(receipt, linkInput));
  });

  it.each([42, null, []])("rejects malformed link record %j", (link) => {
    const receipt = {
      action: "link_venue",
      replayed: false,
      document: documentRow({ upload_status: "ready" }),
      link,
    };
    expectInvalid(() => parsePrivateDocumentLinkReceipt(receipt, linkInput));
  });

  it("rejects wrong link action", () => {
    expectInvalid(() =>
      parsePrivateDocumentLinkReceipt(
        { action: "wrong", replayed: false, document: documentRow(), link: linkRow() },
        linkInput,
      ),
    );
  });
});

describe("private document unlink parser coverage", () => {
  const document = documentRow({ upload_status: "ready", revision: 3 });

  it("accepts canonical absent unlink receipt", () => {
    expect(
      parsePrivateDocumentUnlinkReceipt(
        { action: "unlink_venue", replayed: false, document, linkId, absent: true },
        linkInput,
      ),
    ).toMatchObject({ linkId, absent: true });
  });

  it.each([
    { action: "wrong", replayed: false, document, linkId, absent: true },
    { action: "unlink_venue", replayed: false, document, linkId: otherId, absent: true },
    { action: "unlink_venue", replayed: false, document, linkId, absent: false },
    { action: "unlink_venue", replayed: "no", document, linkId, absent: true },
  ])("rejects malformed unlink receipt %#", (receipt) => {
    expectInvalid(() => parsePrivateDocumentUnlinkReceipt(receipt, linkInput));
  });
});

describe("private document abandon parser coverage", () => {
  it("accepts canonical abandon receipt", () => {
    expect(
      parsePrivateDocumentAbandonReceipt(
        { action: "abandon_upload", replayed: false, projectId, documentId, absent: true },
        identityInput,
      ),
    ).toEqual({ replayed: false, projectId, documentId, absent: true });
  });

  it.each([
    { action: "wrong", replayed: false, projectId, documentId, absent: true },
    { action: "abandon_upload", replayed: false, projectId: otherId, documentId, absent: true },
    { action: "abandon_upload", replayed: false, projectId, documentId: otherId, absent: true },
    { action: "abandon_upload", replayed: false, projectId, documentId, absent: false },
    { action: "abandon_upload", replayed: "no", projectId, documentId, absent: true },
  ])("rejects malformed abandon receipt %#", (receipt) => {
    expectInvalid(() => parsePrivateDocumentAbandonReceipt(receipt, identityInput));
  });
});
