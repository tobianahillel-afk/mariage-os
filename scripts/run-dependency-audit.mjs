import { spawnSync } from "node:child_process";

const npmExecPath = process.env.npm_execpath;
const maxAttempts = 3;

if (!npmExecPath) {
  console.error("npm_execpath is required to run the dependency audit.");
  process.exit(1);
}

function runAudit() {
  return spawnSync(
    process.execPath,
    [
      npmExecPath,
      "audit",
      "--audit-level=high",
      "--fetch-retries=0",
      "--fetch-timeout=30000",
    ],
    {
      encoding: "utf8",
      env: process.env,
      timeout: 45000,
    },
  );
}

function auditOutput(result) {
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

function isTransientFailure(result) {
  if (result.error?.code === "ETIMEDOUT") return true;

  const output = auditOutput(result);
  return [
    "503 Service Unavailable",
    "502 Bad Gateway",
    "504 Gateway Timeout",
    "audit endpoint returned an error",
    "ECONNRESET",
    "EAI_AGAIN",
    "ETIMEDOUT",
  ].some((marker) => output.includes(marker));
}

function printAuditOutput(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) console.error(result.error.message);
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = runAudit();
  if (result.status === 0) {
    printAuditOutput(result);
    process.exit(0);
  }

  const retryable = isTransientFailure(result) && attempt < maxAttempts;
  if (!retryable) {
    printAuditOutput(result);
    process.exit(result.status ?? 1);
  }

  console.warn(
    `Dependency audit provider unavailable; retrying (${attempt}/${maxAttempts}).`,
  );
}

process.exit(1);
