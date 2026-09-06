export interface VenueSpaceDraft {
  readonly name: string;
  readonly spaceType: string;
  readonly indoor?: boolean | null;
  readonly areaM2?: number | null;
  readonly lengthM?: number | null;
  readonly widthM?: number | null;
  readonly heightM?: number | null;
  readonly capacitySeated?: number | null;
  readonly capacityCocktail?: number | null;
  readonly sortOrder?: number;
  readonly notes?: string | null;
}

export type VenueSpaceError =
  | "name_required"
  | "name_too_long"
  | "space_type_required"
  | "space_type_too_long"
  | "measurement_invalid"
  | "capacity_invalid"
  | "sort_order_invalid"
  | "notes_too_long";

export interface NormalizedVenueSpace {
  readonly name: string;
  readonly spaceType: string;
  readonly indoor: boolean | null;
  readonly areaM2: number | null;
  readonly lengthM: number | null;
  readonly widthM: number | null;
  readonly heightM: number | null;
  readonly capacitySeated: number | null;
  readonly capacityCocktail: number | null;
  readonly sortOrder: number;
  readonly notes: string | null;
}

export type VenueSpaceNormalization =
  | { readonly ok: true; readonly value: NormalizedVenueSpace }
  | { readonly ok: false; readonly error: VenueSpaceError };

type FieldResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueSpaceError };

interface VenueSpaceMeasurements {
  readonly areaM2: number | null;
  readonly lengthM: number | null;
  readonly widthM: number | null;
  readonly heightM: number | null;
}

interface VenueSpaceCapacities {
  readonly capacitySeated: number | null;
  readonly capacityCocktail: number | null;
}

function requiredText(
  value: string,
  limit: number,
  emptyError: VenueSpaceError,
  longError: VenueSpaceError,
): FieldResult<string> {
  const normalized = value.trim();
  if (normalized.length === 0) return { ok: false, error: emptyError };
  if (normalized.length > limit) return { ok: false, error: longError };
  return { ok: true, value: normalized };
}

function optionalMeasurement(
  value: number | null | undefined,
): FieldResult<number | null> {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "measurement_invalid" };
  }
  return { ok: true, value };
}

function optionalCapacity(
  value: number | null | undefined,
): FieldResult<number | null> {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (!Number.isSafeInteger(value) || value < 0) {
    return { ok: false, error: "capacity_invalid" };
  }
  return { ok: true, value };
}

function optionalNote(
  value: string | null | undefined,
): FieldResult<string | null> {
  if (value === null || value === undefined) return { ok: true, value: null };
  const normalized = value.trim();
  if (normalized.length === 0) return { ok: true, value: null };
  if (normalized.length > 5_000) return { ok: false, error: "notes_too_long" };
  return { ok: true, value: normalized };
}

function normalizeMeasurements(
  draft: VenueSpaceDraft,
): FieldResult<VenueSpaceMeasurements> {
  const areaM2 = optionalMeasurement(draft.areaM2);
  if (!areaM2.ok) return areaM2;
  const lengthM = optionalMeasurement(draft.lengthM);
  if (!lengthM.ok) return lengthM;
  const widthM = optionalMeasurement(draft.widthM);
  if (!widthM.ok) return widthM;
  const heightM = optionalMeasurement(draft.heightM);
  if (!heightM.ok) return heightM;

  return {
    ok: true,
    value: {
      areaM2: areaM2.value,
      lengthM: lengthM.value,
      widthM: widthM.value,
      heightM: heightM.value,
    },
  };
}

function normalizeCapacities(
  draft: VenueSpaceDraft,
): FieldResult<VenueSpaceCapacities> {
  const capacitySeated = optionalCapacity(draft.capacitySeated);
  if (!capacitySeated.ok) return capacitySeated;
  const capacityCocktail = optionalCapacity(draft.capacityCocktail);
  if (!capacityCocktail.ok) return capacityCocktail;

  return {
    ok: true,
    value: {
      capacitySeated: capacitySeated.value,
      capacityCocktail: capacityCocktail.value,
    },
  };
}

export function normalizeVenueSpaceDraft(
  draft: VenueSpaceDraft,
): VenueSpaceNormalization {
  const name = requiredText(draft.name, 160, "name_required", "name_too_long");
  if (!name.ok) return name;

  const spaceType = requiredText(
    draft.spaceType,
    80,
    "space_type_required",
    "space_type_too_long",
  );
  if (!spaceType.ok) return spaceType;

  const measurements = normalizeMeasurements(draft);
  if (!measurements.ok) return measurements;
  const capacities = normalizeCapacities(draft);
  if (!capacities.ok) return capacities;

  const sortOrder = draft.sortOrder ?? 0;
  if (!Number.isSafeInteger(sortOrder)) {
    return { ok: false, error: "sort_order_invalid" };
  }

  const notes = optionalNote(draft.notes);
  if (!notes.ok) return notes;

  return {
    ok: true,
    value: {
      name: name.value,
      spaceType: spaceType.value,
      indoor: draft.indoor ?? null,
      ...measurements.value,
      ...capacities.value,
      sortOrder,
      notes: notes.value,
    },
  };
}
