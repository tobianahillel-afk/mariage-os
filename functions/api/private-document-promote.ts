import {
  createClient,
  type SupabaseClient as SupabaseProviderClient,
} from "@supabase/supabase-js";
import { handleTrustedAbandon } from "./private-document-abandon.js";
import {
  bytesMatchReservation,
  downloadMatchesStorageInfo,
  exactStoragePath,
  sameReservation,
  storageInfoMatchesReservation,
  validReservation,
  type ReservedDocument,
} from "./private-document-integrity.js";
import {
  bearerToken,
  promotionTargets,
  providerEnvironment,
  requestHasBodyFrame,
  requestOriginAllowed,
  serviceKey,
  type PrivateDocumentPagesEnvironment as PagesEnvironment,
  type ProviderEnvironment,
} from "./private-document-request.js";

const CANONICAL_BUCKET = "project-private";
const STAGING_BUCKET = "document-ingest-staging";

type EmptyProviderMap = Record<never, never>;

interface ProviderDatabase {
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
      attest_private_document_ingest: {
        Args: {
          target_project_id: string;
          target_document_id: string;
          target_sha256: string;
          target_size_bytes: number;
        };
        Returns: boolean;
      };
    };
    Enums: EmptyProviderMap;
    CompositeTypes: EmptyProviderMap;
  };
}

type ProviderClient = SupabaseProviderClient<ProviderDatabase>;

interface PagesContext {
  readonly request: Request;
  readonly env: PagesEnvironment;
}

interface RequestAuthority {
  readonly targets: {
    readonly projectId: string;
    readonly documentId: string;
  };
  readonly token: string;
  readonly provider: ProviderEnvironment;
}

