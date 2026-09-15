import {
  createClient,
  type SupabaseClient as SupabaseProviderClient,
} from "@supabase/supabase-js";

const CANONICAL_BUCKET = "project-private";
const STAGING_BUCKET = "document-ingest-staging";
const MAX_BYTES = 25_000_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

type EmptyProviderMap = Record<never, never>;

type ReservedDocument = {
  readonly id: string;
  readonly project_id: string;
  readonly storage_path: string;
  readonly mime_type: string;
  readonly size_bytes: number;
  readonly sha256: string;
  readonly classification: string;
  readonly upload_status: string;
  readonly deleted_at: string | null;
  readonly remote_url: string | null;
};

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

interface PagesEnvironment {
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_PUBLISHABLE_KEY?: string;
  readonly SUPABASE_ANON_KEY?: string;
  readonly PRIVATE_DOCUMENT_ADMIN_KEY?: string;
}

interface PagesContext {
  readonly request: Request;
  readonly env: PagesEnvironment;
}

interface ProviderEnvironment {
  readonly url: string;
  readonly publishableKey: string;
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

function nonEmpty(...values: ReadonlyArray<string | undefined>): string | null {
  return (
    values.find((value) => typeof value === "string" && value.length > 0) ?? null
  );
}

function providerEnvironment(env: PagesEnvironment): ProviderEnvironment | null {
  const url = nonEmpty(env.SUPABASE_URL);
  const publishableKey = nonEmpty(
    env.SUPABASE_PUBLISHABLE_KEY,
    env.SUPABASE_ANON_KEY,
  );
  return url === null || publishableKey === null
    ? null
    : { url, publishableKey };
}

function serviceKey(env: PagesEnvironment): string | null {
  return nonEmpty(env.PRIVATE_DOCUMENT_ADMIN_KEY);
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

function requestOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function requestHasBodyFrame(request: Request): boolean {
  if (request.headers.get("transfer-encoding") !== null) return true;

  const rawLength = request.headers.get("content-length");
  if (rawLength !== null) {
    const normalizedLength = rawLength.trim();
    if (!/^\d+$/.test(normalizedLength)) return true;
    return Number(normalizedLength) !== 0;
  }

  return request.body !== null;
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function requestTargets(
  request: Request,
): { readonly projectId: string; readonly documentId: string } | null {
  const projectId = request.headers.get("x-project-id") ?? "";
  const documentId = request.headers.get("x-document-id") ?? "";
  return UUID_PATTERN.test(projectId) && UUID_PATTERN.test(documentId)
    ? { projectId, documentId }
    : null;
}

function exactStoragePath(projectId: string, documentId: string): string {
  return `${projectId}/documents/${documentId}/original`;
}

function isPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.byteLength < PDF_SIGNATURE.byteLength) return false;
  return PDF_SIGNATURE.every((value, index) => bytes[index] === value);
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
}

function validReservation(
  value: ReservedDocument,
  projectId: string,
  documentId: string,
): boolean {
  return (
    value.id === documentId &&
    value.project_id === projectId &&
    value.storage_path === exactStoragePath(projectId, documentId) &&
    value.mime_type === "application/pdf" &&
    Number.isSafeInteger(value.size_bytes) &&
    value.size_bytes >= 1 &&
    value.size_bytes <= MAX_BYTES &&
    SHA256_PATTERN.test(value.sha256) &&
    value.classification === "private" &&
    value.upload_status === "pending" &&
    value.deleted_at === null &&
    value.remote_url === null
  );
}

async function bytesMatchReservation(
  bytes: Uint8Array,
  reservation: ReservedDocument,
): Promise<boolean> {
  if (bytes.byteLength !== reservation.size_bytes || !isPdfSignature(bytes)) {
    return false;
  }
  return (await sha256(bytes)) === reservation.sha256;
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
  const objectSize = info.data.size;
  if (
    typeof objectSize !== "number" ||
    !Number.isSafeInteger(objectSize) ||
    objectSize < 1 ||
    objectSize > MAX_BYTES ||
    objectSize !== reservation.size_bytes ||
    info.data.contentType !== "application/pdf"
  ) {
    return false;
  }

  const { data, error } = await storage.download(path);
  if (error || data === null) return false;
  if (
    data.size !== objectSize ||
    data.size > MAX_BYTES ||
    data.type !== "application/pdf"
  ) {
    return false;
  }

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

function requestAuthority(
  request: Request,
  env: PagesEnvironment,
): RequestAuthority | Response {
  if (!requestOriginAllowed(request)) return unavailable(403);
  if (request.method !== "POST") return unavailable(405);
  if (requestHasBodyFrame(request)) return unavailable(413);

  const targets = requestTargets(request);
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

  const promoted = await promoteToCanonical(admin, path, reservation);
  if (!promoted.ok) return unavailable(503);
  if (!(await hasWritePermission(userClient, projectId))) return unavailable();
  if (!(await attest(admin, reservation))) return unavailable(503);
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
    return await handlePromotion(context.request, context.env);
  } catch {
    return unavailable(503);
  }
}
