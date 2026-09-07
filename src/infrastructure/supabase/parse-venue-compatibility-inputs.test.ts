import { describe, expect, it } from "vitest";
import {
  parseVenueCompatibilityInputs,
  retainedObservationIds,
} from "./parse-venue-compatibility-inputs";

const PROJECT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_PROJECT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VENUE_ID = "a1000000-0000-4000-8000-000000000001";
const ACCESS_DEFINITION_ID = "a2000000-0000-4000-8000-000000000001";
const PARKING_DEFINITION_ID = "a2000000-0000-4000-8000-000000000002";
const FACT_ID = "a3000000-0000-4000-8000-000000000001";
const OTHER_FACT_ID = "a3000000-0000-4000-8000-000000000002";
const OBSERVATION_ID = "a4000000-0000-4000-8000-000000000001";
const OTHER_OBSERVATION_ID = "a4000000-0000-4000-8000-000000000002";

interface MutableRows {
  project: unknown;
  venue: unknown;
  definitions: unknown[];
  facts: unknown[];
  observations: unknown[];
}

function definitionRow(
  id: string,
  key: string,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  return {
    id,
    project_id: PROJECT_ID,
    key,
    label: key,
    entity_type: "venue",
    value_type: "boolean",
    unit: null,
    priority: "important",
    weight: null,
    freshness_policy: null,
    system_defined: false,
    options_json: null,
    evaluation_rule_json: { type: "boolean_equals", expected: true },
    revision: 1,
    ...overrides,
  };
}

function factRow(
  definitionId: string = PARKING_DEFINITION_ID,
  overrides: Readonly<Record<string, unknown>> = {},
) {
  return {
    id: FACT_ID,
    project_id: PROJECT_ID,
    target_type: "venue",
    target_id: VENUE_ID,
    definition_id: definitionId,
    state: "known",
    retained_value: true,
    retained_observation_id: OBSERVATION_ID,
    stale_at: "2026-09-07T20:00:00+02:00",
    revision: 1,
    ...overrides,
  };
}

function observationRow(overrides: Readonly<Record<string, unknown>> = {}) {
  return {
    id: OBSERVATION_ID,
    project_id: PROJECT_ID,
    fact_id: FACT_ID,
    observation_status: "active",
    ...overrides,
  };
}

function baseRows(): MutableRows {
  return {
    project: { id: PROJECT_ID, target_guest_count: 160 },
    venue: { id: VENUE_ID, project_id: PROJECT_ID },
    definitions: [
      definitionRow(PARKING_DEFINITION_ID, "parking"),
      definitionRow(ACCESS_DEFINITION_ID, "access"),
    ],
    facts: [factRow()],
    observations: [observationRow()],
  };
}

function parse(rows: MutableRows) {
  return parseVenueCompatibilityInputs(rows, PROJECT_ID, VENUE_ID);
}

describe("parseVenueCompatibilityInputs", () => {
  it("sorts definitions and retains evidence/freshness deterministically", () => {
    const result = parse(baseRows());
    expect(result.projectTargetGuestCount).toBe(160);
    expect(result.snapshots.map((item) => item.definition.key)).toEqual([
      "access",
      "parking",
    ]);
    expect(result.snapshots[0]).toMatchObject({
      state: null,
      retainedValue: null,
      retainedObservationStatus: null,
      staleAt: null,
    });
    expect(result.snapshots[1]).toMatchObject({
      state: "known",
      retainedValue: true,
      retainedObservationStatus: "active",
      staleAt: "2026-09-07T18:00:00.000Z",
    });
  });

  it("accepts a null project target and a known fact without evidence", () => {
    const rows = baseRows();
    rows.project = { id: PROJECT_ID, target_guest_count: null };
    rows.facts = [
      factRow(PARKING_DEFINITION_ID, {
        retained_observation_id: null,
        stale_at: null,
      }),
    ];
    rows.observations = [];
    const result = parse(rows);
    expect(result.projectTargetGuestCount).toBeNull();
    expect(result.snapshots[1]?.retainedObservationStatus).toBeNull();
  });
});

