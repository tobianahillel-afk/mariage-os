import { describe, expect, it } from "vitest";
import offerSource from "./supabase-venue-offer-adapter.ts?raw";
import availabilitySource from "./supabase-venue-availability-adapter.ts?raw";
import accessSource from "./supabase-venue-access-adapter.ts?raw";

describe("WP-2.11 project-wide decision read pagination RED", () => {
  it("paginates every project-wide history reader instead of trusting the provider row cap", () => {
    for (const source of [offerSource, availabilitySource, accessSource]) {
      expect(source).toContain("readAllSupabaseRows");
      expect(source).toContain(".range(");
    }
  });
});
