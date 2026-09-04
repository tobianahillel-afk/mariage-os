import { spawnSync } from "node:child_process";

const fixtures = [
  "tests/fixtures/security-violations/fake-secret.env",
  "tests/fixtures/security-violations/fake-browser-secret.env",
];

for (const fixture of fixtures) {
  const result = spawnSync(
    process.execPath,
    ["scripts/check-secrets.mjs", fixture],
    { encoding: "utf8" },
  );

  if (result.status === 0) {
    console.error(
      `Secret guard negative control unexpectedly passed: ${fixture}`,
    );
    process.exit(1);
  }

  if (!result.stderr.includes("Secret-like material detected")) {
    process.stderr.write(result.stderr);
    console.error(`Secret guard failed for an unexpected reason: ${fixture}`);
    process.exit(1);
  }
}

console.log(
  "Secret guard negative controls passed by rejecting deliberate fixtures.",
);
