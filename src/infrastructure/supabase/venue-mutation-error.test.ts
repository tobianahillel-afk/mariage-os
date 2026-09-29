import { describe, expect, it } from "vitest";
import { venueMutationError } from "./venue-mutation-error";

describe("venueMutationError", () => {
  it.each([
    [null, "unavailable"],
    [[], "unavailable"],
    [{ code: 42 }, "unavailable"],
    [{ code: "40001" }, "conflict"],
    [{ code: "42501" }, "denied"],
    [{ code: "22023" }, "permanent"],
  ] as const)("maps provider failure %#", (providerError, code) => {
    expect(venueMutationError(providerError, "safe")).toMatchObject({
      code,
      message: "safe",
      name: "VenueMutationPersistenceError",
    });
  });
});
