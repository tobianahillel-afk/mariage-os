import { spawnSync } from "node:child_process";

const npmExecPath = process.env.npm_execpath;

if (!npmExecPath) {
  console.error("npm_execpath is required to run the full verification.");
  process.exit(1);
}

function runScript(script) {
  const result = spawnSync(process.execPath, [npmExecPath, "run", script], {
    stdio: "inherit",
    env: process.env,
  });

  return result.status ?? 1;
}

const orderedChecks = [
  "security:env",
  "security:env:negative",
  "security:secrets",
  "test:fast",
  "quality:negative",
  "security:negative",
  "security:dependencies",
  "test:e2e",
  "test:mutation",
  "build",
];

for (const script of orderedChecks) {
  const status = runScript(script);
  if (status !== 0) process.exit(status);
}

const startStatus = runScript("db:start");
if (startStatus !== 0) process.exit(startStatus);

let verificationStatus = 1;
try {
  verificationStatus = runScript("db:verify");
} finally {
  const stopStatus = runScript("db:stop");
  if (verificationStatus === 0 && stopStatus !== 0) {
    verificationStatus = stopStatus;
  }
}

process.exit(verificationStatus);
