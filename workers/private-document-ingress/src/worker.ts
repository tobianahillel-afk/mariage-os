import {
  handlePrivateDocumentIngress,
  type PrivateDocumentIngressEnvironment,
} from "../../../functions/api/private-document-promote.js";

const PRIVATE_DOCUMENT_PATH = "/api/private-document-promote";

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

export default {
  async fetch(
    request: Request,
    environment: PrivateDocumentIngressEnvironment,
  ): Promise<Response> {
    if (new URL(request.url).pathname !== PRIVATE_DOCUMENT_PATH) {
      return unavailable();
    }
    return handlePrivateDocumentIngress(
      request,
      environment,
      "worker-ingress",
    );
  },
};
