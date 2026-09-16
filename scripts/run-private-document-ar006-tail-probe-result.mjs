import { readFile, writeFile } from "node:fs/promises";

const INPUT_PATH = "ar006-pages-tail-raw.log";
const OUTPUT_PATH = "ar006-pages-tail-probe.json";
const CPU_FIELD = /(^|\.)cpuTimeMs$/iu;

function collectShape(value, path, shapes, cpuValues) {
  if (Array.isArray(value)) {
    shapes.add(path ? `${path}[]` : "[]");
    for (const item of value) {
      collectShape(item, `${path}[]`, shapes, cpuValues);
    }
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    shapes.add(childPath);
    if (CPU_FIELD.test(childPath) && Number.isFinite(Number(child))) {
      cpuValues.push(Number(child));
    }
    collectShape(child, childPath, shapes, cpuValues);
  }
}

function parseJsonLines(raw) {
  const values = [];
  for (const line of raw.split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) continue;
    try {
      values.push(JSON.parse(trimmed));
    } catch {
      // Wrangler may interleave non-JSON status output; only valid JSON events matter.
    }
  }
  return values;
}

async function main() {
  const raw = await readFile(INPUT_PATH, "utf8");
  const values = parseJsonLines(raw);
  const shapes = new Set();
  const cpuValues = [];
  for (const value of values) collectShape(value, "", shapes, cpuValues);
  const result = {
    schema: "mariage-os.wp29c.ar006.tail-probe.v1",
    generatedAt: new Date().toISOString(),
    deploymentId: process.env.AR006_TAIL_DEPLOYMENT_ID ?? null,
    parsedJsonEventCount: values.length,
    observedFieldPaths: [...shapes].sort(),
    providerCpuTimeMs: cpuValues,
    pass: values.length > 0 && cpuValues.length > 0,
  };
  await writeFile(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`AR-006 Pages tail probe written to ${OUTPUT_PATH}.`);
  if (!result.pass) {
    throw new Error(
      "Pages deployment tail did not expose provider cpuTimeMs.",
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
