import { DurableObject } from "cloudflare:workers";
import { handleTrustedAbandon } from "../../../functions/api/private-document-abandon.js";
import { recordAr006Evidence } from "../../../functions/api/private-document-evidence.js";
import { PrivateDocumentLifecycleSerialGate } from "../../../functions/api/private-document-lifecycle-serialization.js";
import { handleTrustedPromotion } from "../../../functions/api/private-document-promotion-core.js";
import type { PrivateDocumentPagesEnvironment } from "../../../functions/api/private-document-request.js";

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

async function executeLifecycle(
  request: Request,
  environment: PrivateDocumentPagesEnvironment,
): Promise<Response> {
  if (request.method === "POST") {
    const response = await handleTrustedPromotion(request, environment);
    recordAr006Evidence(request, response, "durable-object");
    return response;
  }
  if (request.method === "DELETE") {
    return handleTrustedAbandon(request, environment);
  }
  return unavailable(405);
}

export class PrivateDocumentLifecycle extends DurableObject<PrivateDocumentPagesEnvironment> {
  private readonly serial = new PrivateDocumentLifecycleSerialGate();

  async fetch(request: Request): Promise<Response> {
    return this.serial.run(() => executeLifecycle(request, this.env));
  }
}

export default {
  async fetch(): Promise<Response> {
    return unavailable();
  },
};
