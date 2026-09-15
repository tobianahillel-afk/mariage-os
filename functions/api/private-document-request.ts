const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface PrivateDocumentPagesEnvironment {
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_PUBLISHABLE_KEY?: string;
  readonly SUPABASE_ANON_KEY?: string;
  readonly PRIVATE_DOCUMENT_ADMIN_KEY?: string;
}

export interface ProviderEnvironment {
  readonly url: string;
  readonly publishableKey: string;
}

export interface DocumentTargets {
  readonly projectId: string;
  readonly documentId: string;
}

export interface AbandonTargets extends DocumentTargets {
  readonly operationId: string;
}

function nonEmpty(...values: ReadonlyArray<string | undefined>): string | null {
  return (
    values.find((value) => typeof value === "string" && value.length > 0) ??
    null
  );
}

export function providerEnvironment(
  env: PrivateDocumentPagesEnvironment,
): ProviderEnvironment | null {
  const url = nonEmpty(env.SUPABASE_URL);
  if (url === null) return null;
  const publishableKey = nonEmpty(
    env.SUPABASE_PUBLISHABLE_KEY,
    env.SUPABASE_ANON_KEY,
  );
  if (publishableKey === null) return null;
  return { url, publishableKey };
}

export function serviceKey(
  env: PrivateDocumentPagesEnvironment,
): string | null {
  return nonEmpty(env.PRIVATE_DOCUMENT_ADMIN_KEY);
}

export function requestOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin === null) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function requestHasBodyFrame(request: Request): boolean {
  if (request.headers.get("transfer-encoding") !== null) return true;
  const rawLength = request.headers.get("content-length");
  if (rawLength === null) return request.body !== null;
  const normalizedLength = rawLength.trim();
  return !/^\d+$/.test(normalizedLength) || Number(normalizedLength) !== 0;
}

export function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

export function promotionTargets(request: Request): DocumentTargets | null {
  const projectId = request.headers.get("x-project-id") ?? "";
  const documentId = request.headers.get("x-document-id") ?? "";
  return UUID_PATTERN.test(projectId) && UUID_PATTERN.test(documentId)
    ? { projectId, documentId }
    : null;
}

export function abandonTargets(request: Request): AbandonTargets | null {
  const targets = promotionTargets(request);
  if (targets === null) return null;
  const operationId = request.headers.get("x-operation-id") ?? "";
  return UUID_PATTERN.test(operationId) ? { ...targets, operationId } : null;
}
