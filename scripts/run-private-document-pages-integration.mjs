import { spawn } from "node:child_process";

const WRANGLER_VERSION = "4.131.2";
const npmExecPath = process.env.npm_execpath;

function runtimeArgs() {
  if (!npmExecPath) throw new Error("npm_execpath is required for Pages tests.");
  return [
    npmExecPath,
    "exec",
    "--yes",
    `--package=wrangler@${WRANGLER_VERSION}`,
    "--",
    "node",
    "scripts/private-document-pages-workerd-runtime.mjs",
  ];
}

async function main() {
  const child = spawn(process.execPath, runtimeArgs(), {
    cwd: process.cwd(),
    env: { ...process.env, CI: "true" },
    stdio: "inherit",
  });

  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (signal !== null) {
        reject(new Error(`Direct workerd harness terminated by ${signal}.`));
        return;
      }
      resolve(code ?? 1);
    });
  });
  if (exitCode !== 0) process.exit(exitCode);
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Pages promotion integration failed.",
  );
  process.exit(1);
});
