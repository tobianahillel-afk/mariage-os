import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const negativeCases = [
  {
    name: "ESLint complexity/parameter violation",
    command: npmCommand,
    args: ["exec", "--", "eslint", "tests/fixtures/quality-violations/over-complex.ts"],
  },
  {
    name: "dependency-cruiser cycle/layer violation",
    command: npmCommand,
    args: [
      "exec",
      "--",
      "depcruise",
      "--validate",
      "dependency-cruiser.config.mjs",
      "tests/fixtures/quality-violations/src",
    ],
  },
  {
    name: "forbidden marker violation",
    command: process.execPath,
    args: ["scripts/check-forbidden-markers.mjs", "tests/fixtures/quality-violations/forbidden-marker.ts"],
  },
];

for (const negativeCase of negativeCases) {
  const result = spawnSync(negativeCase.command, negativeCase.args, {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (result.status === 0) {
    console.error(`Negative control unexpectedly passed: ${negativeCase.name}`);
    process.exit(1);
  }

  console.log(`Negative control correctly rejected: ${negativeCase.name}`);
}

console.log("All deliberate quality violations were caught.");
