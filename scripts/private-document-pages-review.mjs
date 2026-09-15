import {
  pdfBytes,
  randomUUID,
  reserve,
  rpcFailure,
  stage,
  storagePath,
} from "./private-document-edge-helpers.mjs";
import {
  assertOpenFramedRequestDenied,
  assertSameOriginPolicy,
} from "./private-document-pages-request-review.mjs";
import {
  assertOversizedCanonicalRejected,
  assertRecoverySourceContracts,
  assertWrongCanonicalMimeRejected,
} from "./private-document-pages-recovery-review.mjs";

function failureMessage(error) {
  return error instanceof Error ? error.message : "unknown failure";
}

async function recordFinding(failures, finding, check) {
  try {
    await check();
    console.log(`PASS ${finding} remediation contract`);
  } catch (error) {
    failures.push(`${finding}: ${failureMessage(error)}`);
  }
}

async function prepareBoundaryDocument(context) {
  const documentId = randomUUID();
  const bytes = pdfBytes(512);
  await reserve({
    client: context.writer.client,
    projectId: context.projectId,
    documentId,
    bytes,
    title: "Synthetic Pages promotion boundary",
  });
  context.objectPaths.push(storagePath(context.projectId, documentId));
  rpcFailure(
    (
      await stage({
        client: context.writer.client,
        projectId: context.projectId,
        documentId,
        bytes,
      })
    ).error,
    "Synthetic staging precondition",
  );
  return documentId;
}

export async function runReviewFindingRedScenarios(context) {
  const failures = [];
  const documentId = await prepareBoundaryDocument(context);

  await recordFinding(failures, "WP29C-AR-004", async () => {
    await assertSameOriginPolicy(context, documentId);
  });
  await recordFinding(failures, "WP29C-AR-002-source", async () => {
    assertRecoverySourceContracts();
  });
  await recordFinding(failures, "WP29C-AR-003-source", async () => {
    assertRecoverySourceContracts();
  });
  await recordFinding(failures, "WP29C-AR-002-live", async () => {
    await assertOversizedCanonicalRejected(context);
  });
  await recordFinding(failures, "WP29C-AR-003-live", async () => {
    await assertWrongCanonicalMimeRejected(context);
  });
  await recordFinding(failures, "WP29C-AR-001", async () => {
    await assertOpenFramedRequestDenied(context, documentId);
  });

  if (failures.length > 0) {
    throw new Error(
      `WP-2.9C review-finding RED remains open:\n- ${failures.join("\n- ")}`,
    );
  }
  console.log("PASS WP-2.9C review findings remediated");
}
