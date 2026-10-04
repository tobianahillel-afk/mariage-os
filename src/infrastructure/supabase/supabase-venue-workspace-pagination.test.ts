import { describe, expect, it } from "vitest";
import offerSource from "./supabase-venue-offer-adapter.ts?raw";
import availabilitySource from "./supabase-venue-availability-adapter.ts?raw";
import accessSource from "./supabase-venue-access-adapter.ts?raw";

describe("WP-2.11 project-wide decision reads", () => {
  it.each([
    ["offers", offerSource],
    ["availability", availabilitySource],
    ["access", accessSource],
  ])(
    "paginates all %s rows instead of relying on one provider page",
    (_, source) => {
      expect(source).toContain("readAllSupabaseRows");
      expect(source).toContain(".range(");
    },
  );
});
