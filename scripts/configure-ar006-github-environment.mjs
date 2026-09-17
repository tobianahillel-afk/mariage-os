import { spawnSync } from "node:child_process";

const REPOSITORY = "tobianahillel-afk/mariage-os";
const GITHUB_ENVIRONMENT = "ar006-isolated";
const EXPECTED_ATTESTATION = "YES-WORKERS-FREE-ISOLATED";

const VARIABLE_NAMES = [
  "AR006_PAGES_PROJECT",
  "AR006_PRIVATE_DOCUMENT_WORKER",
  "CLOUDFLARE_ACCOUNT_ID",
  "AR006_SUPABASE_URL",
  "AR006_SUPABASE_PUBLISHABLE_KEY",
  "AR006_TEST_USER_EMAIL",
  "AR006_PROJECT_ID",
  "AR006_WORKERS_FREE_ATTESTATION",
];

const SECRET_NAMES = [
  "AR006_CLOUDFLARE_DEPLOY_TOKEN",
  "AR006_CLOUDFLARE_WORKER_DEPLOY_TOKEN",
  "AR006_CLOUDFLARE_OBSERVABILITY_TOKEN",
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
  const entries = names.map((name) => [name, readRequired(name, trim)]);
  return new Map(entries);
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

  if (result.error) throw result.error;
  if (result.status === 0) return result.stdout.trim();

  const stderr = result.stderr.trim();
  const stdout = result.stdout.trim();
  const detail = stderr || stdout || `exit ${result.status}`;
  throw new Error(`GitHub CLI command failed: ${detail}`);
}

function assertAttestation(variables) {
  const actual = variables.get("AR006_WORKERS_FREE_ATTESTATION");
  if (actual === EXPECTED_ATTESTATION) return;

  const message = "AR006_WORKERS_FREE_ATTESTATION must confirm Workers Free.";
  throw new Error(message);
}

function listAsJson(kind, fields) {
  const output = runGh([
    kind,
    "list",
    "--env",
    GITHUB_ENVIRONMENT,
    "--repo",
    REPOSITORY,
    "--json",
    fields,
  ]);
  return JSON.parse(output || "[]");
}

function assertGhReady() {
  runGh(["--version"]);
  runGh(["auth", "status", "--hostname", "github.com"]);
  listAsJson("variable", "name");
}

function setEnvironmentValue(kind, name, value) {
  const args = [
    kind,
    "set",
    name,
    "--env",
    GITHUB_ENVIRONMENT,
    "--repo",
    REPOSITORY,
  ];
  runGh(args, `${value}\n`);
}

function configuredVariables() {
  const rows = listAsJson("variable", "name,value");
  const entries = rows.map((row) => [row.name, row.value]);
  return new Map(entries);
}

function configuredSecretNames() {
  const rows = listAsJson("secret", "name");
  return new Set(rows.map((row) => row.name));
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

function configureEntries(kind, entries) {
  for (const [name, value] of entries) {
    setEnvironmentValue(kind, name, value);
  }
}

function main() {
  const variables = collectInputs(VARIABLE_NAMES);
  const secrets = collectInputs(SECRET_NAMES, false);

  assertAttestation(variables);
  assertGhReady();
  configureEntries("variable", variables);
  configureEntries("secret", secrets);
  verifyVariables(variables);
  verifySecretNames();

  console.log(`Configured AR-006 environment: ${GITHUB_ENVIRONMENT}.`);
  console.log("Eight variables and four secret names were verified.");
  console.log("Secret values were never printed or passed as CLI arguments.");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
