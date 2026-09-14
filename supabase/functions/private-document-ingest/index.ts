import { createClient } from "npm:@supabase/supabase-js@2.112.4";

const BUCKET = "project-private";
const MAX_BYTES = 25_000_000;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, x-client-info, content-type, x-project-id, x-document-id, x-document-mime-type",
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

function json(status: number, body: Readonly<Record<string, unknown>>): Response {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function unavailable(status = 404): Response {
  return json(status, { error: "private_document_unavailable" });
}

function environmentKey(
  dictionaryName: string,
  singularName: string,
  legacyName: string,
): string | null {
  const dictionary = Deno.env.get(dictionaryName);
  if (dictionary) {
    try {
      const parsed = JSON.parse(dictionary) as Record<string, unknown>;
      const value = parsed.default;
      if (typeof value === "string" && value.length > 0) return value;
    } catch {
      return null;
    }
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
  if (
    bytes.byteLength !== reservation.size_bytes ||
    !isPdfSignature(bytes)
  ) {
    return false;
  }
  return (await sha256(bytes)) === reservation.sha256;
}

async function readExistingBytes(
  admin: ReturnType<typeof createClient>,
  path: string,
): Promise<Uint8Array | null> {
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || data === null) return null;
  if (data.type && data.type !== "application/pdf") return null;
  return new Uint8Array(await data.arrayBuffer());
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

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (request.method !== "POST") return unavailable(405);

  const projectId = request.headers.get("x-project-id") ?? "";
  const documentId = request.headers.get("x-document-id") ?? "";
  const mimeIntent = request.headers.get("x-document-mime-type") ?? "";
  if (
    !UUID_PATTERN.test(projectId) ||
    !UUID_PATTERN.test(documentId) ||
    mimeIntent !== "application/pdf"
  ) {
    return unavailable(400);
  }

  const requestMediaType = (request.headers.get("content-type") ?? "")
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (
    requestMediaType !== "application/octet-stream" &&
    requestMediaType !== "application/pdf"
  ) {
    return unavailable(415);
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_BYTES
  ) {
    return unavailable(413);
  }

  const token = bearerToken(request);
  if (token === null) return unavailable(401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? null;
  const publishableKey = environmentKey(
    "SUPABASE_PUBLISHABLE_KEYS",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  );
  const secretKey = environmentKey(
    "SUPABASE_SECRET_KEYS",
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  if (supabaseUrl === null || publishableKey === null || secretKey === null) {
    return unavailable(503);
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || userData.user === null) return unavailable(401);

  if (!(await hasWritePermission(userClient, projectId))) return unavailable();

  const { data: reservationData, error: reservationError } = await userClient
    .from("documents")
    .select(
      "id,project_id,storage_path,mime_type,size_bytes,sha256,classification,upload_status,deleted_at,remote_url",
    )
    .eq("project_id", projectId)
    .eq("id", documentId)
    .maybeSingle();

  if (reservationError || reservationData === null) return unavailable();
  const reservation = reservationData as ReservedDocument;
  if (!validReservation(reservation, projectId, documentId)) {
    return unavailable(409);
  }

  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength < 1 || body.byteLength > MAX_BYTES) {
    return unavailable(413);
  }
  if (!(await bytesMatchReservation(body, reservation))) {
    return unavailable(422);
  }

  // Narrow the membership race window before privileged Storage mutation.
  if (!(await hasWritePermission(userClient, projectId))) return unavailable();

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const path = exactStoragePath(projectId, documentId);
  const upload = await admin.storage.from(BUCKET).upload(path, body, {
    contentType: "application/pdf",
    upsert: false,
  });

  let replayed = false;
  if (upload.error !== null) {
    const existing = await readExistingBytes(admin, path);
    if (
      existing === null ||
      !(await bytesMatchReservation(existing, reservation))
    ) {
      return unavailable(503);
    }
    replayed = true;
  }

  const { error: attestationError } = await admin.rpc(
    "attest_private_document_ingest",
    {
      target_project_id: projectId,
      target_document_id: documentId,
      target_sha256: reservation.sha256,
      target_size_bytes: reservation.size_bytes,
    },
  );
  if (attestationError !== null) return unavailable(503);

  return json(200, { ok: true, replayed });
});
