import type { VenueStatus } from "@domain/venues/venue-status";

export interface VenueCoreRecord {
  readonly id: string;
  readonly projectId: string;
  readonly code: string | null;
  readonly name: string;
  readonly status: VenueStatus;
  readonly rejectionReason: string | null;
  readonly websiteUrl: string | null;
  readonly city: string | null;
  readonly revision: number;
}

export interface VenueCoreUpdateInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly name: string;
  readonly code: string | null;
  readonly websiteUrl: string | null;
  readonly city: string | null;
}

export interface VenueRepositoryPort {
  listVenues(projectId: string): Promise<readonly VenueCoreRecord[]>;
  getVenue(projectId: string, venueId: string): Promise<VenueCoreRecord | null>;
  updateVenueCore(input: VenueCoreUpdateInput): Promise<VenueCoreRecord>;
}
