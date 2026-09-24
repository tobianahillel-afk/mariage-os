import { describe, expect, it } from "vitest";
import { resolvePrivateDocumentLifecycleNamespace } from "../../../scripts/private-document-ar006-durable-object.mjs";

interface NamespaceRecord {
  readonly id: string;
  readonly class: string;
  readonly script: string;
  readonly use_sqlite: boolean;
}

function namespace(overrides: Partial<NamespaceRecord> = {}): NamespaceRecord {
  return {
    id: "namespace-id",
    class: "PrivateDocumentLifecycle",
    script: "mariage-os-private-document-promotion",
    use_sqlite: true,
    ...overrides,
  };
}

function response(
  result: unknown,
  options: { success?: boolean; totalCount?: number; ok?: boolean } = {},
): Response {
  const success = options.success ?? true;
  const totalCount =
    options.totalCount ?? (Array.isArray(result) ? result.length : 0);
  return new Response(
    JSON.stringify({
      success,
      result,
      result_info: { total_count: totalCount },
    }),
    {
      status: options.ok === false ? 500 : 200,
      headers: { "content-type": "application/json" },
    },
  );
}

function fetcher(result: unknown, options?: Parameters<typeof response>[1]) {
  return async () => response(result, options);
}

const input = {
  accountId: "account-id",
  workerName: "mariage-os-private-document-promotion",
  token: "synthetic-token",
};

describe("AR-006 Durable Object namespace resolver success", () => {
  it("returns the single exact SQLite lifecycle namespace", async () => {
    const resolved = await resolvePrivateDocumentLifecycleNamespace({
      ...input,
      fetcher: fetcher([namespace()]),
    });

    expect(resolved).toEqual({
      id: "namespace-id",
      className: "PrivateDocumentLifecycle",
      workerName: input.workerName,
      useSqlite: true,
    });
  });

  it("rejects duplicate exact namespaces", async () => {
    await expect(
      resolvePrivateDocumentLifecycleNamespace({
        ...input,
        fetcher: fetcher([
          namespace({ id: "namespace-a" }),
          namespace({ id: "namespace-b" }),
        ]),
      }),
    ).rejects.toThrow(
      "Expected exactly one SQLite PrivateDocumentLifecycle namespace.",
    );
  });

  it("rejects truncated namespace inventory", async () => {
    await expect(
      resolvePrivateDocumentLifecycleNamespace({
        ...input,
        fetcher: fetcher([namespace()], { totalCount: 2 }),
      }),
    ).rejects.toThrow(
      "Durable Object namespace inventory exceeded bounded page.",
    );
  });
});

describe("AR-006 Durable Object namespace resolver failures", () => {
  it("rejects malformed or unsuccessful provider inventory", async () => {
    await expect(
      resolvePrivateDocumentLifecycleNamespace({
        ...input,
        fetcher: fetcher(null),
      }),
    ).rejects.toThrow("Durable Object namespace inventory is malformed.");

    await expect(
      resolvePrivateDocumentLifecycleNamespace({
        ...input,
        fetcher: fetcher([], { success: false }),
      }),
    ).rejects.toThrow("Durable Object namespace inventory failed.");
  });

  it("rejects wrong script, class, or storage backend", async () => {
    const wrong = [
      namespace({ script: "other-worker" }),
      namespace({ class: "OtherLifecycle" }),
      namespace({ use_sqlite: false }),
    ];

    await expect(
      resolvePrivateDocumentLifecycleNamespace({
        ...input,
        fetcher: fetcher(wrong),
      }),
    ).rejects.toThrow(
      "Expected exactly one SQLite PrivateDocumentLifecycle namespace.",
    );
  });
});
