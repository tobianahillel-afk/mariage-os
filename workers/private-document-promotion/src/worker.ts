import { handleTrustedPromotion } from "../../../functions/api/private-document-promotion-core.js";
import type { PrivateDocumentPagesEnvironment } from "../../../functions/api/private-document-request.js";

const EVIDENCE_HEADER = "x-mariage-os-ar006-evidence-id";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

function evidenceId(request: Request): string | null {
  const value = request.headers.get(EVIDENCE_HEADER);
  return value !== null && UUID_PATTERN.test(value) ? value : null;
}

function recordEvidence(id: string | null, response: Response): void {
  if (id === null) return;
  console.log(
    JSON.stringify({
      event: "mariage-os.ar006.promotion",
      evidenceId: id,
      status: response.status,
    }),
  );
}

export default {
  async fetch(
    request: Request,
    environment: PrivateDocumentPagesEnvironment,
  ): Promise<Response> {
    const response = await handleTrustedPromotion(request, environment, false);
    recordEvidence(evidenceId(request), response);
    return response;
  },
};
