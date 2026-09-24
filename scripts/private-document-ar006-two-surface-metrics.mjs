export const PAGES_CPU_BUDGET_MS = 10;
export const DURABLE_OBJECT_CPU_BUDGET_MS = 30_000;

export function evaluateAr006TwoSurfaceEvents() {
  return {
    measurements: [],
    failures: [{ code: "not_implemented", evidenceId: null, surface: null }],
    pass: false,
  };
}
