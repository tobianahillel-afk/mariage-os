import { describe, expect, it } from "vitest";
import type {
  CriterionDefinition,
  CriterionFactSnapshot,
} from "@domain/facts/criterion-types";
import type {
  VenueCompatibilityInputs,
  VenueCompatibilityQueryPort,
} from "./venue-compatibility-query-port";
import { getVenueCompatibility } from "./venue-compatibility-service";

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const VENUE_ID = "22222222-2222-4222-8222-222222222222";
const EVALUATED_AT = "2026-09-07T19:00:00Z";
const SUPPORT_KEY = "two_dance_areas_max_guest_estimate";
const DERIVED_KEY = "target_guest_count_supported";

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
  return definition(SUPPORT_KEY, {
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
  return definition(DERIVED_KEY, {
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

function replaceSnapshot(
  input: VenueCompatibilityInputs,
  key: string,
  overrides: Partial<CriterionFactSnapshot>,
): VenueCompatibilityInputs {
  return {
    ...input,
    snapshots: input.snapshots.map((snapshot) =>
      snapshot.definition.key === key
        ? { ...snapshot, ...overrides }
        : snapshot,
    ),
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
    ...(Object.prototype.hasOwnProperty.call(
      overrides,
      "targetGuestCountOverride",
    )
      ? { targetGuestCountOverride: overrides.targetGuestCountOverride }
      : {}),
  });
}

describe("venue compatibility read model", () => {
  it("composes score, readiness and reconstructible dynamic explanation", async () => {
    const result = await compatibility(compatibilityInputs());
    expect(result?.aggregate.blockingStatus).toBe("PASS");
    expect(result?.aggregate.weightedScore).toBe(1);
    expect(result?.readiness).toEqual({
      evidenceReadiness: 1,
      readyCriteria: 3,
      applicableCriteria: 3,
    });
    expect(result?.targetGuestCountSource).toBe("project");
    expect(result?.dynamicGuestCountExplanation).toEqual({
      targetGuestCount: 160,
      targetSource: "project",
      supportSourceKey: SUPPORT_KEY,
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

  it("keeps ordinary missing information visible", async () => {
    const input = compatibilityInputs();
    const snapshots = input.snapshots.filter(
      (snapshot) => snapshot.definition.key === "parking",
    );
    const result = await compatibility({ ...input, snapshots });
    expect(result?.readiness.evidenceReadiness).toBe(0);
    expect(result?.guidance.map((item) => item.kind)).toEqual([
      "missing_or_unknown",
      "retained_evidence_missing_or_non_active",
    ]);
    expect(result?.dynamicGuestCountExplanation).toBeNull();
  });
});

describe("venue compatibility target provenance", () => {
  it("preserves explicit-context provenance without source mutation", async () => {
    const input = compatibilityInputs();
    const before = JSON.stringify(input.snapshots);
    const result = await compatibility(input, {
      targetGuestCountOverride: 180,
    });
    expect(result?.aggregate.blockingStatus).toBe("FAIL");
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

  it("distinguishes equal project and explicit targets by provenance", async () => {
    const input = compatibilityInputs();
    const projectResult = await compatibility(input);
    const explicitResult = await compatibility(input, {
      targetGuestCountOverride: 160,
    });
    expect(projectResult?.targetGuestCountSource).toBe("project");
    expect(explicitResult?.targetGuestCountSource).toBe("explicit_context");
  });
});

describe("venue compatibility query identity", () => {
  it("returns null for an unavailable venue", async () => {
    await expect(
      getVenueCompatibility(portFor(null), {
        projectId: PROJECT_ID,
        venueId: VENUE_ID,
        evaluatedAt: EVALUATED_AT,
      }),
    ).resolves.toBeNull();
  });

  it("rejects identity drift", async () => {
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

describe("dynamic explanation freshness", () => {
  it("marks stale source evidence not ready without changing semantic PASS", async () => {
    const input = replaceSnapshot(compatibilityInputs(), SUPPORT_KEY, {
      staleAt: EVALUATED_AT,
    });
    const result = await compatibility(input);
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "PASS",
      supportSourceFreshness: "stale",
      ready: false,
    });
  });

  it("keeps a future stale boundary fresh", async () => {
    const input = replaceSnapshot(compatibilityInputs(), SUPPORT_KEY, {
      staleAt: "2026-09-07T20:00:00Z",
    });
    const result = await compatibility(input);
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      supportSourceFreshness: "fresh",
      ready: true,
    });
  });

  it("reports invalid evaluation or stale instants as unknown freshness", async () => {
    const invalidEvaluation = await compatibility(compatibilityInputs(), {
      evaluatedAt: "not-an-instant",
    });
    expect(
      invalidEvaluation?.dynamicGuestCountExplanation?.supportSourceFreshness,
    ).toBe("unknown");
    const invalidStale = replaceSnapshot(compatibilityInputs(), SUPPORT_KEY, {
      staleAt: "not-an-instant",
    });
    const result = await compatibility(invalidStale);
    expect(result?.dynamicGuestCountExplanation?.supportSourceFreshness).toBe(
      "unknown",
    );
  });
});

describe("dynamic explanation dependency states", () => {
  it("exposes a missing support-source dependency", async () => {
    const input = compatibilityInputs();
    const snapshots = input.snapshots.filter(
      (snapshot) => snapshot.definition.key !== SUPPORT_KEY,
    );
    const result = await compatibility({ ...input, snapshots });
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      supportSourceState: null,
      supportSourceValue: null,
      supportSourceFreshness: "unknown",
      ready: false,
      outcome: "UNKNOWN",
      reason: "configuration_incomplete",
      comparison: null,
    });
  });

  it("exposes conflict without fabricating a numeric comparison", async () => {
    const input = replaceSnapshot(compatibilityInputs(), SUPPORT_KEY, {
      state: "conflict",
    });
    const result = await compatibility(input);
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      supportSourceState: "conflict",
      supportSourceValue: 170,
      ready: false,
      outcome: "CONFLICT",
      reason: "conflict",
      comparison: null,
    });
  });
});

describe("dynamic explanation invalid values", () => {
  it("does not compare an invalid target", async () => {
    const result = await compatibility(compatibilityInputs(), {
      targetGuestCountOverride: -1,
    });
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "UNKNOWN",
      reason: "invalid_target_guest_count",
      ready: false,
      comparison: null,
    });
  });

  it("does not compare an invalid support value", async () => {
    const input = replaceSnapshot(compatibilityInputs(), SUPPORT_KEY, {
      retainedValue: -1,
    });
    const result = await compatibility(input);
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "UNKNOWN",
      reason: "invalid_support_ceiling",
      ready: false,
      comparison: null,
    });
  });
});

describe("dynamic explanation readiness", () => {
  it("requires active source evidence", async () => {
    const input = replaceSnapshot(compatibilityInputs(), SUPPORT_KEY, {
      retainedObservationStatus: "withdrawn",
    });
    const result = await compatibility(input);
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
      outcome: "PASS",
      ready: false,
    });
  });

  it("keeps comparison reconstructible when derived configuration is invalid", async () => {
    const input = replaceSnapshot(compatibilityInputs(), DERIVED_KEY, {
      definition: derivedDefinition({ evaluationRuleJson: null }),
    });
    const result = await compatibility(input);
    expect(result?.dynamicGuestCountExplanation).toMatchObject({
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
