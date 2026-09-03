import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["scripts/validate-local-environment.mjs"], {
  encoding: "utf8",
  env: {
    ...process.env,
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-deliberate-credential-fixture",
  },
});

if (result.status === 0) {
  console.error("Environment negative control unexpectedly passed.");
  process.exit(1);
}

if (!result.stderr.includes("must not receive production-capable credentials")) {
  process.stderr.write(result.stderr);
  console.error("Environment guard failed for an unexpected reason.");
  process.exit(1);
}

console.log(
  "Environment negative control passed by rejecting a deliberate credential variable.",
);
