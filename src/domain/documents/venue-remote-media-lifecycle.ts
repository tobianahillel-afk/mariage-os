import type {
  VenueMediaCategory,
  VenueRemoteMediaLinkRecord,
} from "./venue-remote-media";

export type VenueRemoteMediaLifecycleAction = "soft_delete" | "restore";

export interface VenueRemoteMediaLifecycleRecord {
  readonly id: string;
  readonly projectId: string;
  readonly mediaType: "image";
  readonly category: VenueMediaCategory | null;
  readonly storagePath: null;
  readonly remoteUrl: string;
  readonly sourcePageUrl: string | null;
  readonly originalFilename: null;
  readonly mimeType: null;
  readonly sizeBytes: null;
  readonly sha256: null;
  readonly widthPx: null;
  readonly heightPx: null;
  readonly derivativeOfId: null;
  readonly derivativeKind: null;
  readonly derivativeVersion: null;
  readonly isOriginal: true;
  readonly uploadStatus: "ready";
  readonly caption: string | null;
  readonly deletedAt: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly updatedAt: string;
  readonly updatedBy: string;
  readonly revision: number;
}

export interface VenueRemoteMediaLifecycleReceipt {
  readonly action: VenueRemoteMediaLifecycleAction;
  readonly replayed: boolean;
  readonly media: VenueRemoteMediaLifecycleRecord;
  readonly link: VenueRemoteMediaLinkRecord;
}
