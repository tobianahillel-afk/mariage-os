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
