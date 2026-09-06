import { describe, expect, it } from "vitest";
import { isCanonicalFactUrl } from "./fact-url";

const overlongHost = [
  "a".repeat(63),
  "b".repeat(63),
  "c".repeat(63),
  "d".repeat(62),
  "invalid",
].join(".");

describe("canonical fact URL host validation", () => {
  it("accepts a canonical single-label host", () => {
    expect(isCanonicalFactUrl("https://singlelabel")).toBe(true);
  });

  it.each([
    `https://${overlongHost}`,
    `https://${"a".repeat(64)}.invalid`,
    "https://xn--bad.invalid",
    "https://bad_name.invalid",
    "https://a.0",
  ])("rejects noncanonical host %s", (raw) => {
    expect(isCanonicalFactUrl(raw)).toBe(false);
  });
});