interface PromotionContext {
  readonly userClient: ProviderClient;
  readonly admin: ProviderClient;
  readonly reservation: ReservedDocument;
  readonly path: string;
  readonly projectId: string;
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

async function storageObjectMatchesReservation(
  admin: ProviderClient,
  bucket: string,
  path: string,
  reservation: ReservedDocument,
): Promise<boolean> {
  const storage = admin.storage.from(bucket);
  const info = await storage.info(path);
  if (info.error || info.data === null) return false;
  if (!storageInfoMatchesReservation(info.data, reservation)) return false;

  const { data, error } = await storage.download(path);
  if (error || data === null) return false;
  if (!downloadMatchesStorageInfo(data, info.data.size)) return false;

  return bytesMatchReservation(
    new Uint8Array(await data.arrayBuffer()),
    reservation,
  );
}

async function hasWritePermission(
  userClient: ProviderClient,
  projectId: string,
): Promise<boolean> {
  const { data, error } = await userClient.rpc("has_project_permission", {
    target_project_id: projectId,
    requested_permission: "documents.write",
  });
  return error === null && data === true;
}

async function reservationFor(
  userClient: ProviderClient,
  projectId: string,
  documentId: string,
): Promise<ReservedDocument | null> {
  const { data, error } = await userClient
    .from("documents")
    .select(
      "id,project_id,storage_path,mime_type,size_bytes,sha256,classification,upload_status,deleted_at,remote_url",
    )
    .eq("project_id", projectId)
    .eq("id", documentId)
    .maybeSingle();

  if (error || data === null) return null;
  return validReservation(data, projectId, documentId) ? data : null;
}

async function promoteToCanonical(
  admin: ProviderClient,
  path: string,
  reservation: ReservedDocument,
): Promise<{ readonly ok: boolean; readonly replayed: boolean }> {
  const copy = await admin.storage
    .from(STAGING_BUCKET)
    .copy(path, path, { destinationBucket: CANONICAL_BUCKET });
  const replayed = copy.error !== null;
  const ok = await storageObjectMatchesReservation(
    admin,
    CANONICAL_BUCKET,
    path,
    reservation,
  );
  return { ok, replayed };
}

async function attest(
  admin: ProviderClient,
  reservation: ReservedDocument,
): Promise<boolean> {
  const { error } = await admin.rpc("attest_private_document_ingest", {
    target_project_id: reservation.project_id,
    target_document_id: reservation.id,
    target_sha256: reservation.sha256,
    target_size_bytes: reservation.size_bytes,
  });
  return error === null;
}

async function cleanupStaging(
  admin: ProviderClient,
  path: string,
): Promise<boolean> {
  const result = await admin.storage.from(STAGING_BUCKET).remove([path]);
  return result.error === null;
}

function splitObjectPath(path: string): { folder: string; name: string } {
  const separator = path.lastIndexOf("/");
  return {
    folder: path.slice(0, separator),
    name: path.slice(separator + 1),
  };
}

async function canonicalAbsent(
  admin: ProviderClient,
  path: string,
): Promise<boolean> {
  const { folder, name } = splitObjectPath(path);
  const result = await admin.storage
    .from(CANONICAL_BUCKET)
    .list(folder, { limit: 100 });
  return (
    result.error === null &&
    result.data !== null &&
    !result.data.some((entry) => entry.name === name)
  );
}

async function compensateCanonical(
  admin: ProviderClient,
  path: string,
): Promise<boolean> {
  const removal = await admin.storage.from(CANONICAL_BUCKET).remove([path]);
  return removal.error === null && canonicalAbsent(admin, path);
}

function requestAuthority(
  request: Request,
  env: PagesEnvironment,
): RequestAuthority | Response {
  if (!requestOriginAllowed(request)) return unavailable(403);
  if (request.method !== "POST") return unavailable(405);
  if (requestHasBodyFrame(request)) return unavailable(413);

  const targets = promotionTargets(request);
  if (targets === null) return unavailable(400);
  const token = bearerToken(request);
  if (token === null) return unavailable(401);
  const provider = providerEnvironment(env);
  if (provider === null) return unavailable(503);
  return { targets, token, provider };
}

async function promotionContext(
  authority: RequestAuthority,
  env: PagesEnvironment,
): Promise<PromotionContext | Response> {
  const { targets, token, provider } = authority;
  const userClient = createClient<ProviderDatabase>(
    provider.url,
    provider.publishableKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
  const { data: userData, error: userError } =
    await userClient.auth.getUser(token);
  if (userError || userData.user === null) return unavailable(401);
  if (!(await hasWritePermission(userClient, targets.projectId))) {
    return unavailable();
  }

  const reservation = await reservationFor(
    userClient,
    targets.projectId,
    targets.documentId,
  );
  if (reservation === null) return unavailable(409);
  const secret = serviceKey(env);
  if (secret === null) return unavailable(503);
  const admin = createClient<ProviderDatabase>(provider.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return {
    userClient,
    admin,
    reservation,
    path: exactStoragePath(targets.projectId, targets.documentId),
    projectId: targets.projectId,
  };
}

async function reservationStillCurrent(
  context: PromotionContext,
): Promise<boolean> {
  const current = await reservationFor(
    context.userClient,
    context.projectId,
    context.reservation.id,
  );
  return current !== null && sameReservation(current, context.reservation);
}

async function failAfterCanonical(
  context: PromotionContext,
  status = 503,
): Promise<Response> {
  const compensated = await compensateCanonical(context.admin, context.path);
  return compensated ? unavailable(status) : unavailable(503);
}

async function executePromotion(context: PromotionContext): Promise<Response> {
  const { userClient, admin, reservation, path, projectId } = context;
  if (
    !(await storageObjectMatchesReservation(
      admin,
      STAGING_BUCKET,
      path,
      reservation,
    ))
  ) {
    return unavailable(422);
  }
  if (!(await hasWritePermission(userClient, projectId))) return unavailable();
  if (!(await reservationStillCurrent(context))) return unavailable(409);

  const promoted = await promoteToCanonical(admin, path, reservation);
  if (!promoted.ok) return failAfterCanonical(context);
  if (!(await hasWritePermission(userClient, projectId))) {
    return failAfterCanonical(context, 404);
  }
  if (!(await reservationStillCurrent(context))) {
    return failAfterCanonical(context, 409);
  }
  if (!(await attest(admin, reservation))) return failAfterCanonical(context);
  if (!(await cleanupStaging(admin, path))) return unavailable(503);
  return json(200, { ok: true, replayed: promoted.replayed });
}

async function handlePromotion(
  request: Request,
  env: PagesEnvironment,
): Promise<Response> {
  const authority = requestAuthority(request, env);
  if (authority instanceof Response) return authority;
  const context = await promotionContext(authority, env);
  return context instanceof Response ? context : executePromotion(context);
}

export async function onRequest(context: PagesContext): Promise<Response> {
  try {
    if (context.request.method === "DELETE") {
      return await handleTrustedAbandon(context.request, context.env);
    }
    return await handlePromotion(context.request, context.env);
  } catch {
    return unavailable(503);
  }
}
