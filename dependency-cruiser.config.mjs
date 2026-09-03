const src = "(^|/)src/";

export default {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "domain-does-not-depend-outward",
      severity: "error",
      from: { path: `${src}domain/` },
      to: {
        path: `${src}(app|ui|application|infrastructure|import-export|pwa|workers)/`,
      },
    },
    {
      name: "application-does-not-use-concrete-infrastructure",
      severity: "error",
      from: { path: `${src}application/` },
      to: { path: `${src}(ui|infrastructure|app)/` },
    },
    {
      name: "ui-does-not-use-concrete-infrastructure",
      severity: "error",
      from: { path: `${src}ui/` },
      to: { path: `${src}infrastructure/` },
    },
    {
      name: "shared-does-not-depend-on-higher-layers",
      severity: "error",
      from: { path: `${src}shared/` },
      to: {
        path: `${src}(domain|application|infrastructure|ui|app|import-export|pwa|workers)/`,
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: "(^|/)(dist|coverage|node_modules)/",
    tsPreCompilationDeps: true,
    combinedDependencies: true,
  },
};