describe("parseVenueCompatibilityInputs identity validation", () => {
  it.each([null, [], 3])("rejects invalid project containers %#", (project) => {
    const rows = baseRows();
    rows.project = project;
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });

  it.each([
    { id: 3, project_id: PROJECT_ID },
    { id: "bad", project_id: PROJECT_ID },
    { id: VENUE_ID, project_id: OTHER_PROJECT_ID },
  ])("rejects invalid venue identity %#", (venue) => {
    const rows = baseRows();
    rows.venue = venue;
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });

  it.each([-1, 1.5])(
    "rejects invalid project target %#",
    (targetGuestCount) => {
      const rows = baseRows();
      rows.project = { id: PROJECT_ID, target_guest_count: targetGuestCount };
      expect(() => parse(rows)).toThrow(
        "Invalid venue compatibility response.",
      );
    },
  );
});

describe("parseVenueCompatibilityInputs fact validation", () => {
  it("rejects duplicate definition ids and keys", () => {
    const rows = baseRows();
    rows.definitions.push(definitionRow(PARKING_DEFINITION_ID, "parking_copy"));
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
    rows.definitions = [
      definitionRow(PARKING_DEFINITION_ID, "parking"),
      definitionRow(ACCESS_DEFINITION_ID, "parking"),
    ];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });

  it("rejects unknown or duplicate fact definitions", () => {
    const rows = baseRows();
    rows.facts = [factRow(OTHER_PROJECT_ID)];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
    rows.facts = [
      factRow(),
      factRow(PARKING_DEFINITION_ID, { id: OTHER_FACT_ID }),
    ];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });

  it("rejects one fact primary key projected under multiple definitions", () => {
    const rows = baseRows();
    rows.facts = [
      factRow(),
      factRow(ACCESS_DEFINITION_ID, {
        retained_observation_id: OTHER_OBSERVATION_ID,
      }),
    ];
    rows.observations = [
      observationRow(),
      observationRow({ id: OTHER_OBSERVATION_ID }),
    ];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });

  it("rejects malformed freshness and retained observation ids", () => {
    const rows = baseRows();
    rows.facts = [
      factRow(PARKING_DEFINITION_ID, { stale_at: "not-an-instant" }),
    ];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
    rows.facts = [
      factRow(PARKING_DEFINITION_ID, {
        retained_observation_id: "bad",
      }),
    ];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });
});

describe("parseVenueCompatibilityInputs observation validation", () => {
  it.each([
    ["unexpected id", { id: OTHER_OBSERVATION_ID }],
    ["wrong project", { project_id: OTHER_PROJECT_ID }],
    ["wrong fact", { fact_id: OTHER_FACT_ID }],
    ["invalid status", { observation_status: "mystery" }],
  ])("rejects %s", (_label, override) => {
    const rows = baseRows();
    rows.observations = [observationRow(override)];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });

  it("rejects duplicate or missing retained observations", () => {
    const rows = baseRows();
    rows.observations = [observationRow(), observationRow()];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
    rows.observations = [];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });

  it("rejects one retained observation claimed by multiple facts", () => {
    const rows = baseRows();
    rows.facts = [
      factRow(),
      factRow(ACCESS_DEFINITION_ID, {
        id: OTHER_FACT_ID,
        retained_observation_id: OBSERVATION_ID,
      }),
    ];
    expect(() => parse(rows)).toThrow("Invalid venue compatibility response.");
  });
});

describe("retainedObservationIds", () => {
  it("returns retained ids in encounter order and ignores explicit null", () => {
    expect(
      retainedObservationIds([
        factRow(),
        factRow(ACCESS_DEFINITION_ID, {
          id: OTHER_FACT_ID,
          retained_observation_id: OTHER_OBSERVATION_ID,
        }),
        factRow(PARKING_DEFINITION_ID, { retained_observation_id: null }),
      ]),
    ).toEqual([OBSERVATION_ID, OTHER_OBSERVATION_ID]);
  });

  it("rejects duplicate retained ids before the provider observation query", () => {
    expect(() =>
      retainedObservationIds([
        factRow(),
        factRow(ACCESS_DEFINITION_ID, {
          id: OTHER_FACT_ID,
          retained_observation_id: OBSERVATION_ID,
        }),
      ]),
    ).toThrow("Invalid venue compatibility response.");
  });

  it("fails closed on malformed retained ids", () => {
    expect(() =>
      retainedObservationIds([
        factRow(PARKING_DEFINITION_ID, { retained_observation_id: 3 }),
      ]),
    ).toThrow("Invalid venue compatibility response.");
  });
});
