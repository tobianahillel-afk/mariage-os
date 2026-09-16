# WP-2.9C / WP29C-AR-006 — isolated provider attempt, 2026-09-16

Status: **FAILED CLOSED — PROVIDER CPU TELEMETRY UNAVAILABLE; AR-006 OPEN / WP-2.9C BLOCKED**

This is a sanitized operational record. It contains no token, password, private PDF bytes, or wedding data. The [CPU evidence protocol](WP-2.9C-AR-006-CPU-EVIDENCE.md) and [execution runbook](WP-2.9C-AR-006-RUNBOOK.md) remain normative.

## Exact candidate and gates

- Branch: `lot-2/venues-core`.
- Read-only preflight: commit `d89b3601d066996c3958f30ad9067b34675f8b22`, [CI `35138142860`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/35138142860), job `104935966498` **SUCCESS**.
- Evidence candidate: commit `4f40613060b4c9de41a32d99ed43fcf6e12c9791`, [CI `35138368708`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/35138368708), normal repository jobs **5/5 SUCCESS** including clean-checkout full verify. Provider job `104939181956` **FAILURE** on the CPU evidence condition after functional execution.
- Isolated Pages project `mariage-os-ar006-isolated`, deployment `064d50b9-3c3d-414e-a6c3-afdcc1051be9`, URL `https://064d50b9.mariage-os-ar006-isolated.pages.dev`, branch `ar006-4f40613060b4`, preview script `pages-worker--19505720-preview`. Pages metadata resolves the deployed commit to the exact candidate. The account dashboard displayed Workers Free. No Paid CPU entitlement was selected.
- The Pages Function/bindings checks and deny-oriented deployed route smoke passed before the controlled promotions. The isolated Supabase project and synthetic member had live `documents.write`.

## Sanitized result

- [Actions artifact `10464581885`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/35138368708/artifacts/10464581885), schema `mariage-os.wp29c.ar006.v2`, generated `2026-09-16T19:19:31.844Z`; downloaded ZIP SHA-256 `56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5`.
- Ten distinct deterministic synthetic PDFs were each exactly `25,000,000` bytes. All ten trusted promotion responses were HTTP `200` with `success: true`; isolated Supabase document states were verified `ready` afterward.
- Controlled analytics window: `2026-09-16T19:13:57.417Z` through `2026-09-16T19:16:29.334Z`.
- Artifact fields: `providerCpuMeasurements: []`, `cpuBudgetMs: 10`, `pass: false`. The provider job intentionally failed closed.
- Cloudflare GraphQL `workersInvocationsAdaptive` returned `[]` for the controlled script/window. Follow-up account-wide queries with no script filter, including the entire 2026-09-16 UTC day, also returned `[]` with API success/no errors. The Pages Preview metrics dashboard displayed no request/CPU data as of `19:25 UTC`. Cloudflare documents a possible aggregation delay for recent traffic; the cause is not established.

## Verdict and next action

This proves the exact-size functional path ran in the isolated deployment. It **does not** prove per-invocation CPU consumption, normal `10 ms` Workers Free behavior, or absence of CPU-limit outcomes from provider telemetry. Empty telemetry is not zero CPU. AR-006 remains **OPEN / BLOCKING**; WP-2.9C remains **BLOCKED**. No Pass B, Pass C, acceptance or Lot reconciliation may proceed from this attempt.

Re-query provider telemetry after aggregation delay and require attribution and CPU-specific values for every controlled promotion. If the data remains absent or cannot be attributed, reopen AR-006 architecture review under the runbook before any revised provider-evidence design. Do not enable Workers Paid, infer CPU from wall time or HTTP status, or lower the 25 MB contract. Keep the synthetic data isolated pending evidence disposition, then reset/destroy it under the non-production procedure.
