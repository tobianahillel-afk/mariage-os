import path from "node:path";
import { spawnSync } from "node:child_process";

const executable = path.resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.cmd" : "supabase",
);

const MAX_DIAGNOSTIC_CHARS = 4000;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const SUPABASE_KEY_PATTERN = /\bsb_(?:publishable|secret)_[A-Za-z0-9_-]+\b/g;
const POSTGRES_PASSWORD_PATTERN = /(postgresql?:\/\/[^:\s/@]+:)[^@\s]+@/gi;

function redactDiagnostic(value) {
  return value
    .replace(JWT_PATTERN, "[REDACTED_JWT]")
    .replace(SUPABASE_KEY_PATTERN, "[REDACTED_SUPABASE_KEY]")
    .replace(POSTGRES_PASSWORD_PATTERN, "$1[REDACTED]@")
    .slice(-MAX_DIAGNOSTIC_CHARS);
}

const result = spawnSync(executable, ["start"], {
  encoding: "utf8",
  env: process.env,
});

if (result.status === 0) {
  console.log("Local Supabase stack started.");
  process.exit(0);
}

console.error(
  `Local Supabase stack failed to start (exit ${result.status ?? "unknown"}).`,
);

if (result.error) {
  console.error(`spawn error: ${result.error.message}`);
}

const stderr = redactDiagnostic(result.stderr ?? "").trim();
if (stderr.length > 0) {
  console.error("Supabase stderr (redacted, bounded):");
  console.error(stderr);
}

process.exit(result.status ?? 1);
