import type { VenueMediaCategory } from "@domain/documents/venue-remote-media";

type PrivateImageMimeType = "image/jpeg" | "image/png" | "image/webp";

export interface ReserveVenuePrivateOriginalInput {
  readonly operationId: string;
  readonly projectId: string;
  readonly venueId: string;
  readonly mediaId: string;
  readonly linkId: string;
  readonly category: VenueMediaCategory | null;
  readonly caption: string | null;
  readonly originalFilename: string;
  readonly mimeType: PrivateImageMimeType;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface VenuePrivateOriginalReservation {
  readonly storagePath: string;
  readonly replayed: boolean;
}

export interface PrivateMediaLifecyclePort {
  reserveOriginal(
    input: ReserveVenuePrivateOriginalInput,
  ): Promise<VenuePrivateOriginalReservation>;
}
