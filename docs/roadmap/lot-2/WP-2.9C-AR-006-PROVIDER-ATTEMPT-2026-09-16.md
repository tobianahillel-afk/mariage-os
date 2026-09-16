# WP-2.9C / WP29C-AR-006 — isolated provider attempt, 2026-09-16

Status: **FAILED CLOSED — PROVIDER CPU TELEMETRY UNAVAILABLE; ARCHITECTURE REVIEW OPEN / WP-2.9C BLOCKED**

This is a sanitized operational record. It contains no token, password, private PDF bytes, raw provider logs, or wedding data. The [CPU evidence protocol](WP-2.9C-AR-006-CPU-EVIDENCE.md), [execution runbook](WP-2.9C-AR-006-RUNBOOK.md), and [AR-006 architecture review](WP-2.9C-AR-006-ARCHITECTURE-REVIEW.md) remain normative.

## Exact candidate and gates

- Branch: `lot-2/venues-core`.
- Read-only preflight: commit `d89b3601d066996c3958f30ad9067b34675f8b22`, [CI `35138142860`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/35138142860), job `104935966498` **SUCCESS**. The enclosing workflow was cancelled by the later evidence push; its clean-checkout job did not complete. Complete 5/5 verification belongs to the evidence candidate below.
- Evidence candidate: commit `4f40613060b4c9de41a32d99ed43fcf6e12c9791`, [CI `35138368708`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/35138368708), normal repository jobs **5/5 SUCCESS** including clean-checkout full verify. Provider job `104939181956` **FAILURE** on the CPU evidence condition after functional execution.
- Isolated Pages project `mariage-os-ar006-isolated`, deployment `064d50b9-3c3d-414e-a6c3-afdcc1051be9`, URL `https://064d50b9.mariage-os-ar006-isolated.pages.dev`, branch `ar006-4f40613060b4`, preview script `pages-worker--19505720-preview`. Pages metadata resolves the deployed commit to the exact candidate. The account dashboard displayed Workers Free. No Paid CPU entitlement was selected.
- The Pages Function/bindings checks and deny-oriented deployed route smoke passed before the controlled promotions. The isolated Supabase project and synthetic member had live `documents.write`.

## Exact-size sanitized result

- [Actions artifact `10464581885`](https://github.com/tobianahillel-afk/mariage-os/actions/runs/35138368708/artifacts/10464581885), schema `mariage-os.wp29c.ar006.v2`, generated `2026-09-16T19:19:31.844Z`; downloaded ZIP SHA-256 `56c809b27dadf42a3ef26a003855eb628dbf0ef437774bb76d82c02b33ada3c5`.
- Ten distinct deterministic synthetic PDFs were each exactly `25,000,000` bytes. All ten trusted promotion responses were HTTP `200` with `success: true`; isolated Supabase document states were verified `ready` afterward.
- Controlled analytics window: `2026-09-16T19:13:57.417Z` through `2026-09-16T19:16:29.334Z`.
- Artifact fields: `providerCpuMeasurements: []`, `cpuBudgetMs: 10`, `pass: false`. The provider job intentionally failed closed.
- Cloudflare GraphQL `workersInvocationsAdaptive` returned `[]` for the controlled script/window. Follow-up account-wide queries with no script filter, including the entire 2026-09-16 UTC day, also returned `[]` with API success/no errors. The Pages Preview metrics dashboard displayed no request/CPU data as of `19:45 UTC`, approximately 29 minutes after the final promotion. No CPU value or CPU-limit outcome can be inferred from HTTP 200 or zero dashboard counts.

## Delayed GraphQL requery

- Read-only trigger `9b139d23a7de47f8d3927a54c54d79298ca96a6b` re-queried the same exact preview script and original controlled window without redeploying or mutating Supabase.
- Workflow `35149303081` retained sanitized artifact `10468931194`.
- Roughly 1 h 40 after the controlled execution, the provider still returned no attributable `workersInvocationsAdaptive` CPU rows. The aggregation-delay hypothesis therefore did not unblock the finding.
- The architecture review was reopened. Empty telemetry remains evidence absence, not zero CPU.

## Pages deployment-tail capability probe

A bounded provider-native tail experiment was then executed before any further exact-size mutation run.

- Tail support tree `d04edd0ed0d3daa3b9bfe20d954003bb13545200` was verified on implementation parent `82e05a8dab9f61377f045b74005fd6582da0afe3` / CI `35152382433`, including clean-checkout full verification.
- No-content exact-tree trigger `7645a9e769c641640f52fdba535deb6140401fc6` launched workflow `35153132971`, job `104986087784`.
- The tail attached to the existing exact deployment successfully, and the deny-only production smoke passed without privileged credentials. No PDF was uploaded, no Supabase authentication occurred, and no application data was mutated.
- Sanitized artifact `10469354745` (ZIP SHA-256 `6b1c9db4b0b54d83881614867c1f68bd3e45b71fa767fec55c09203a72ac1f8c`) recorded `parsedJsonEventCount: 0`, `providerCpuTimeMs: []`, `pass: false`.
- Raw tail output was intentionally not retained. The result therefore does **not** prove that every possible Pages tail event lacks CPU; it proves only that the bounded probe captured no parseable JSON CPU event.
- Cloudflare's documented standard Pages deployment-tail event shape does not define a CPU-time field. The architecture review therefore rejects standard Pages tail as the packet's final CPU-evidence mechanism and forbids rerunning the ten exact-size promotions merely to retry that channel.

## Current architecture-review direction

The next bounded candidate is Cloudflare Workers Observability telemetry. Its provider event model explicitly includes `$workers.cpuTimeMs` and script/request attribution, while the API model includes `pages` as a possible cloud-service origin.

Before any further exact-size mutation run, a dedicated capability preflight must prove that the **existing exact Pages preview script** appears in Workers Observability with numeric provider `cpuTimeMs`. The probe remains application-read-only: existing deny smoke plus provider telemetry query only.

Cloudflare currently documents `Workers Observability Write` as the accepted API-token permission for telemetry query/key endpoints. The repository therefore requires a separate short-lived secret `AR006_CLOUDFLARE_OBSERVABILITY_TOKEN`; it must not reuse the Pages deployment token or the Account Analytics token.

If the existing Pages deployment cannot expose attributable CPU through Workers Observability without a material runtime/configuration migration, stop and make an explicit architecture decision. Do not silently migrate Pages to Workers, enable Workers Paid, infer CPU from wall time/HTTP success, or lower the 25 MB contract.

## Verdict

The exact-size functional path is proven, but the required provider CPU measurement is still absent. `WP29C-AR-006` remains **OPEN / BLOCKING** and WP-2.9C remains **BLOCKED**. No Pass B, Pass C, acceptance, WP-2.9A resumption or Lot reconciliation may proceed until valid provider CPU evidence exists.
