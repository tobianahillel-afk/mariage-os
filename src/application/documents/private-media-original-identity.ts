import { isMediaUuid } from "@domain/documents/venue-remote-media";

interface PrivateOriginalIdentityCandidate {
  readonly operationId: unknown;
  readonly projectId: unknown;
  readonly venueId: unknown;
  readonly mediaId: unknown;
  readonly linkId: unknown;
}

type ValidPrivateOriginalIdentity<T extends PrivateOriginalIdentityCandidate> =
  T & {
    readonly operationId: string;
    readonly projectId: string;
    readonly venueId: string;
    readonly mediaId: string;
    readonly linkId: string;
  };

export function hasPrivateOriginalIdentity<
  T extends PrivateOriginalIdentityCandidate,
>(input: T): input is ValidPrivateOriginalIdentity<T> {
  return (
    isMediaUuid(input.operationId) &&
    isMediaUuid(input.projectId) &&
    isMediaUuid(input.venueId) &&
    isMediaUuid(input.mediaId) &&
    isMediaUuid(input.linkId)
  );
}
