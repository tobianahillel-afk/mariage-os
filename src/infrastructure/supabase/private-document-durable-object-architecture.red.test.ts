import { describe, expect, it } from "vitest";
import pagesSource from "../../../functions/api/private-document-promote.ts?raw";
import workerConfig from "../../../workers/private-document-promotion/wrangler.jsonc?raw";
import workerSource from "../../../workers/private-document-promotion/src/worker.ts?raw";
import runtimeSource from "../../../scripts/private-document-pages-workerd-runtime.mjs?raw";

const adr0012Modules = import.meta.glob(
  "../../../docs/adr/0012-private-document-lifecycle-durable-object.md",
  { eager: true, import: "default", query: "?raw" },
);

describe("ADR 0012 Durable Object lifecycle boundary RED", () => {
  it("has the accepted architecture decision before implementation", () => {
    expect(Object.keys(adr0012Modules)).toHaveLength(1);
  });

  it("declares one private SQLite-backed lifecycle Durable Object", () => {
    expect(workerConfig).toContain('"workers_dev": false');
    expect(workerConfig).toContain('"PrivateDocumentLifecycle"');
    expect(workerConfig).toContain('"type": "durable-object"');
    expect(workerConfig).toContain('"storage": "sqlite"');
    expect(workerSource).toContain("export class PrivateDocumentLifecycle");
  });

  it("routes Pages directly to the per-document lifecycle object", () => {
    expect(pagesSource).toContain("PRIVATE_DOCUMENT_LIFECYCLE");
    expect(pagesSource).toContain("idFromName");
    expect(pagesSource).toContain("private-document:");
    expect(pagesSource).not.toContain("PRIVATE_DOCUMENT_PROMOTION_WORKER");
  });

  it("moves both promotion and abandon behind the same coordinator", () => {
    expect(workerSource).toContain("handleTrustedPromotion");
    expect(workerSource).toContain("handleTrustedAbandon");
    expect(workerSource).toContain('request.method === "POST"');
    expect(workerSource).toContain('request.method === "DELETE"');
  });

  it("makes the local Workers runtime exercise a Durable Object binding", () => {
    expect(runtimeSource).toContain("PRIVATE_DOCUMENT_LIFECYCLE");
    expect(runtimeSource).toContain("PrivateDocumentLifecycle");
    expect(runtimeSource).not.toContain(
      'PRIVATE_DOCUMENT_PROMOTION_WORKER: "private-document-promotion"',
    );
  });
});
