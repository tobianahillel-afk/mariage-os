import { expect, it, vi } from "vitest";
import { createLocalProjectScope } from "@application/local-data/local-project-scope";
import { IndexedDbProjectStoreFactory } from "./indexeddb-project-store";

const scope = createLocalProjectScope(
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
);

class DeleteRequest {
  onblocked: (() => void) | null = null;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

function deleteFactory(
  outcome: "success" | "blocked" | "error",
): { readonly factory: IDBFactory; readonly deleteDatabase: ReturnType<typeof vi.fn> } {
  const deleteDatabase = vi.fn(() => {
    const request = new DeleteRequest();
    queueMicrotask(() => {
      if (outcome === "success") request.onsuccess?.();
      if (outcome === "blocked") request.onblocked?.();
      if (outcome === "error") request.onerror?.();
    });
    return request as unknown as IDBOpenDBRequest;
  });
  return {
    deleteDatabase,
    factory: { deleteDatabase } as unknown as IDBFactory,
  };
}

it("purges only the account and project scoped IndexedDB namespace", async () => {
  const target = deleteFactory("success");
  const factory = new IndexedDbProjectStoreFactory(target.factory);

  await expect(factory.purge(scope)).resolves.toBeUndefined();
  expect(target.deleteDatabase).toHaveBeenCalledWith(
    `mariage-os:project:${scope.userId}:${scope.projectId}`,
  );
});

it("reports a blocked purge instead of claiming local cleanup", async () => {
  const target = deleteFactory("blocked");
  const factory = new IndexedDbProjectStoreFactory(target.factory);

  await expect(factory.purge(scope)).rejects.toThrow(
    "Local IndexedDB purge blocked failed.",
  );
});

it("reports a failed purge instead of claiming local cleanup", async () => {
  const target = deleteFactory("error");
  const factory = new IndexedDbProjectStoreFactory(target.factory);

  await expect(factory.purge(scope)).rejects.toThrow(
    "Local IndexedDB purge failed.",
  );
});
