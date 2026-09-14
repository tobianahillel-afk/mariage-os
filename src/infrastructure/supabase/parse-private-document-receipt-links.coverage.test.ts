import { describe, expect, it } from "vitest";
import { DocumentPersistenceError } from "@application/documents/document-persistence-error";
import {
  parsePrivateDocumentAbandonReceipt,
  parsePrivateDocumentLinkReceipt,
  parsePrivateDocumentUnlinkReceipt,
} from "./parse-private-document-receipt";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const operationId = "33333333-3333-4333-8333-333333333333";
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

const identityInput = { operationId, projectId, documentId };
const transitionInput = { ...identityInput, expectedRevision: 2 };
const linkInput = {
  ...transitionInput,
  venueId,
  linkId,
};

function expectInvalid(run: () => unknown): void {
  expect(run).toThrowError(DocumentPersistenceError);
  try {
    run();
  } catch (error) {
    expect(error).toMatchObject({ code: "provider_response_invalid" });
  }
}

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
        {
          action: "wrong",
          replayed: false,
          document: documentRow(),
          link: linkRow(),
        },
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
        {
          action: "unlink_venue",
          replayed: false,
          document,
          linkId,
          absent: true,
        },
        linkInput,
      ),
    ).toMatchObject({ linkId, absent: true });
  });

  it.each([
    { action: "wrong", replayed: false, document, linkId, absent: true },
    {
      action: "unlink_venue",
      replayed: false,
      document,
      linkId: otherId,
      absent: true,
    },
    {
      action: "unlink_venue",
      replayed: false,
      document,
      linkId,
      absent: false,
    },
    { action: "unlink_venue", replayed: "no", document, linkId, absent: true },
  ])("rejects malformed unlink receipt %#", (receipt) => {
    expectInvalid(() => parsePrivateDocumentUnlinkReceipt(receipt, linkInput));
  });
});

describe("private document abandon parser coverage", () => {
  it("accepts canonical abandon receipt", () => {
    expect(
      parsePrivateDocumentAbandonReceipt(
        {
          action: "abandon_upload",
          replayed: false,
          projectId,
          documentId,
          absent: true,
        },
        identityInput,
      ),
    ).toEqual({ replayed: false, projectId, documentId, absent: true });
  });

  it.each([
    { action: "wrong", replayed: false, projectId, documentId, absent: true },
    {
      action: "abandon_upload",
      replayed: false,
      projectId: otherId,
      documentId,
      absent: true,
    },
    {
      action: "abandon_upload",
      replayed: false,
      projectId,
      documentId: otherId,
      absent: true,
    },
    {
      action: "abandon_upload",
      replayed: false,
      projectId,
      documentId,
      absent: false,
    },
    {
      action: "abandon_upload",
      replayed: "no",
      projectId,
      documentId,
      absent: true,
    },
  ])("rejects malformed abandon receipt %#", (receipt) => {
    expectInvalid(() =>
      parsePrivateDocumentAbandonReceipt(receipt, identityInput),
    );
  });
});
