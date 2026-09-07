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

function supportDefinition(): CriterionDefinition {
  return definition("two_dance_areas_max_guest_estimate", {
    valueType: "number",
    unit: "people",
    optionsJson: { min: 0, integer: true },
    systemDefined: true,
    evaluationRuleJson: { type: "number_min", minimum: 0 },
  });
}

function derivedDefinition(
  overrides: Partial<CriterionDefinition> = {},
): CriterionDefinition {
  return definition("target_guest_count_supported", {
    priority: "blocking",
    systemDefined: true,
    evaluationRuleJson: { type: "project_target_guest_count_supported" },
    ...overrides,
  });
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
        definition: supportDefinition(),
        state: "known",
        retainedValue: 170,
        retainedObservationStatus: "active",
        staleAt: null,
      },
      {
        definition: derivedDefinition(),
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

async function compatibility(
  input: VenueCompatibilityInputs,
  overrides: Partial<{
    evaluatedAt: string;
    targetGuestCountOverride: number | null;
  }> = {},
) {
  return getVenueCompatibility(portFor(input), {
    projectId: PROJECT_ID,
    venueId: VENUE_ID,
    evaluatedAt: overrides.evaluatedAt ?? EVALUATED_AT,
    ...(Object.prototype.hasOwnProperty.call(overrides, "targetGuestCountOverride")
      ? { targetGuestCountOverride: overrides.targetGuestCountOverride }
      : {}),
  });
}

describe("venue compatibility read model", () => {
  it("composes blocker, score, readiness and reconstructible dynamic explanation", async () => {
    const result = await compatibility(compatibilityInputs());
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
    expect(result?.targetGuestCountSource).toBe("project");
    expect(result?.dynamicGuestCountExplanation).toEqual({
      targetGuestCount: 160,
      targetSource: "project",
      supportSourceKey: "two_dance_areas_max_guest_estimate",
      supportSourceState: "known",
      supportSourceValue: 170,
      supportSourceObservationStatus: "active",
      supportSourceStaleAt: null,
      supportSourceFreshness: "fresh",
      ready: true,
      outcome: "PASS",
      reason: "rule_pass",
      comparison: {
        targetGuestCount: 160,
        supportMaximumGuestCount: 170,
        passes: true,
      },
    });
  });

  it("surfaces missing critical information without hiding blocking state", async () => {
    const input = compatibilityInputs();
    const missing = {
      ...input,
      snapshots: [
        {
          definition: definition("parking"),
          state: null,
          retainedValue: null,
          retainedObservationStatus: null,
          staleAt: null,
        },
      ],
    } satisfies VenueCompatibilityInputs;
    const result = await compatibility(missing);
    expect(result?.aggregate.blockingStatus).toBe("PASS");
    expect(result?.readiness.evidenceReadiness).toBe(0);
    expect(result?.guidance.map((item) => item.kind)).toEqual([
      "missing_or_unknown",
      "retained_evidence_missing_or_non_active",
    ]);
    expect(result?.dynamicGuestCountExplanation).toBeNull();
  });
});

describe("venue compatibility dynamic recomputation", () => {
  it("preserves explicit-context provenance while recomputing without mutation", async () => {
    const input = compatibilityInputs();
    const before = JSON.stringify(input.snapshots);
    const result = await compatibility(input, { targetGuestCountOverride: 180 });
    const derived = result?.evaluations.find(
      (item) => item.key === "target_guest_count_supported",
    );
    expect(derived?.outcome).toBe("FAIL");
    expect(result?.aggregate.blockingStatus).toBe("FAIL");
    expect(result?.targetGuestCount).toBe(180);
    expect(result?.targetGuestCountSource).toBe("explicit_context");
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      targetGuestCount: 180,
      targetSource: "explicit_context",
      outcome: "FAIL",
      ready: true,
      comparison: {
        targetGuestCount: 180,
        supportMaximumGuestCount: 170,
        passes: false,
      },
    });
    expect(JSON.stringify(input.snapshots)).toBe(before);
  });

  it("keeps equal numeric project and explicit targets distinguishable by provenance", async () => {
    const input = compatibilityInputs();
    const projectResult = await compatibility(input);
    const explicitResult = await compatibility(input, {
      targetGuestCountOverride: 160,
    });
    expect(projectResult?.targetGuestCount).toBe(160);
    expect(explicitResult?.targetGuestCount).toBe(160);
    expect(projectResult?.dynamicGuestCountExplanation?.targetSource).toBe(
      "project",
    );
    expect(explicitResult?.dynamicGuestCountExplanation?.targetSource).toBe(
      "explicit_context",
    );
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

describe("venue compatibility dynamic explanation fail-closed states", () => {
  it("marks stale source evidence not ready without changing semantic PASS", async () => {
    const input = compatibilityInputs();
    const snapshots = [...input.snapshots];
    snapshots[1] = { ...snapshots[1]!, staleAt: EVALUATED_AT };
    const result = await compatibility({ ...input, snapshots });
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "PASS",
      supportSourceFreshness: "stale",
      ready: false,
    });
  });

  it("keeps a future stale boundary fresh", async () => {
    const input = compatibilityInputs();
    const snapshots = [...input.snapshots];
    snapshots[1] = {
      ...snapshots[1]!,
      staleAt: "2026-09-07T20:00:00Z",
    };
    const result = await compatibility({ ...input, snapshots });
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      supportSourceFreshness: "fresh",
      ready: true,
    });
  });

  it("reports invalid evaluation or freshness instants as unknown freshness", async () => {
    const input = compatibilityInputs();
    const invalidEvaluation = await compatibility(input, {
      evaluatedAt: "not-an-instant",
    });
    expect(
      invalidEvaluation?.dynamicGuestCountExplanation?.supportSourceFreshness,
    ).toBe("unknown");

    const snapshots = [...input.snapshots];
    snapshots[1] = { ...snapshots[1]!, staleAt: "not-an-instant" };
    const invalidFreshness = await compatibility({ ...input, snapshots });
    expect(
      invalidFreshness?.dynamicGuestCountExplanation?.supportSourceFreshness,
    ).toBe("unknown");
  });

  it("exposes missing support-source dependency explicitly", async () => {
    const input = compatibilityInputs();
    const snapshots = input.snapshots.filter(
      (snapshot) => snapshot.definition.key !== "two_dance_areas_max_guest_estimate",
    );
    const result = await compatibility({ ...input, snapshots });
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      supportSourceKey: "two_dance_areas_max_guest_estimate",
      supportSourceState: null,
      supportSourceValue: null,
      supportSourceObservationStatus: null,
      supportSourceStaleAt: null,
      supportSourceFreshness: "unknown",
      ready: false,
      outcome: "UNKNOWN",
      reason: "configuration_incomplete",
      comparison: null,
    });
  });

  it("exposes conflict state without fabricating a numeric comparison", async () => {
    const input = compatibilityInputs();
    const snapshots = [...input.snapshots];
    snapshots[1] = { ...snapshots[1]!, state: "conflict" };
    const result = await compatibility({ ...input, snapshots });
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      supportSourceState: "conflict",
      supportSourceValue: 170,
      ready: false,
      outcome: "CONFLICT",
      reason: "conflict",
      comparison: null,
    });
  });

  it("does not compare invalid target or support values", async () => {
    const input = compatibilityInputs();
    const invalidTarget = await compatibility(input, {
      targetGuestCountOverride: -1,
    });
    expect(invalidTarget?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "UNKNOWN",
      reason: "invalid_target_guest_count",
      ready: false,
      comparison: null,
    });

    const snapshots = [...input.snapshots];
    snapshots[1] = { ...snapshots[1]!, retainedValue: -1 };
    const invalidSupport = await compatibility({ ...input, snapshots });
    expect(invalidSupport?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "UNKNOWN",
      reason: "invalid_support_ceiling",
      ready: false,
      comparison: null,
    });
  });

  it("requires active source evidence and a valid derived rule for readiness", async () => {
    const input = compatibilityInputs();
    const inactiveSnapshots = [...input.snapshots];
    inactiveSnapshots[1] = {
      ...inactiveSnapshots[1]!,
      retainedObservationStatus: "withdrawn",
    };
    const inactive = await compatibility({ ...input, snapshots: inactiveSnapshots });
    expect(inactive?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "PASS",
      ready: false,
    });

    const malformedSnapshots = [...input.snapshots];
    malformedSnapshots[2] = {
      ...malformedSnapshots[2]!,
      definition: derivedDefinition({ evaluationRuleJson: null }),
    };
    const malformed = await compatibility({
      ...input,
      snapshots: malformedSnapshots,
    });
    expect(malformed?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "UNKNOWN",
      reason: "configuration_incomplete",
      ready: false,
      comparison: {
        targetGuestCount: 160,
        supportMaximumGuestCount: 170,
        passes: true,
      },
    });
  });
});
