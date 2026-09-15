import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const CANONICAL_BUCKET = "project-private";
const STAGING_BUCKET = "document-ingest-staging";
const MAX_BYTES = 25_000_000;
const LOCAL_APP_ORIGIN = "http://127.0.0.1:4173";
const ALLOWED_ORIGINS_ENV = "PRIVATE_DOCUMENT_ALLOWED_ORIGINS";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

const baseCorsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, apikey, x-client-info, content-type, x-retry-count, traceparent, tracestate, baggage, x-project-id, x-document-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ReservedDocument {
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
}

function normalizedOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function allowedOrigins(): ReadonlySet<string> {
  const configured = Deno.env.get(ALLOWED_ORIGINS_ENV);
  if (configured) {
    const origins = configured
      .split(",")
      .map((value) => normalizedOrigin(value.trim()))
      .filter((value): value is string => value !== null);
    return new Set(origins);
  }
  return new Set([LOCAL_APP_ORIGIN]);
}

function requestOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin === null || allowedOrigins().has(origin);
}

function corsHeaders(request: Request): Readonly<Record<string, string>> {
  const origin = request.headers.get("origin");
  if (origin !== null && allowedOrigins().has(origin)) {
    return {
      ...baseCorsHeaders,
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
    };
  }
  return baseCorsHeaders;
}

function json(
  request: Request,
  status: number,
  body: Readonly<Record<string, unknown>>,
): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders(request),
  });
}

function unavailable(request: Request, status = 404): Response {
  return json(request, status, { error: "private_document_unavailable" });
}

function dictionaryDefaultKey(dictionary: string): string | null {
  try {
    const parsed = JSON.parse(dictionary) as Record<string, unknown>;
    const value = parsed.default;
    return typeof value === "string" && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function environmentKey(
  dictionaryName: string,
  singularName: string,
  legacyName: string,
): string | null {
  const dictionary = Deno.env.get(dictionaryName);
  if (dictionary) {
    const dictionaryKey = dictionaryDefaultKey(dictionary);
    if (dictionaryKey !== null) return dictionaryKey;
  }

  const singular = Deno.env.get(singularName);
  if (singular) return singular;
  return Deno.env.get(legacyName) ?? null;
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function exactStoragePath(projectId: string, documentId: string): string {
  return `${projectId}/documents/${documentId}/original`;
}

function requestHasBodyFrame(request: Request): boolean {
  if (request.headers.get("transfer-encoding") !== null) return true;

  const rawLength = request.headers.get("content-length");
  if (rawLength !== null) {
    const normalizedLength = rawLength.trim();
    if (!/^\d+$/.test(normalizedLength)) return true;
    if (Number(normalizedLength) !== 0) return true;
  }

  return request.body !== null;
}

function isPdfSignature(bytes: Uint8Array): boolean {
  if (bytes.byteLength < PDF_SIGNATURE.byteLength) return false;
  return PDF_SIGNATURE.every((value, index) => bytes[index] === value);
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
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
  admin: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
  reservation: ReservedDocument,
): Promise<boolean> {
  const storage = admin.storage.from(bucket);
  const info = await storage.info(path);
  if (info.error || info.data === null) return false;
  if (
    !Number.isSafeInteger(info.data.size) ||
    info.data.size < 1 ||
    info.data.size > MAX_BYTES ||
    info.data.size !== reservation.size_bytes ||
    info.data.contentType !== "application/pdf"
  ) {
    return false;
  }

  const { data, error } = await storage.download(path);
  if (error || data === null) return false;
  if (
    data.size !== info.data.size ||
    data.size > MAX_BYTES ||
    data.type !== "application/pdf"
  ) {
    return false;
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  return bytesMatchReservation(bytes, reservation);
}

async function hasWritePermission(
  userClient: ReturnType<typeof createClient>,
  projectId: string,
): Promise<boolean> {
  const { data, error } = await userClient.rpc("has_project_permission", {
    target_project_id: projectId,
    requested_permission: "documents.write",
  });
  return error === null && data === true;
}

async function reservationFor(
  userClient: ReturnType<typeof createClient>,
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
  const reservation = data as ReservedDocument;
  return validReservation(reservation, projectId, documentId)
    ? reservation
    : null;
}

async function promoteToCanonical(
  admin: ReturnType<typeof createClient>,
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
  admin: ReturnType<typeof createClient>,
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
  admin: ReturnType<typeof createClient>,
  path: string,
): Promise<boolean> {
  const result = await admin.storage.from(STAGING_BUCKET).remove([path]);
  return result.error === null;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (!requestOriginAllowed(request)) return unavailable(request, 403);
  if (request.method !== "POST") return unavailable(request, 405);
  if (requestHasBodyFrame(request)) return unavailable(request, 413);

  const projectId = request.headers.get("x-project-id") ?? "";
  const documentId = request.headers.get("x-document-id") ?? "";
  if (!UUID_PATTERN.test(projectId) || !UUID_PATTERN.test(documentId)) {
    return unavailable(request, 400);
  }

  const token = bearerToken(request);
  if (token === null) return unavailable(request, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? null;
  const publishableKey = environmentKey(
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  );
  if (supabaseUrl === null || publishableKey === null) {
    return unavailable(request, 503);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } =
    await userClient.auth.getUser(token);
  if (userError || userData.user === null) return unavailable(request, 401);

  if (!(await hasWritePermission(userClient, projectId))) {
    return unavailable(request);
  }

  const reservation = await reservationFor(userClient, projectId, documentId);
  if (reservation === null) return unavailable(request, 409);

  const secretKey = environmentKey(
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  if (secretKey === null) return unavailable(request, 503);

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const path = exactStoragePath(projectId, documentId);
  if (
    !(await storageObjectMatchesReservation(
      admin,
      STAGING_BUCKET,
      path,
      reservation,
    ))
  ) {
    return unavailable(request, 422);
  }

  // Narrow the membership race window immediately before privileged canonical
  // mutation. Service authority is never used as caller authorization.
  if (!(await hasWritePermission(userClient, projectId))) {
    return unavailable(request);
  }

  const promoted = await promoteToCanonical(admin, path, reservation);
  if (!promoted.ok) return unavailable(request, 503);

  // Reauthorize again before recording the server-only trust assertion.
  if (!(await hasWritePermission(userClient, projectId))) {
    return unavailable(request);
  }
  if (!(await attest(admin, reservation))) return unavailable(request, 503);
  if (!(await cleanupStaging(admin, path))) return unavailable(request, 503);

  return json(request, 200, { ok: true, replayed: promoted.replayed });
});
