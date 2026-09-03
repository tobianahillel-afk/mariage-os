import fc from "fast-check";
import { describe, expect, it } from "vitest";

describe("property test harness", () => {
  it("keeps list contents after two reversals", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (values) => {
        const result = [...values].reverse().reverse();
        expect(result).toEqual(values);
      }),
    );
  });
});
