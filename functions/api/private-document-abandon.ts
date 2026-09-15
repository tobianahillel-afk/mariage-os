import {
  createClient,
  type SupabaseClient as SupabaseProviderClient,
} from "@supabase/supabase-js";
import {
  abandonTargets,
  bearerToken,
  providerEnvironment,
  requestHasBodyFrame,
  requestOriginAllowed,
  serviceKey,
  type AbandonTargets as TrustedTargets,
  type PrivateDocumentPagesEnvironment,
  type ProviderEnvironment,
} from "./private-document-request.js";

const CANONICAL_BUCKET = "project-private";
const STAGING_BUCKET = "document-ingest-staging";

type EmptyProviderMap = Record<never, never>;

type ReservedDocument = {
  readonly id: string;
  readonly project_id: string;
  readonly storage_path: string;
  readonly classification: string;
  readonly upload_status: string;
  readonly deleted_at: string | null;
  readonly remote_url: string | null;
};

interface AbandonDatabase {
  public: {
    Tables: {
      documents: {
        Row: ReservedDocument;
        Insert: Partial<ReservedDocument>;
        Update: Partial<ReservedDocument>;
        Relationships: [];
      };
    };
    Views: EmptyProviderMap;
    Functions: {
      has_project_permission: {
        Args: {
          target_project_id: string;
          requested_permission: string;
        };
        Returns: boolean;
      };
      manage_private_document: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: EmptyProviderMap;
    CompositeTypes: EmptyProviderMap;
  };
}

type ProviderClient = SupabaseProviderClient<AbandonDatabase>;

interface RequestCredentials {
  readonly targets: TrustedTargets;
  readonly token: string;
  readonly provider: ProviderEnvironment;
}

interface UserAuthority {
  readonly client: ProviderClient;
  readonly targets: TrustedTargets;
}

function json(
  status: number,
  body: Readonly<Record<string, unknown>>,
): Response {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function unavailable(status = 404): Response {
  return json(status, { error: "private_document_unavailable" });
}

function exactStoragePath(projectId: string, documentId: string): string {
  return `${projectId}/documents/${documentId}/original`;
}

async function hasWritePermission(
  client: ProviderClient,
  projectId: string,
): Promise<boolean> {
  const { data, error } = await client.rpc("has_project_permission", {
    target_project_id: projectId,
    requested_permission: "documents.write",
  });
  return error === null && data === true;
}

function validReservation(
  value: ReservedDocument,
  targets: TrustedTargets,
): boolean {
  return [
    value.id === targets.documentId,
    value.project_id === targets.projectId,
    value.storage_path ===
      exactStoragePath(targets.projectId, targets.documentId),
    value.classification === "private",
    value.upload_status === "pending",
    value.deleted_at === null,
    value.remote_url === null,
  ].every(Boolean);
}

async function reservationFor(
  client: ProviderClient,
  targets: TrustedTargets,
): Promise<ReservedDocument | Response | null> {
  const { data, error } = await client
    .from("documents")
    .select(
      "id,project_id,storage_path,classification,upload_status,deleted_at,remote_url",
    )
    .eq("project_id", targets.projectId)
    .eq("id", targets.documentId)
    .maybeSingle();
  if (error) return unavailable(503);
  if (data === null) return null;
  return validReservation(data, targets) ? data : unavailable(409);
}

function requestFrameError(request: Request): Response | null {
  if (!requestOriginAllowed(request)) return unavailable(403);
  if (request.method !== "DELETE") return unavailable(405);
  if (requestHasBodyFrame(request)) return unavailable(413);
  return null;
}

function requestCredentials(
  request: Request,
  env: PrivateDocumentPagesEnvironment,
): RequestCredentials | Response {
  const targets = abandonTargets(request);
  if (targets === null) return unavailable(400);
  const token = bearerToken(request);
  if (token === null) return unavailable(401);
  const provider = providerEnvironment(env);
  if (provider === null) return unavailable(503);
  return { targets, token, provider };
}

async function userAuthority(
  request: Request,
  env: PrivateDocumentPagesEnvironment,
): Promise<UserAuthority | Response> {
  const frameError = requestFrameError(request);
  if (frameError !== null) return frameError;
  const credentials = requestCredentials(request, env);
  if (credentials instanceof Response) return credentials;
  const { targets, token, provider } = credentials;
  const client = createClient<AbandonDatabase>(
    provider.url,
    provider.publishableKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
  const { data, error } = await client.auth.getUser(token);
  if (error || data.user === null) return unavailable(401);
  if (!(await hasWritePermission(client, targets.projectId))) {
    return unavailable();
  }
  return { client, targets };
}

function adminClient(
  env: PrivateDocumentPagesEnvironment,
): ProviderClient | null {
  const provider = providerEnvironment(env);
  const secret = serviceKey(env);
  if (provider === null || secret === null) return null;
  return createClient<AbandonDatabase>(provider.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function splitObjectPath(path: string): { folder: string; name: string } {
  const separator = path.lastIndexOf("/");
  return {
    folder: path.slice(0, separator),
    name: path.slice(separator + 1),
  };
}

async function objectAbsent(
  admin: ProviderClient,
  bucket: string,
  path: string,
): Promise<boolean> {
  const { folder, name } = splitObjectPath(path);
  const result = await admin.storage.from(bucket).list(folder, { limit: 100 });
  return (
    result.error === null &&
    result.data !== null &&
    !result.data.some((entry) => entry.name === name)
  );
}

async function removeAndProveAbsent(
  admin: ProviderClient,
  bucket: string,
  path: string,
): Promise<boolean> {
  const removal = await admin.storage.from(bucket).remove([path]);
  return removal.error === null && objectAbsent(admin, bucket, path);
}

function abandonArgs(targets: TrustedTargets): Record<string, unknown> {
  return {
    target_action: "abandon_upload",
    target_operation_id: targets.operationId,
    target_project_id: targets.projectId,
    target_document_id: targets.documentId,
    target_venue_id: null,
    target_link_id: null,
    target_expected_revision: null,
    target_document_type: null,
    target_title: null,
    target_original_filename: null,
    target_mime_type: null,
    target_size_bytes: null,
    target_sha256: null,
    target_source_id: null,
  };
}

function validAbsentReceipt(value: unknown, targets: TrustedTargets): boolean {
  if (typeof value !== "object" || value === null) return false;
  const receipt = value as Record<string, unknown>;
  return (
    receipt.action === "abandon_upload" &&
    receipt.projectId === targets.projectId &&
    receipt.documentId === targets.documentId &&
    receipt.absent === true
  );
}

async function finishLifecycle(authority: UserAuthority): Promise<Response> {
  if (
    !(await hasWritePermission(authority.client, authority.targets.projectId))
  ) {
    return unavailable();
  }
  const { data, error } = await authority.client.rpc(
    "manage_private_document",
    abandonArgs(authority.targets),
  );
  if (error || !validAbsentReceipt(data, authority.targets)) {
    return unavailable(409);
  }
  return json(200, { ok: true, absent: true });
}

async function cleanReservedObjects(
  authority: UserAuthority,
  admin: ProviderClient,
  path: string,
): Promise<Response | null> {
  if (
    !(await hasWritePermission(authority.client, authority.targets.projectId))
  ) {
    return unavailable();
  }
  if (!(await removeAndProveAbsent(admin, STAGING_BUCKET, path))) {
    return unavailable(503);
  }
  if (
    !(await hasWritePermission(authority.client, authority.targets.projectId))
  ) {
    return unavailable();
  }
  if (!(await removeAndProveAbsent(admin, CANONICAL_BUCKET, path))) {
    return unavailable(503);
  }
  return null;
}

export async function handleTrustedAbandon(
  request: Request,
  env: PrivateDocumentPagesEnvironment,
): Promise<Response> {
  const authority = await userAuthority(request, env);
  if (authority instanceof Response) return authority;
  const reservation = await reservationFor(authority.client, authority.targets);
  if (reservation instanceof Response) return reservation;
  if (reservation !== null) {
    const admin = adminClient(env);
    if (admin === null) return unavailable(503);
    const cleanup = await cleanReservedObjects(
      authority,
      admin,
      reservation.storage_path,
    );
    if (cleanup !== null) return cleanup;
  }
  return finishLifecycle(authority);
}
