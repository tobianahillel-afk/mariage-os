import type { LocalOfflinePin } from "@application/local-data/local-offline-pin";
import { isUuid } from "@application/local-data/local-project-scope";

type VenueVisitMediaPolicy = "none" | "thumbnails";

export interface LocalVenueVisitPackage {
  readonly venue: {
    readonly id: string;
    readonly name: string;
  };
  readonly checklist: readonly string[];
  readonly preparedAt: string;
  readonly mediaPolicy: VenueVisitMediaPolicy;
  readonly packageRevision: number;
}

type RawRecord = Record<string, unknown>;

function invalid(field: string): never {
  throw new Error(`Invalid persisted Venue visit package ${field}.`);
}

function recordValue(value: unknown, field: string): RawRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return invalid(field);
  }
  return value as RawRecord;
}

function stringValue(value: unknown, field: string): string {
  return typeof value === "string" && value.length > 0 ? value : invalid(field);
}

function uuidValue(value: unknown, field: string): string {
  const parsed = stringValue(value, field);
  return isUuid(parsed) ? parsed : invalid(field);
}

function instantValue(value: unknown): string {
  const parsed = stringValue(value, "prepared timestamp");
  const date = new Date(parsed);
  return !Number.isNaN(date.getTime()) && date.toISOString() === parsed
    ? parsed
    : invalid("prepared timestamp");
}

function mediaPolicyValue(value: unknown): VenueVisitMediaPolicy {
  return value === "none" || value === "thumbnails"
    ? value
    : invalid("media policy");
}

function revisionValue(value: unknown): number {
  return Number.isInteger(value) && (value as number) >= 1
    ? (value as number)
    : invalid("package revision");
}

function checklistValue(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return invalid("checklist");
  return value.map((entry) => stringValue(entry, "checklist item"));
}

export function parseVenueVisitPackagePayload(
  value: unknown,
): LocalVenueVisitPackage {
  const row = recordValue(value, "record");
  const venue = recordValue(row.venue, "Venue");
  return {
    venue: {
      id: uuidValue(venue.id, "Venue id"),
      name: stringValue(venue.name, "Venue name"),
    },
    checklist: checklistValue(row.checklist),
    preparedAt: instantValue(row.preparedAt),
    mediaPolicy: mediaPolicyValue(row.mediaPolicy),
    packageRevision: revisionValue(row.packageRevision),
  };
}

export function assertVenueVisitPackageMatchesPin(
  visitPackage: LocalVenueVisitPackage,
  pin: LocalOfflinePin,
): void {
  if (
    visitPackage.venue.id !== pin.entityId ||
    visitPackage.preparedAt !== pin.preparedAt ||
    visitPackage.mediaPolicy !== pin.mediaPolicy ||
    visitPackage.packageRevision !== pin.packageRevision
  ) {
    throw new Error("Offline pin visit package metadata does not match.");
  }
}
