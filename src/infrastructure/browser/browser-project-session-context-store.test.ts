import { describe, expect, it } from "vitest";
import { BrowserProjectSessionContextStore } from "@infra/browser/browser-project-session-context-store";

const projectId = "81111111-1111-4111-8111-111111111111";
const userId = "71111111-1111-4111-8111-111111111111";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key) {
      return values.get(key) ?? null;
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key) {
      values.delete(key);
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe("BrowserProjectSessionContextStore", () => {
  it("remembers and clears only the established user for one project", () => {
    const store = new BrowserProjectSessionContextStore(createStorage());

    expect(store.readUserId(projectId)).toBeNull();
    store.remember(projectId, userId);
    expect(store.readUserId(projectId)).toBe(userId);
    store.clear(projectId);
    expect(store.readUserId(projectId)).toBeNull();
  });

  it("rejects invalid remembered identities and ignores malformed persisted values", () => {
    const storage = createStorage();
    const store = new BrowserProjectSessionContextStore(storage);

    expect(() => store.remember(projectId, "not-a-user-id")).toThrow(
      "Project session context requires a UUID userId.",
    );
    storage.setItem(`mariage-os:project-session:${projectId}`, "corrupt");
    expect(store.readUserId(projectId)).toBeNull();
    expect(store.readUserId("not-a-project-id")).toBeNull();
  });

  it("fails closed when browser storage cannot be read", () => {
    const storage = createStorage();
    storage.getItem = () => {
      throw new Error("storage unavailable");
    };
    const store = new BrowserProjectSessionContextStore(storage);

    expect(store.readUserId(projectId)).toBeNull();
  });
});
