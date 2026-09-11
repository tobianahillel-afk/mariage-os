import { isMediaUuid } from "@domain/documents/venue-remote-media";
import type {
  VenueRemoteMediaLifecycleAction,
  VenueRemoteMediaLifecycleReceipt,
} from "@domain/documents/venue-remote-media-lifecycle";
import { mediaPersistenceErrorCode } from "./media-persistence-error";

export interface TransitionVenueRemoteMediaLifecycleRequest {
  readonly projectId: unknown;
  readonly mediaId: unknown;
  readonly action: unknown;
  readonly expectedRevision: unknown;
}

export interface NormalizedTransitionVenueRemoteMediaLifecycleRequest {
  readonly projectId: string;
  readonly mediaId: string;
  readonly action: VenueRemoteMediaLifecycleAction;
  readonly expectedRevision: number;
}

export interface RemoteMediaLifecyclePort {
  transitionVenueRemoteMediaLifecycle?(
    input: NormalizedTransitionVenueRemoteMediaLifecycleRequest,
  ): Promise<VenueRemoteMediaLifecycleReceipt>;
}

type RemoteMediaLifecycleError =
  | "invalid_identity"
  | "invalid_action"
  | "invalid_revision"
  | "replay_conflict"
  | "provider_response_invalid"
  | "storage_retryable"
  | "persistence_failed";

type RemoteMediaLifecycleResult =
  | { readonly ok: true; readonly value: VenueRemoteMediaLifecycleReceipt }
  | { readonly ok: false; readonly error: RemoteMediaLifecycleError };

function lifecycleFailure(error: unknown): RemoteMediaLifecycleError {
  const code = mediaPersistenceErrorCode(error);
  if (code === "conflict") return "replay_conflict";
  if (code === "provider_response_invalid") return code;
  if (code === "storage_retryable") return code;
  return "persistence_failed";
}

function isLifecycleAction(
  value: unknown,
): value is VenueRemoteMediaLifecycleAction {
  return value === "soft_delete" || value === "restore";
}

function isPositiveSafeRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

export async function orchestrateVenueRemoteMediaLifecycle(
  port: RemoteMediaLifecyclePort,
  input: TransitionVenueRemoteMediaLifecycleRequest,
): Promise<RemoteMediaLifecycleResult> {
  if (!isMediaUuid(input.projectId) || !isMediaUuid(input.mediaId)) {
    return { ok: false, error: "invalid_identity" };
  }
  if (!isLifecycleAction(input.action)) {
    return { ok: false, error: "invalid_action" };
  }
  if (!isPositiveSafeRevision(input.expectedRevision)) {
    return { ok: false, error: "invalid_revision" };
  }

  const transition = port.transitionVenueRemoteMediaLifecycle;
  if (transition === undefined) {
    return { ok: false, error: "persistence_failed" };
  }

  try {
    const value = await transition.call(port, {
      projectId: input.projectId,
      mediaId: input.mediaId,
      action: input.action,
      expectedRevision: input.expectedRevision,
    });
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: lifecycleFailure(error) };
  }
}
