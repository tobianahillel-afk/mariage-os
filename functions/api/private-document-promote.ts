import {
  recordAr006Evidence,
  type Ar006EvidenceSurface,
} from "./private-document-evidence.js";
import {
  abandonTargets,
  bearerToken,
  promotionTargets,
  requestHasBodyFrame,
  requestOriginAllowed,
  type DocumentTargets,
} from "./private-document-request.js";

interface LifecycleExecutor {
  fetch(request: Request): Promise<Response>;
}

interface LifecycleNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): LifecycleExecutor;
}

export interface PrivateDocumentIngressEnvironment {
  readonly PRIVATE_DOCUMENT_LIFECYCLE?: LifecycleNamespace;
}

interface PagesContext {
  readonly request: Request;
  readonly env: PrivateDocumentIngressEnvironment;
}

function unavailable(status = 404): Response {
  return Response.json(
    { error: "private_document_unavailable" },
    {
      status,
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}

function lifecycleTargets(request: Request): DocumentTargets | null {
  if (request.method === "POST") return promotionTargets(request);
  if (request.method === "DELETE") return abandonTargets(request);
  return null;
}

function validatedTargets(request: Request): DocumentTargets | Response {
  if (!requestOriginAllowed(request)) return unavailable(403);
  if (request.method !== "POST" && request.method !== "DELETE") {
    return unavailable(405);
  }
  if (requestHasBodyFrame(request)) return unavailable(413);
  const targets = lifecycleTargets(request);
  if (targets === null) return unavailable(400);
  if (bearerToken(request) === null) return unavailable(401);
  return targets;
}

export function privateDocumentLifecycleName(targets: DocumentTargets): string {
  return `private-document:${targets.projectId}:${targets.documentId}`;
}

async function forwardLifecycle(
  request: Request,
  env: PrivateDocumentIngressEnvironment,
): Promise<Response> {
  const targets = validatedTargets(request);
  if (targets instanceof Response) return targets;
  const lifecycle = env.PRIVATE_DOCUMENT_LIFECYCLE;
  if (lifecycle === undefined) return unavailable(503);

  try {
    const id = lifecycle.idFromName(privateDocumentLifecycleName(targets));
    return await lifecycle.get(id).fetch(request);
  } catch {
    return unavailable(503);
  }
}

export async function handlePrivateDocumentIngress(
  request: Request,
  env: PrivateDocumentIngressEnvironment,
  surface: Ar006EvidenceSurface,
): Promise<Response> {
  const response = await forwardLifecycle(request, env);
  if (request.method === "POST") {
    recordAr006Evidence(request, response, surface);
  }
  return response;
}

export async function onRequest(context: PagesContext): Promise<Response> {
  return handlePrivateDocumentIngress(
    context.request,
    context.env,
    "pages-ingress",
  );
}
