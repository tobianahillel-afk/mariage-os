import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const explicitFiles = process.argv.slice(2);
const excludedPrefixes = ["tests/fixtures/security-violations/", ".git/"];

const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:(?:VITE_)?SUPABASE_(?:SERVICE_ROLE|SECRET)_KEY|SUPABASE_DB_PASSWORD|CLOUDFLARE_API_TOKEN)\s*=\s*[^\s"']{12,}/,
];

function trackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" });
  return output.split("\0").filter(Boolean);
}

function shouldScan(file) {
  return !excludedPrefixes.some((prefix) => file.startsWith(prefix));
}

function violationsFor(file) {
  const content = readFileSync(file, "utf8");
  return content
    .split("\n")
    .flatMap((line, index) =>
      patterns.some((pattern) => pattern.test(line))
        ? [`${file}:${index + 1}`]
        : [],
    );
}

const files =
  explicitFiles.length > 0 ? explicitFiles : trackedFiles().filter(shouldScan);
const violations = files.flatMap(violationsFor);

if (violations.length > 0) {
  console.error("Secret-like material detected in tracked content:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Secret guard passed (${files.length} files checked).`);
