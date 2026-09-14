import path from "node:path";
import { spawnSync } from "node:child_process";

const executable = path.resolve(
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.cmd" : "supabase",
);

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
process.exit(result.status ?? 1);
