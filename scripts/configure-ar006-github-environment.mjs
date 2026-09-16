import { spawnSync } from "node:child_process";

const REPOSITORY = "tobianahillel-afk/mariage-os";
const GITHUB_ENVIRONMENT = "ar006-isolated";
const EXPECTED_ATTESTATION = "YES-WORKERS-FREE-ISOLATED";

const VARIABLE_NAMES = [
  "AR006_PAGES_PROJECT",
  "CLOUDFLARE_ACCOUNT_ID",
  "AR006_SUPABASE_URL",
  "AR006_SUPABASE_PUBLISHABLE_KEY",
  "AR006_TEST_USER_EMAIL",
  "AR006_PROJECT_ID",
  "AR006_WORKERS_FREE_ATTESTATION",
];

const SECRET_NAMES = [
  "AR006_CLOUDFLARE_DEPLOY_TOKEN",
  "AR006_CLOUDFLARE_ANALYTICS_TOKEN",
  "AR006_TEST_USER_PASSWORD",
];

function readRequired(name, trim = true) {
  const rawValue = process.env[name];
  if (rawValue === undefined || rawValue.length === 0) {
    throw new Error(`${name} is required.`);
  }

  const value = trim ? rawValue.trim() : rawValue;
  if (value.length === 0) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function collectInputs(names, trim = true) {
  return new Map(names.map((name) => [name, readRequired(name, trim)]));
}

function ghEnvironment() {
  const environment = { ...process.env };
  for (const name of SECRET_NAMES) {
    delete environment[name];
  }
  return environment;
}

function runGh(args, input) {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    env: ghEnvironment(),
    input,
    windowsHide: true,
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const detail =
      result.stderr.trim() || result.stdout.trim() || `exit ${result.status}`;
    throw new Error(`GitHub CLI command failed: ${detail}`);
  }
  return result.stdout.trim();
}

function assertAttestation(variables) {
  if (
    variables.get("AR006_WORKERS_FREE_ATTESTATION") !== EXPECTED_ATTESTATION
  ) {
    throw new Error(
      `AR006_WORKERS_FREE_ATTESTATION must equal ${EXPECTED_ATTESTATION}.`,
    );
  }
}

function assertGhReady() {
  runGh(["--version"]);
  runGh(["auth", "status", "--hostname", "github.com"]);
  runGh([
    "variable",
    "list",
    "--env",
    GITHUB_ENVIRONMENT,
    "--repo",
    REPOSITORY,
    "--json",
    "name",
  ]);
}

function setEnvironmentValue(kind, name, value) {
  runGh(
    [
      kind,
      "set",
      name,
      "--env",
      GITHUB_ENVIRONMENT,
      "--repo",
      REPOSITORY,
    ],
    `${value}\n`,
  );
}

function configuredVariables() {
  const output = runGh([
    "variable",
    "list",
    "--env",
    GITHUB_ENVIRONMENT,
    "--repo",
    REPOSITORY,
    "--json",
    "name,value",
  ]);
  return new Map(JSON.parse(output || "[]").map((row) => [row.name, row.value]));
}

function configuredSecretNames() {
  const output = runGh([
    "secret",
    "list",
    "--env",
    GITHUB_ENVIRONMENT,
    "--repo",
    REPOSITORY,
    "--json",
    "name",
  ]);
  return new Set(JSON.parse(output || "[]").map((row) => row.name));
}

function verifyVariables(expected) {
  const actual = configuredVariables();
  for (const [name, value] of expected) {
    if (actual.get(name) !== value) {
      throw new Error(`${name} was not stored with the expected value.`);
    }
  }
}

function verifySecretNames() {
  const actual = configuredSecretNames();
  for (const name of SECRET_NAMES) {
    if (!actual.has(name)) {
      throw new Error(`${name} is not configured in ${GITHUB_ENVIRONMENT}.`);
    }
  }
}

function main() {
  const variables = collectInputs(VARIABLE_NAMES);
  const secrets = collectInputs(SECRET_NAMES, false);

  assertAttestation(variables);
  assertGhReady();

  for (const [name, value] of variables) {
    setEnvironmentValue("variable", name, value);
  }
  for (const [name, value] of secrets) {
    setEnvironmentValue("secret", name, value);
  }

  verifyVariables(variables);
  verifySecretNames();

  console.log(
    `Configured ${VARIABLE_NAMES.length} variables and ${SECRET_NAMES.length} secrets in ${GITHUB_ENVIRONMENT}.`,
  );
  console.log(
    "Secret values were sent to GitHub CLI over stdin and were never printed or passed as command-line arguments.",
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
