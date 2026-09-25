import {
  buildPreMutationFailureEvidenceRecord,
  writeEvidence,
} from "./private-document-ar006-do-evidence-record.mjs";

await writeEvidence(
  buildPreMutationFailureEvidenceRecord({
    failureStage: "route_preflight",
    exactBytes: 25_000_000,
    invocationCount: 10,
  }),
);

console.log(
  "ADR 0012 sanitized pre-mutation failure receipt retained for route_preflight.",
);
