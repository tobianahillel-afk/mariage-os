import { DurableObject } from "cloudflare:workers";
import { handleTrustedAbandon } from "../../../functions/api/private-document-abandon.js";
import { PrivateDocumentLifecycleSerialGate } from "../../../functions/api/private-document-lifecycle-serialization.js";
import { handleTrustedPromotion } from "../../../functions/api/private-document-promotion-core.js";
import type { PrivateDocumentPagesEnvironment } from "../../../functions/api/private-document-request.js";

const EVIDENCE_HEADER = "x-mariage-os-ar006-evidence-id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

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

function evidenceId(request: Request): string | null {
  const value = request.headers.get(EVIDENCE_HEADER);
  return value !== null && UUID_PATTERN.test(value) ? value : null;
}

function recordEvidence(id: string | null, response: Response): void {
  if (id === null) return;
  console.log(
    JSON.stringify({
      event: "mariage-os.ar006.promotion",
      execution: "durable-object",
      evidenceId: id,
      status: response.status,
    }),
  );
}

async function executeLifecycle(
  request: Request,
  environment: PrivateDocumentPagesEnvironment,
): Promise<Response> {
  if (request.method === "POST") {
    const response = await handleTrustedPromotion(request, environment);
    recordEvidence(evidenceId(request), response);
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
