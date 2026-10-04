import { expect, it } from "vitest";
import {
  assertLocalBinaryScope,
  parseLocalBinaryMetadata,
} from "./local-binary-record";
import { scope } from "../../../tests/support/indexeddb-project-store-test-support";

const localBinaryId = "a1111111-1111-4111-8111-111111111111";
const venueId = "b1111111-1111-4111-8111-111111111111";

function metadata(syncState: "unsynced" | "synced" = "unsynced") {
  return {
    localBinaryId,
    projectId: scope.projectId,
    userId: scope.userId,
    deviceId: scope.deviceId,
    venueId,
    filename: "visite.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 2048,
    createdAt: "2026-10-04T23:00:00.000Z",
    lastAccessedAt: "2026-10-04T23:00:00.000Z",
    pinned: true,
    syncState,
  } as const;
}

it("parses bounded local binary metadata", () => {
  expect(parseLocalBinaryMetadata(metadata())).toEqual(metadata());
});

it("rejects malformed persisted local binary metadata", () => {
  expect(() =>
    parseLocalBinaryMetadata({ ...metadata(), mimeType: "not-a-mime" }),
  ).toThrow("local binary");
});

it("fails closed on another local scope", () => {
  const parsed = parseLocalBinaryMetadata({
    ...metadata(),
    userId: "c1111111-1111-4111-8111-111111111111",
  });
  expect(() => assertLocalBinaryScope(parsed, scope)).toThrow(
    "another local scope",
  );
});

it.each([
  ["primitive record", null],
  ["array record", []],
])("rejects malformed %s", (_label, value) => {
  expect(() => parseLocalBinaryMetadata(value)).toThrow("local binary record");
});

it.each([
  ["empty filename", { filename: "" }],
  ["non-string filename", { filename: 42 }],
  ["invalid id", { localBinaryId: "not-a-uuid" }],
  ["invalid timestamp", { createdAt: "not-a-date" }],
  ["non-canonical timestamp", { createdAt: "2026-10-04T23:00:00Z" }],
  ["fractional size", { sizeBytes: 1.5 }],
  ["negative size", { sizeBytes: -1 }],
  ["invalid pin state", { pinned: "yes" }],
  ["invalid sync state", { syncState: "uploading" }],
])("rejects %s", (_label, override) => {
  expect(() =>
    parseLocalBinaryMetadata({ ...metadata(), ...override }),
  ).toThrow("local binary");
});

it("accepts synced binary metadata", () => {
  expect(parseLocalBinaryMetadata(metadata("synced")).syncState).toBe("synced");
});

it.each([
  ["projectId", "d1111111-1111-4111-8111-111111111111"],
  ["userId", "c1111111-1111-4111-8111-111111111111"],
  ["deviceId", "e1111111-1111-4111-8111-111111111111"],
] as const)("fails closed on foreign %s", (field, value) => {
  const parsed = parseLocalBinaryMetadata({
    ...metadata(),
    [field]: value,
  });
  expect(() => assertLocalBinaryScope(parsed, scope)).toThrow(
    "another local scope",
  );
});
