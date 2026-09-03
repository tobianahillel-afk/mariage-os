import { spawnSync } from "node:child_process";

const result = spawnSync(
  process.execPath,
  [
    "scripts/check-secrets.mjs",
    "tests/fixtures/security-violations/fake-secret.env",
  ],
  { encoding: "utf8" },
);

if (result.status === 0) {
  console.error("Secret guard negative control unexpectedly passed.");
  process.exit(1);
}

if (!result.stderr.includes("Secret-like material detected")) {
  process.stderr.write(result.stderr);
  console.error("Secret guard failed for an unexpected reason.");
  process.exit(1);
}

console.log(
  "Secret guard negative control passed by rejecting the deliberate fixture.",
);
