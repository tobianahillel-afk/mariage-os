import type { VenueStatus } from "@domain/venues/venue-status";

export interface VenueQuickAddInput {
  readonly projectId: string;
  readonly name: string;
  readonly code: string | null;
  readonly websiteUrl: string | null;
  readonly city: string | null;
}

export interface CreatedVenue {
  readonly id: string;
  readonly projectId: string;
  readonly status: "research";
  readonly revision: number;
}

export interface VenueTransitionInput {
  readonly projectId: string;
  readonly venueId: string;
  readonly status: VenueStatus;
  readonly rejectionReason: string | null;
  readonly expectedRevision: number;
}

export interface VenueCommandPort {
  createVenue(input: VenueQuickAddInput): Promise<CreatedVenue>;
  transitionVenue(input: VenueTransitionInput): Promise<number>;
}
