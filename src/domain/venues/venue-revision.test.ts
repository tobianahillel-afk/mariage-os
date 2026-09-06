import { describe, expect, it } from "vitest";
import { validateExpectedVenueRevision } from "./venue-revision";

describe("validateExpectedVenueRevision", () => {
  it.each([1, 2, Number.MAX_SAFE_INTEGER])(
    "accepts positive safe integer revision %s",
    (value) => {
      expect(validateExpectedVenueRevision(value)).toBeNull();
    },
  );

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 53])(
    "rejects unsafe revision %s",
    (value) => {
      expect(validateExpectedVenueRevision(value)).toBe(
        "expected_revision_invalid",
      );
    },
  );
});
