import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const npmExecPath = process.env.npm_execpath;
const maxNpmAttempts = 3;
const maxAffectsLength = 5500;
const advisoryPageSize = 100;

if (!npmExecPath) {
  console.error("npm_execpath is required to run the dependency audit.");
  process.exit(1);
}

function runNpmAudit() {
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

function isTransientNpmFailure(result) {
  if (result.error?.code === "ETIMEDOUT") return true;

  const output = auditOutput(result);
  return [
    "503 Service Unavailable",
    "502 Bad Gateway",
    "504 Gateway Timeout",
    "audit endpoint returned an error",
    "network timeout",
    "ECONNRESET",
    "EAI_AGAIN",
    "ETIMEDOUT",
  ].some((marker) => output.includes(marker));
}

function printNpmOutput(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) console.error(result.error.message);
}

function packageNameFromPath(path) {
  const marker = "node_modules/";
  const index = path.lastIndexOf(marker);
  return index < 0 ? null : path.slice(index + marker.length);
}

function readLockedPackageVersions() {
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const exactVersions = new Set();

  for (const [path, metadata] of Object.entries(lock.packages ?? {})) {
    const name = packageNameFromPath(path);
    if (!name || typeof metadata.version !== "string") continue;
    exactVersions.add(`${name}@${metadata.version}`);
  }

  return [...exactVersions].sort();
}

function chunkAffects(packages) {
  const chunks = [];
  let current = [];
  let currentLength = 0;

  for (const packageVersion of packages) {
    const encodedLength = encodeURIComponent(packageVersion).length + 1;
    if (current.length > 0 && currentLength + encodedLength > maxAffectsLength) {
      chunks.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(packageVersion);
    currentLength += encodedLength;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

function advisoryUrl(affectedPackages, page) {
  const url = new URL("https://api.github.com/advisories");
  url.searchParams.set("ecosystem", "npm");
  url.searchParams.set("type", "reviewed");
  url.searchParams.set("affects", affectedPackages.join(","));
  url.searchParams.set("per_page", String(advisoryPageSize));
  url.searchParams.set("page", String(page));
  return url;
}

async function fetchAdvisoryPage(affectedPackages, page) {
  const response = await fetch(advisoryUrl(affectedPackages, page), {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "mariage-os-dependency-audit",
      "X-GitHub-Api-Version": "2026-03-10",
    },
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`GitHub Advisory Database returned HTTP ${response.status}.`);
  }

  const advisories = await response.json();
  if (!Array.isArray(advisories)) {
    throw new Error("GitHub Advisory Database returned an invalid payload.");
  }
  return advisories;
}

async function fetchAdvisoriesForChunk(affectedPackages) {
  const advisories = [];
  for (let page = 1; ; page += 1) {
    const pageResults = await fetchAdvisoryPage(affectedPackages, page);
    advisories.push(...pageResults);
    if (pageResults.length < advisoryPageSize) return advisories;
  }
}

async function runGitHubAdvisoryFallback() {
  const packages = readLockedPackageVersions();
  if (packages.length === 0) {
    throw new Error("No locked npm package versions were available to audit.");
  }

  const advisoriesById = new Map();
  for (const affectedPackages of chunkAffects(packages)) {
    const advisories = await fetchAdvisoriesForChunk(affectedPackages);
    for (const advisory of advisories) {
      if (typeof advisory?.ghsa_id === "string") {
        advisoriesById.set(advisory.ghsa_id, advisory);
      }
    }
  }

  const advisories = [...advisoriesById.values()];
  const blockers = advisories.filter((advisory) =>
    ["critical", "high"].includes(String(advisory.severity).toLowerCase()),
  );

  console.log(
    `GitHub Advisory Database fallback reviewed ${packages.length} exact locked package versions and found ${advisories.length} matching reviewed advisories.`,
  );

  if (blockers.length === 0) {
    console.log("Dependency vulnerability gate passed: no High/Critical advisory affects the lockfile.");
    return;
  }

  for (const advisory of blockers) {
    console.error(`${advisory.severity}: ${advisory.ghsa_id} ${advisory.summary ?? ""}`);
  }
  throw new Error("High/Critical dependency vulnerability detected.");
}

let finalTransientFailure = null;
for (let attempt = 1; attempt <= maxNpmAttempts; attempt += 1) {
  const result = runNpmAudit();
  if (result.status === 0) {
    printNpmOutput(result);
    process.exit(0);
  }

  if (!isTransientNpmFailure(result)) {
    printNpmOutput(result);
    process.exit(result.status ?? 1);
  }

  finalTransientFailure = result;
  if (attempt < maxNpmAttempts) {
    console.warn(
      `Dependency audit provider unavailable; retrying (${attempt}/${maxNpmAttempts}).`,
    );
  }
}

console.warn("npm audit remained unavailable after bounded retries; using the GitHub Advisory Database fallback.");
if (finalTransientFailure?.error) {
  console.warn(finalTransientFailure.error.message);
}

try {
  await runGitHubAdvisoryFallback();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}