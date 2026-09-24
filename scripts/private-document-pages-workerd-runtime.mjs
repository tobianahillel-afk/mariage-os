import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { build } from "vite";
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

function buildPagesFunctions(binary, outputDirectory) {
  execFileSync(
    process.execPath,
    [
      binary,
      "pages",
      "functions",
      "build",
      "functions",
      "--outdir",
      outputDirectory,
      "--fallback-service",
      "ASSETS",
    ],
    { cwd: process.cwd(), stdio: "inherit" },
  );
}

async function buildPromotionWorker(outputDirectory) {
  await build({
    configFile: false,
    logLevel: "error",
    build: {
      emptyOutDir: false,
      lib: {
        entry: resolve("workers/private-document-promotion/src/worker.ts"),
        formats: ["es"],
        fileName: () => "private-document-promotion.js",
      },
      outDir: outputDirectory,
      target: "es2022",
      rollupOptions: {
        external: ["cloudflare:workers"],
      },
    },
  });
  return join(outputDirectory, "private-document-promotion.js");
}

function pagesWorker(temporaryDirectory) {
  return {
    name: "pages-promotion-ingress",
    rootPath: temporaryDirectory,
    scriptPath: "index.js",
    modules: true,
    compatibilityDate: "2026-09-17",
    serviceBindings: {
      ASSETS: () => new globalThis.Response("Not found", { status: 404 }),
    },
    durableObjects: {
      PRIVATE_DOCUMENT_LIFECYCLE: {
        className: "PrivateDocumentLifecycle",
        scriptName: "private-document-promotion",
        useSQLite: true,
      },
    },
  };
}

function promotionWorker(temporaryDirectory, promotionWorkerPath, environment) {
  return {
    name: "private-document-promotion",
    rootPath: temporaryDirectory,
    scriptPath: promotionWorkerPath,
    modules: true,
    compatibilityDate: "2026-09-17",
    bindings: {
      SUPABASE_URL: environment.apiUrl,
      SUPABASE_PUBLISHABLE_KEY: environment.anonKey,
      PRIVATE_DOCUMENT_ADMIN_KEY: environment.serviceRoleKey,
    },
    durableObjects: {
      PrivateDocumentLifecycle: {
        className: "PrivateDocumentLifecycle",
        useSQLite: true,
      },
    },
  };
}

async function createRuntime(binary, temporaryDirectory) {
  const { Miniflare, convertV4MiniflareOptions } =
    miniflareFromWrangler(binary);
  const environment = localSupabaseEnvironment();
  buildPagesFunctions(binary, temporaryDirectory);
  const promotionWorkerPath = await buildPromotionWorker(temporaryDirectory);
  return new Miniflare(
    convertV4MiniflareOptions({
      host: "127.0.0.1",
      port: 0,
      workers: [
        pagesWorker(temporaryDirectory),
        promotionWorker(temporaryDirectory, promotionWorkerPath, environment),
      ],
    }),
  );
}

async function main() {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "mariage-os-pages-workerd-"),
  );
  let runtime;

  try {
    runtime = await createRuntime(wranglerBinary(), temporaryDirectory);
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
