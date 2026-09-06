import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const forbiddenTerms = ["TO" + "DO", "FIX" + "ME", "HA" + "CK", "TE" + "MP"];
const forbiddenPattern = new RegExp(
  `\\b(?:${forbiddenTerms.join("|")})\\b`,
  "i",
);
const explicitFiles = process.argv.slice(2);

const metaFilesThatDefineQualityRules = new Set([
  "eslint.config.js",
  "scripts/check-forbidden-markers.mjs",
]);

function trackedFiles() {
  const output = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" });
  return output.split("\0").filter(Boolean);
}

function isNormallyScanned(file) {
  if (file.startsWith("tests/fixtures/quality-violations/")) return false;
  if (metaFilesThatDefineQualityRules.has(file)) return false;

  return (
    file.startsWith("src/") ||
    file.startsWith("scripts/") ||
    file.startsWith("supabase/") ||
    file.startsWith(".github/workflows/") ||
    /^(package\.json|tsconfig.*\.json|vite\.config\.ts|dependency-cruiser\.config\.mjs|knip\.json)$/.test(
      file,
    )
  );
}

function findViolations(files) {
  return files.flatMap((file) => {
    const content = readFileSync(file, "utf8");
    return content
      .split("\n")
      .flatMap((line, index) =>
        forbiddenPattern.test(line)
          ? [`${file}:${index + 1}: ${line.trim()}`]
          : [],
      );
  });
}

const files =
  explicitFiles.length > 0
    ? explicitFiles
    : trackedFiles().filter(isNormallyScanned);
const violations = findViolations(files);

if (violations.length > 0) {
  console.error("Forbidden untracked technical-debt markers found:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`Forbidden-marker scan passed (${files.length} files checked).`);
