import { describe, expect, it } from "vitest";

import {
  createLocalProjectScope,
  isUuid,
  localProjectDatabaseName,
} from "./local-project-scope";

const userId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const deviceId = "33333333-3333-4333-8333-333333333333";

describe("local project scope", () => {
  it("accepts UUID identities and produces an immutable scoped database name", () => {
    const scope = createLocalProjectScope(userId, projectId, deviceId);

    expect(scope).toEqual({ userId, projectId, deviceId });
    expect(Object.isFrozen(scope)).toBe(true);
    expect(localProjectDatabaseName(scope)).toBe(
      `mariage-os:project:${userId}:${projectId}`,
    );
    expect(isUuid(deviceId.toUpperCase())).toBe(true);
  });

  it("rejects a malformed user id", () => {
    expect(() => createLocalProjectScope("user", projectId, deviceId)).toThrow(
      "UUID userId",
    );
  });

  it("rejects a malformed project id", () => {
    expect(() => createLocalProjectScope(userId, "project", deviceId)).toThrow(
      "UUID projectId",
    );
  });

  it("rejects a malformed device id", () => {
    expect(() => createLocalProjectScope(userId, projectId, "device")).toThrow(
      "UUID deviceId",
    );
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
