import { runTrustedIngestScenarios } from "./private-document-edge-scenarios.mjs";

runTrustedIngestScenarios().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Trusted ingest integration failed.",
  );
  process.exit(1);
});
