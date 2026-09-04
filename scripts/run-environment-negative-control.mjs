import { spawnSync } from "node:child_process";

const credentialVariables = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SECRET_KEY",
];

for (const variable of credentialVariables) {
  const result = spawnSync(
    process.execPath,
    ["scripts/validate-local-environment.mjs"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        [variable]: "synthetic-deliberate-credential-fixture",
      },
    },
  );

  if (result.status === 0) {
    console.error(`Environment negative control unexpectedly passed: ${variable}`);
    process.exit(1);
  }

  if (
    !result.stderr.includes("must not receive production-capable credentials")
  ) {
    process.stderr.write(result.stderr);
    console.error(`Environment guard failed unexpectedly: ${variable}`);
    process.exit(1);
  }
}

console.log(
  "Environment negative controls passed by rejecting credential variables.",
);
