import { describe, expect, it } from "vitest";
import type { CriterionDefinition } from "@domain/facts/criterion-types";
import type {
  VenueCompatibilityInputs,
  VenueCompatibilityQueryPort,
} from "./venue-compatibility-query-port";
import { getVenueCompatibility } from "./venue-compatibility-service";

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const VENUE_ID = "22222222-2222-4222-8222-222222222222";
const EVALUATED_AT = "2026-09-07T19:00:00Z";

function definition(
  key: string,
  overrides: Partial<CriterionDefinition> = {},
): CriterionDefinition {
  return {
    key,
    valueType: "boolean",
    unit: null,
    optionsJson: null,
    priority: "important",
    weight: null,
    evaluationRuleJson: { type: "boolean_equals", expected: true },
    systemDefined: false,
    ...overrides,
  };
}

function compatibilityInputs(): VenueCompatibilityInputs {
  return {
    projectId: PROJECT_ID,
    venueId: VENUE_ID,
    projectTargetGuestCount: 160,
    snapshots: [
      {
        definition: definition("parking"),
        state: "known",
        retainedValue: true,
        retainedObservationStatus: "active",
        staleAt: null,
      },
      {
        definition: definition("two_dance_areas_max_guest_estimate", {
          valueType: "number",
          unit: "people",
          optionsJson: { min: 0, integer: true },
          systemDefined: true,
          evaluationRuleJson: { type: "number_min", minimum: 0 },
        }),
        state: "known",
        retainedValue: 170,
        retainedObservationStatus: "active",
        staleAt: null,
      },
      {
        definition: definition("target_guest_count_supported", {
          priority: "blocking",
          systemDefined: true,
          evaluationRuleJson: { type: "project_target_guest_count_supported" },
        }),
        state: null,
        retainedValue: null,
        retainedObservationStatus: null,
        staleAt: null,
      },
    ],
  };
}

function portFor(
  input: VenueCompatibilityInputs | null,
): VenueCompatibilityQueryPort {
  return {
    async loadVenueCompatibilityInputs() {
      return input;
    },
  };
}

describe("venue compatibility read model", () => {
  it("composes blocker, score, readiness and explanations", async () => {
    const result = await getVenueCompatibility(portFor(compatibilityInputs()), {
      projectId: PROJECT_ID,
      venueId: VENUE_ID,
      evaluatedAt: EVALUATED_AT,
    });
    expect(result).not.toBeNull();
    expect(result?.aggregate.blockingStatus).toBe("PASS");
    expect(result?.aggregate.weightedScore).toBe(1);
    expect(result?.aggregate.scoreComponents).toHaveLength(2);
    expect(result?.readiness).toEqual({
      evidenceReadiness: 1,
      readyCriteria: 3,
      applicableCriteria: 3,
    });
    expect(result?.guidance).toEqual([]);
  });

  it("surfaces missing critical information without hiding blocking state", async () => {
    const input = compatibilityInputs();
    const missing = {
      ...input,
      snapshots: [
        {
          ...input.snapshots[0],
          state: null,
          retainedValue: null,
          retainedObservationStatus: null,
        },
      ],
    } satisfies VenueCompatibilityInputs;
    const result = await getVenueCompatibility(portFor(missing), {
      projectId: PROJECT_ID,
      venueId: VENUE_ID,
      evaluatedAt: EVALUATED_AT,
    });
    expect(result?.aggregate.blockingStatus).toBe("PASS");
    expect(result?.readiness.evidenceReadiness).toBe(0);
    expect(result?.guidance.map((item) => item.kind)).toEqual([
      "missing_or_unknown",
      "retained_evidence_missing_or_non_active",
    ]);
  });
});

describe("venue compatibility dynamic recomputation", () => {
  it("recomputes the guest-count blocker without mutating source truth", async () => {
    const input = compatibilityInputs();
    const before = JSON.stringify(input.snapshots);
    const result = await getVenueCompatibility(portFor(input), {
      projectId: PROJECT_ID,
      venueId: VENUE_ID,
      evaluatedAt: EVALUATED_AT,
      targetGuestCountOverride: 180,
    });
    const derived = result?.evaluations.find(
      (item) => item.key === "target_guest_count_supported",
    );
    expect(derived?.outcome).toBe("FAIL");
    expect(result?.aggregate.blockingStatus).toBe("FAIL");
    expect(result?.targetGuestCount).toBe(180);
    expect(JSON.stringify(input.snapshots)).toBe(before);
  });

  it("returns null for an unavailable venue and rejects identity drift", async () => {
    await expect(
      getVenueCompatibility(portFor(null), {
        projectId: PROJECT_ID,
        venueId: VENUE_ID,
        evaluatedAt: EVALUATED_AT,
      }),
    ).resolves.toBeNull();
    const drifted = { ...compatibilityInputs(), venueId: PROJECT_ID };
    await expect(
      getVenueCompatibility(portFor(drifted), {
        projectId: PROJECT_ID,
        venueId: VENUE_ID,
        evaluatedAt: EVALUATED_AT,
      }),
    ).rejects.toThrow("Venue compatibility query failed.");
  });
});
