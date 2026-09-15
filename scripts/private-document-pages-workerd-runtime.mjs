import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import {
  localSupabaseEnvironment,
  setPromotionOrigin,
} from "./private-document-edge-helpers.mjs";
import { runTrustedIngestScenarios } from "./private-document-edge-scenarios.mjs";

function executableName() {
  return process.platform === "win32" ? "wrangler.cmd" : "wrangler";
}

function wranglerBinary() {
  const pathEntries = (process.env.PATH ?? "").split(delimiter);
  const candidate = pathEntries
    .map((entry) => join(entry, executableName()))
    .find((entry) => existsSync(entry));
  if (candidate === undefined) {
    throw new Error("Wrangler is not available in the npm exec environment.");
  }
  return realpathSync(candidate);
}

function miniflareFromWrangler(binary) {
  const packageRoot = dirname(dirname(binary));
  const requireFromWrangler = createRequire(join(packageRoot, "package.json"));
  const miniflare = requireFromWrangler("miniflare");
  return {
    Miniflare: miniflare.Miniflare,
    convertV4MiniflareOptions: miniflare.convertV4MiniflareOptions,
  };
}

function buildPagesFunctions(binary, outputFile) {
  execFileSync(
    process.execPath,
    [
      binary,
      "pages",
      "functions",
      "build",
      "functions",
      "--outfile",
      outputFile,
      "--fallback-service",
      "ASSETS",
    ],
    { cwd: process.cwd(), stdio: "inherit" },
  );
}

async function main() {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "mariage-os-pages-workerd-"),
  );
  const bundleFilename = "pages-functions.mjs";
  const bundlePath = join(temporaryDirectory, bundleFilename);
  const binary = wranglerBinary();
  const { Miniflare, convertV4MiniflareOptions } =
    miniflareFromWrangler(binary);
  const environment = localSupabaseEnvironment();
  let runtime;

  try {
    buildPagesFunctions(binary, bundlePath);
    runtime = new Miniflare(
      convertV4MiniflareOptions({
        host: "127.0.0.1",
        port: 0,
        rootPath: temporaryDirectory,
        scriptPath: bundleFilename,
        modules: true,
        compatibilityDate: "2026-09-15",
        bindings: {
          SUPABASE_URL: environment.apiUrl,
          SUPABASE_PUBLISHABLE_KEY: environment.anonKey,
          PRIVATE_DOCUMENT_ADMIN_KEY: environment.serviceRoleKey,
        },
        serviceBindings: {
          ASSETS: () => new Response("Not found", { status: 404 }),
        },
      }),
    );
    const runtimeUrl = await runtime.ready;
    setPromotionOrigin(runtimeUrl.origin);
    await runTrustedIngestScenarios();
  } finally {
    await runtime?.dispose();
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Direct workerd promotion integration failed.",
  );
  process.exit(1);
});
