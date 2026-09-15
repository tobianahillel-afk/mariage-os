import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import {
  localSupabaseEnvironment,
  setPromotionOrigin,
} from "./private-document-edge-helpers.mjs";
import { runTrustedIngestScenarios } from "./private-document-edge-scenarios.mjs";

const WRANGLER_VERSION = "4.131.2";
const PAGES_ORIGIN = "http://127.0.0.1:8788";
const npmExecPath = process.env.npm_execpath;

function wranglerArgs(assets, environment) {
  return [
    npmExecPath,
    "exec",
    "--yes",
    `--package=wrangler@${WRANGLER_VERSION}`,
    "--",
    "wrangler",
    "pages",
    "dev",
    assets,
    "--ip",
    "127.0.0.1",
    "--port",
    "8788",
    "--compatibility-date",
    "2026-09-15",
    "--binding",
    `SUPABASE_URL=${environment.apiUrl}`,
    "--binding",
    `SUPABASE_PUBLISHABLE_KEY=${environment.anonKey}`,
    "--binding",
    `SUPABASE_SECRET_KEY=${environment.serviceRoleKey}`,
  ];
}

function startPagesRuntime(assets, environment) {
  if (!npmExecPath) throw new Error("npm_execpath is required for Pages tests.");
  const processHandle = spawn(process.execPath, wranglerArgs(assets, environment), {
    cwd: process.cwd(),
    env: { ...process.env, CI: "true" },
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  let output = "";
  for (const stream of [processHandle.stdout, processHandle.stderr]) {
    stream.on("data", (chunk) => {
      output = `${output}${String(chunk)}`.slice(-12_000);
    });
  }
  return { processHandle, output: () => output };
}

async function waitForRuntime(runtime) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (runtime.processHandle.exitCode !== null) {
      throw new Error(`Wrangler exited before readiness.\n${runtime.output()}`);
    }
    try {
      const response = await fetch(PAGES_ORIGIN, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // Local workerd is still starting.
    }
    await delay(250);
  }
  throw new Error(`Wrangler did not become ready.\n${runtime.output()}`);
}

function stopRuntime(processHandle) {
  if (processHandle.exitCode !== null || processHandle.pid === undefined) return;
  if (process.platform === "win32") {
    processHandle.kill("SIGTERM");
    return;
  }
  try {
    process.kill(-processHandle.pid, "SIGTERM");
  } catch {
    processHandle.kill("SIGTERM");
  }
}

async function main() {
  const assets = mkdtempSync(join(tmpdir(), "mariage-os-pages-"));
  writeFileSync(join(assets, "index.html"), "<!doctype html><title>CI</title>");
  const runtime = startPagesRuntime(assets, localSupabaseEnvironment());
  try {
    await waitForRuntime(runtime);
    setPromotionOrigin(PAGES_ORIGIN);
    await runTrustedIngestScenarios();
  } finally {
    stopRuntime(runtime.processHandle);
    rmSync(assets, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Pages promotion integration failed.",
  );
  process.exit(1);
});
