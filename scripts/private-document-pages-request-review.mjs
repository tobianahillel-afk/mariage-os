import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { clearTimeout, setTimeout } from "node:timers";
import {
  assertNoTrustedObject,
  assertStagedObjectPresent,
  promotionUrl,
} from "./private-document-edge-helpers.mjs";

const UNKNOWN_ORIGIN = "https://attacker.invalid";
const RESPONSE_TIMEOUT_MS = 5_000;

function openFramedRequest({ token, projectId, documentId }) {
  const endpoint = new URL(promotionUrl());
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;
    const request = httpRequest(
      endpoint,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          origin: endpoint.origin,
          "content-type": "application/octet-stream",
          "transfer-encoding": "chunked",
          "x-project-id": projectId,
          "x-document-id": documentId,
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        response.resume();
        response.on("end", () => finish(resolve, status));
      },
    );

    function finish(callback, value) {
      if (settled) return;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      request.destroy();
      callback(value);
    }

    request.on("error", (error) => finish(reject, error));
    request.write(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]));
    timer = setTimeout(
      () => finish(reject, new Error("Pages promotion waited for sender EOF.")),
      RESPONSE_TIMEOUT_MS,
    );
  });
}

export async function assertOpenFramedRequestDenied(context, documentId) {
  const status = await openFramedRequest({
    token: context.writer.token,
    projectId: context.projectId,
    documentId,
  });
  assert.equal(
    status,
    413,
    "Framed bodies must be rejected before sender EOF.",
  );
  await assertNoTrustedObject({
    admin: context.admin,
    projectId: context.projectId,
    documentId,
  });
  await assertStagedObjectPresent({
    admin: context.admin,
    projectId: context.projectId,
    documentId,
  });
}

async function preflight(origin) {
  return globalThis.fetch(promotionUrl(), {
    method: "OPTIONS",
    headers: {
      origin,
      "access-control-request-method": "POST",
      "access-control-request-headers":
        "authorization,x-project-id,x-document-id",
    },
  });
}

export async function assertSameOriginPolicy(context, documentId) {
  const sameOrigin = new URL(promotionUrl()).origin;
  const sameOriginOptions = await preflight(sameOrigin);
  const foreignOptions = await preflight(UNKNOWN_ORIGIN);
  assert.equal(sameOriginOptions.status, 405);
  assert.equal(foreignOptions.status, 403);
  assert.equal(
    sameOriginOptions.headers.get("access-control-allow-origin"),
    null,
  );
  assert.equal(foreignOptions.headers.get("access-control-allow-origin"), null);

  const foreignPost = await globalThis.fetch(promotionUrl(), {
    method: "POST",
    headers: {
      authorization: `Bearer ${context.writer.token}`,
      origin: UNKNOWN_ORIGIN,
      "x-project-id": context.projectId,
      "x-document-id": documentId,
    },
  });
  assert.equal(foreignPost.status, 403);
  assert.equal(foreignPost.headers.get("access-control-allow-origin"), null);
}
