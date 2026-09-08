import {
  normalizeVenueContact,
  type NormalizedVenueContact,
  type VenueContactDraft,
  type VenueContactRecord,
  type VenueContactValidationError,
} from "@domain/venues/venue-contact";
import { isVenueCommercialUuid } from "@domain/venues/venue-commercial-values";
import { validateExpectedVenueRevision } from "@domain/venues/venue-revision";
import { venueContactPersistenceErrorCode } from "./venue-contact-persistence-error";

export interface SaveVenueContactInput extends NormalizedVenueContact {
  readonly projectId: string;
  readonly venueId: string;
  readonly contactId: string;
  readonly expectedRevision: number | null;
}

export interface VenueContactPort {
  saveVenueContact(input: SaveVenueContactInput): Promise<VenueContactRecord>;
  listVenueContacts(
    projectId: string,
    venueId: string,
  ): Promise<readonly VenueContactRecord[]>;
}

export interface VenueContactSaveDraft extends VenueContactDraft {
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly contactId: unknown;
  readonly expectedRevision?: unknown;
}

type VenueContactServiceError =
  | "invalid_identity"
  | VenueContactValidationError
  | "expected_revision_invalid"
  | "conflict"
  | "persistence_failed";

export type VenueContactResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: VenueContactServiceError };

function normalizeExpectedRevision(value: unknown): number | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number") return undefined;
  return validateExpectedVenueRevision(value) === null ? value : undefined;
}

function persistenceError(error: unknown): VenueContactServiceError {
  return venueContactPersistenceErrorCode(error) === "conflict"
    ? "conflict"
    : "persistence_failed";
}

export class VenueContactService {
  constructor(private readonly port: VenueContactPort) {}

  async saveVenueContact(
    draft: VenueContactSaveDraft,
  ): Promise<VenueContactResult<VenueContactRecord>> {
    if (
      !isVenueCommercialUuid(draft.projectId) ||
      !isVenueCommercialUuid(draft.venueId) ||
      !isVenueCommercialUuid(draft.contactId)
    ) {
      return { ok: false, error: "invalid_identity" };
    }
    const expectedRevision = normalizeExpectedRevision(draft.expectedRevision);
    if (expectedRevision === undefined) {
      return { ok: false, error: "expected_revision_invalid" };
    }
    const normalized = normalizeVenueContact(draft);
    if (!normalized.ok) return normalized;

    try {
      const value = await this.port.saveVenueContact({
        projectId: draft.projectId,
        venueId: draft.venueId,
        contactId: draft.contactId,
        expectedRevision,
        ...normalized.value,
      });
      return { ok: true, value };
    } catch (error) {
      return { ok: false, error: persistenceError(error) };
    }
  }

  async listVenueContacts(
    projectId: unknown,
    venueId: unknown,
  ): Promise<VenueContactResult<readonly VenueContactRecord[]>> {
    if (!isVenueCommercialUuid(projectId) || !isVenueCommercialUuid(venueId)) {
      return { ok: false, error: "invalid_identity" };
    }
    try {
      return {
        ok: true,
        value: await this.port.listVenueContacts(projectId, venueId),
      };
    } catch {
      return { ok: false, error: "persistence_failed" };
    }
  }
}
