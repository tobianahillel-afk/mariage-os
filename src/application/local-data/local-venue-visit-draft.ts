import {
  isUuid,
  type LocalProjectScope,
} from "@application/local-data/local-project-scope";
import {
  createCachedRecordEnvelope,
  type CachedRecordEnvelope,
} from "@application/local-data/local-records";

interface LocalVenueVisitQuestion {
  readonly questionId: string;
  readonly prompt: string;
  readonly response: string | null;
}

interface LocalVenueVisitMeasurement {
  readonly key: string;
  readonly value: number;
  readonly unit: string;
}

export interface LocalVenueVisitDraft {
  readonly venueId: string;
  readonly projectId: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly draftRevision: number;
  readonly questionSetRevision: number;
  readonly questions: readonly LocalVenueVisitQuestion[];
  readonly notes: string;
  readonly measurements: readonly LocalVenueVisitMeasurement[];
  readonly personalRatingIntent: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type RawRecord = Record<string, unknown>;

function invalid(field: string): never {
  throw new Error(`Invalid persisted Venue visit draft ${field}.`);
}

function recordValue(value: unknown, field: string): RawRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid(field);
  }
  return value as RawRecord;
}

function stringValue(value: unknown, field: string): string {
  return typeof value === "string" ? value : invalid(field);
}

function nonEmptyString(value: unknown, field: string): string {
  const parsed = stringValue(value, field);
  return parsed.length > 0 ? parsed : invalid(field);
}

function uuidValue(value: unknown, field: string): string {
  const parsed = nonEmptyString(value, field);
  return isUuid(parsed) ? parsed : invalid(field);
}

function positiveInteger(value: unknown, field: string): number {
  return Number.isSafeInteger(value) && (value as number) >= 1
    ? (value as number)
    : invalid(field);
}

function instantValue(value: unknown, field: string): string {
  const parsed = nonEmptyString(value, field);
  const date = new Date(parsed);
  return !Number.isNaN(date.getTime()) && date.toISOString() === parsed
    ? parsed
    : invalid(field);
}

function responseValue(value: unknown): string | null {
  return value === null || typeof value === "string"
    ? value
    : invalid("question response");
}

function questionValue(value: unknown): LocalVenueVisitQuestion {
  const row = recordValue(value, "question");
  return {
    questionId: nonEmptyString(row.questionId, "question id"),
    prompt: nonEmptyString(row.prompt, "question prompt"),
    response: responseValue(row.response),
  };
}

function questionsValue(value: unknown): readonly LocalVenueVisitQuestion[] {
  if (!Array.isArray(value)) return invalid("questions");
  const questions = value.map(questionValue);
  const uniqueIds = new Set(questions.map((question) => question.questionId));
  if (uniqueIds.size !== questions.length) invalid("question ids");
  return questions;
}

function finiteNumber(value: unknown, field: string): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : invalid(field);
}

function measurementValue(value: unknown): LocalVenueVisitMeasurement {
  const row = recordValue(value, "measurement");
  return {
    key: nonEmptyString(row.key, "measurement key"),
    value: finiteNumber(row.value, "measurement value"),
    unit: nonEmptyString(row.unit, "measurement unit"),
  };
}

function measurementsValue(
  value: unknown,
): readonly LocalVenueVisitMeasurement[] {
  if (!Array.isArray(value)) return invalid("measurements");
  const measurements = value.map(measurementValue);
  const uniqueKeys = new Set(
    measurements.map((measurement) => measurement.key),
  );
  if (uniqueKeys.size !== measurements.length) invalid("measurement keys");
  return measurements;
}

function ratingValue(value: unknown): number | null {
  if (value === null) return null;
  return Number.isInteger(value) &&
    (value as number) >= 1 &&
    (value as number) <= 5
    ? (value as number)
    : invalid("personal rating");
}

export function parseLocalVenueVisitDraft(value: unknown): LocalVenueVisitDraft {
  const row = recordValue(value, "record");
  const createdAt = instantValue(row.createdAt, "created timestamp");
  const updatedAt = instantValue(row.updatedAt, "updated timestamp");
  if (updatedAt < createdAt) invalid("timestamp order");

  return {
    venueId: uuidValue(row.venueId, "Venue id"),
    projectId: uuidValue(row.projectId, "project id"),
    userId: uuidValue(row.userId, "user id"),
    deviceId: uuidValue(row.deviceId, "device id"),
    draftRevision: positiveInteger(row.draftRevision, "draft revision"),
    questionSetRevision: positiveInteger(
      row.questionSetRevision,
      "question-set revision",
    ),
    questions: questionsValue(row.questions),
    notes: stringValue(row.notes, "notes"),
    measurements: measurementsValue(row.measurements),
    personalRatingIntent: ratingValue(row.personalRatingIntent),
    createdAt,
    updatedAt,
  };
}

export function assertLocalVenueVisitDraftScope(
  draft: LocalVenueVisitDraft,
  scope: LocalProjectScope,
): void {
  if (
    draft.projectId !== scope.projectId ||
    draft.userId !== scope.userId ||
    draft.deviceId !== scope.deviceId
  ) {
    throw new Error("Venue visit draft belongs to another local scope.");
  }
}

export function createLocalVenueVisitDraftCachedRecord(
  scope: LocalProjectScope,
  draft: LocalVenueVisitDraft,
): CachedRecordEnvelope {
  const parsed = parseLocalVenueVisitDraft(draft);
  assertLocalVenueVisitDraftScope(parsed, scope);
  return createCachedRecordEnvelope(scope, {
    recordType: "venue_visit_draft",
    entityId: parsed.venueId,
    serverRevision: null,
    serverUpdatedAt: null,
    syncMarker: "pending",
    payload: {
      venueId: parsed.venueId,
      projectId: parsed.projectId,
      userId: parsed.userId,
      deviceId: parsed.deviceId,
      draftRevision: parsed.draftRevision,
      questionSetRevision: parsed.questionSetRevision,
      questions: parsed.questions.map((question) => ({
        questionId: question.questionId,
        prompt: question.prompt,
        response: question.response,
      })),
      notes: parsed.notes,
      measurements: parsed.measurements.map((measurement) => ({
        key: measurement.key,
        value: measurement.value,
        unit: measurement.unit,
      })),
      personalRatingIntent: parsed.personalRatingIntent,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    },
  });
}
