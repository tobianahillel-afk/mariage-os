import { handleTrustedAbandon } from "./private-document-abandon.js";
import {
  bearerToken,
  promotionTargets,
  requestHasBodyFrame,
  requestOriginAllowed,
  type PrivateDocumentPagesEnvironment,
} from "./private-document-request.js";

interface PromotionExecutor {
  fetch(request: Request): Promise<Response>;
}

interface PagesEnvironment extends PrivateDocumentPagesEnvironment {
  readonly PRIVATE_DOCUMENT_PROMOTION_WORKER?: PromotionExecutor;
}

interface PagesContext {
  readonly request: Request;
  readonly env: PagesEnvironment;
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

function promotionIngressError(request: Request): Response | null {
  if (!requestOriginAllowed(request)) return unavailable(403);
  if (request.method !== "POST") return unavailable(405);
  if (requestHasBodyFrame(request)) return unavailable(413);
  if (promotionTargets(request) === null) return unavailable(400);
  if (bearerToken(request) === null) return unavailable(401);
  return null;
}

async function forwardPromotion(
  request: Request,
  env: PagesEnvironment,
): Promise<Response> {
  const ingressError = promotionIngressError(request);
  if (ingressError !== null) return ingressError;
  const worker = env.PRIVATE_DOCUMENT_PROMOTION_WORKER;
  if (worker === undefined) return unavailable(503);
  try {
    return await worker.fetch(request);
  } catch {
    return unavailable(503);
  }
}

export async function onRequest(context: PagesContext): Promise<Response> {
  if (context.request.method === "DELETE") {
    try {
      return await handleTrustedAbandon(context.request, context.env);
    } catch {
      return unavailable(503);
    }
  }
  return forwardPromotion(context.request, context.env);
}
