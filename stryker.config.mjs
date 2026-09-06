export default {
  mutate: ["src/app/bootstrap/start-application.ts"],
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts",
  },
  coverageAnalysis: "perTest",
  reporters: ["clear-text", "progress"],
  thresholds: {
    high: 80,
    low: 60,
    break: 0,
  },
};
