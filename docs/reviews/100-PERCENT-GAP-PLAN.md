# Mariage OS — Exact 100% / 300-of-300 Gap Plan

Status: **Normative completion roadmap**

Purpose: answer exactly what remains before Mariage OS may honestly claim 100% at each maturity level and eventually `300/300` against `ABSOLUTE-300-CONTROL-CHECKLIST.md`.

## Core rule

There is no single honest “100%” before code exists. The project has five cumulative completion gates:

1. **Documentation 100%** — no material design ambiguity or unresolved pre-code review blocker.
2. **Engineering foundation 100%** — Lot 0 turns documented rules into executable CI/tooling/release foundations.
3. **V1 implementation verification 100%** — Lots 1–11 implement and objectively verify the product.
4. **V1 production/cutover 100%** — Lot 12 + Checkpoint D prove real-data operation/recovery/device acceptance.
5. **300/300 / future-major readiness** — all applicable controls have evidence, including a rehearsable V1.x→V2 upgrade path when V2 exists.

A lower phase can be 100% while later-phase controls intentionally remain `NOT YET APPLICABLE/PROVABLE`.

---

# Gate A — Documentation 100% before Lot 0

These are the only remaining steps that belong to the current documentation phase.

## A1. Final stale-wording / precedence sentry

Current result:

- old unconditional `merge → Lot 0` wording has been removed from governing entry points;
- old seating/timeline/color deferrals were reconciled;
- private-first vs public-ready precedence is explicit;
- agent/engineering/release precedence is explicit;
- only known sentry string is the historical words `freeze candidate` inside the header of `PHYSICAL-SCHEMA-V1.md`.

Required closure:

- [ ] record that this historical phrase is non-decision-bearing and cannot override the same header's `Normative schema design for implementation`, schema addenda or current gate state;
- [ ] preferably replace the phrase in a future direct file cleanup with `frozen V1 implementation reference` for literal textual cleanliness;
- [ ] rerun sentry search after any final doc edit.

Normative ambiguity is already removed by root `AGENTS.md`; literal string cleanup remains desirable for cosmetic 100% consistency.

## A2. Final public-repository privacy/secret scan

Current final-diff evidence:

- changed-file inventory contains text documentation/config only; no wedding XLSX, backup, private photo or production dump;
- real-name examples found during review (`Hillel`) were removed/replaced with synthetic partner/owner labels;
- sentry scans currently return no matches for `Hillel`, `Tobiana`, `Gabay`, `ghp_`, `github_pat_`, `AKIA`, `BEGIN PRIVATE KEY`, `AIza` and other tested high-signal token prefixes;
- `.gitignore` rejects runtime/private imports, exports, backups, env files, keys and dumps.

Required closure:

- [ ] rerun exact final-diff scan against the last HEAD after all documentation edits;
- [ ] run repository secret scanner in Lot 0 and continuously afterward (documentation-time text search is not a substitute for an executable scanner);
- [ ] if any real personal/private fixture appears, remove it before merge and regenerate evidence.

## A3. Review threads and PR state

Current evidence:

- all five historical P1 review findings have documented resolutions;
- branch is based directly on current `main` merge base, ahead with no behind divergence;
- raw GitHub PR state on audited HEAD reports `mergeable: true`, `mergeable_state: clean`.

Required closure:

- [ ] after the **last** documentation commit, re-read raw PR mergeability once more;
- [ ] confirm no new unresolved blocking review thread appeared;
- [ ] record the exact final reviewed HEAD SHA.

## A4. Final Design Review closure

- [ ] close FDR-016 with final sentry evidence / controlled historical-label exception;
- [ ] close FDR-019 with final privacy/secret scan evidence;
- [ ] add the version/update/release-system review as resolved design scope;
- [ ] make all FDR BLOCKING/MAJOR findings `RESOLVED`;
- [ ] record final reviewed SHA and review date;
- [ ] mark documentation design review `PASS`, while still stating that Lot 0 starts only after Run 4 merge.

## A5. Merge and canonical main-state transition

- [ ] merge PR #4 Run 4 into `main`;
- [ ] verify merged `main` contains the reviewed SHA/content;
- [ ] update `FINAL-DESIGN-REVIEW.md`/status on `main` as required by the frozen gate process;
- [ ] move `IMPLEMENTATION-STATUS.md` from documentation phase to Lot 0 `READY`;
- [ ] do **not** mark any feature `IMPLEMENTED` merely because docs merged.

### Documentation 100% definition

Documentation becomes 100% only when A1–A5 are all closed and no unresolved BLOCKING/MAJOR documentation finding remains.

---

# Gate B — Lot 0 Engineering Foundation 100%

This is where the current 9.5–9.8 design scores can become **10/10 executable evidence**.

## B1. Reproducible toolchain

- [ ] choose/document maintained Node/npm versions;
- [ ] create Vite + strict TypeScript no-React skeleton;
- [ ] commit lockfile;
- [ ] `npm ci` works from clean clone;
- [ ] provide `.env.example` with fake placeholders only;
- [ ] implement environment validation;
- [ ] provide deterministic `npm run dev`, `npm run test:fast`, `npm run verify`.

## B2. Canonical physical architecture

- [ ] implement canonical `src/`, `tests/`, `supabase/` directories;
- [ ] implement import/path aliases only if they preserve boundaries;
- [ ] create composition-root convention;
- [ ] create representative empty/skeleton domain/application/infrastructure/UI ownership paths;
- [ ] document exceptions if platform configuration requires special roots.

## B3. Automated maintainability enforcement

- [ ] formatter;
- [ ] ESLint/static rules;
- [ ] dependency-layer enforcement;
- [ ] circular-dependency detector;
- [ ] source-file max/review thresholds;
- [ ] function-length thresholds;
- [ ] cyclomatic complexity threshold;
- [ ] nesting/parameter threshold where tooling is reliable;
- [ ] dead-code/unused import checks;
- [ ] tracked/forbidden TODO/FIXME/HACK/TEMP checks;
- [ ] forbid vague dumping-ground production modules by review/static convention.

## B4. Test harnesses

- [ ] Vitest/unit harness;
- [ ] property-test library/harness;
- [ ] 100%-gate coverage config for defined in-scope business code;
- [ ] mutation-test harness;
- [ ] Playwright/browser harness;
- [ ] accessibility automation;
- [ ] performance/reference-data harness;
- [ ] deterministic synthetic fixtures/golden project.

## B5. Supabase / DB / RLS harness

- [ ] local Supabase configuration;
- [ ] migration directory and clean-reset procedure;
- [ ] deterministic synthetic projects/users/roles seed;
- [ ] direct DB constraint tests;
- [ ] RLS allow/deny/adversarial harness;
- [ ] migration-from-zero test;
- [ ] historical migration fixture architecture.

## B6. Local/PWA/update harness

- [ ] IndexedDB schema/version harness;
- [ ] local migration fixture harness;
- [ ] pending-mutation preservation fixtures;
- [ ] service-worker/PWA test harness;
- [ ] version/release manifest generator;
- [ ] app/backend compatibility test helper;
- [ ] old-client/update-required test fixture;
- [ ] multi-tab update/migration test strategy.

## B7. Pull-request CI

- [ ] clean install job;
- [ ] format/lint/typecheck;
- [ ] architecture/complexity job;
- [ ] unit/property/coverage;
- [ ] DB/RLS;
- [ ] local migration;
- [ ] security/secret/dependency scans;
- [ ] import/backup/offline jobs when affected;
- [ ] browser/accessibility/build jobs;
- [ ] docs/traceability/staleness checks;
- [ ] version/schema-impact validator;
- [ ] privacy-safe preview deployment.

## B8. GitHub / environment governance

- [ ] protect `main` appropriately;
- [ ] create/protect production release ref/branch strategy;
- [ ] configure required status checks once workflows exist;
- [ ] configure least-privilege Actions permissions;
- [ ] create protected staging/production environments;
- [ ] keep production credentials only in protected environment secrets;
- [ ] ensure forks/untrusted PRs cannot receive them;
- [ ] configure release/deployment concurrency lock.

## B9. Release-pipeline skeleton

- [ ] immutable release artifact/manifest from exact SHA;
- [ ] SemVer consistency checker;
- [ ] release-plan validator;
- [ ] staging migration workflow skeleton;
- [ ] staging exact-candidate deployment;
- [ ] production migration gate workflow;
- [ ] protected production-ref promotion step;
- [ ] Cloudflare production deployment wiring;
- [ ] post-deployment smoke hook;
- [ ] release-status/evidence artifact.

## B10. Lot 0 acceptance

- [ ] fresh clone passes bootstrap without production credentials;
- [ ] complete `verify` from clean state is green;
- [ ] preview pipeline is green;
- [ ] synthetic migration/RLS/security smoke is green;
- [ ] release manifest is generated and validated;
- [ ] update/PWA harness can simulate previous→current build;
- [ ] no production wedding feature/data required yet;
- [ ] Lot 0 checkpoint evidence is committed and status updated.

### Engineering foundation 100% definition

Gate B is 100% only when the documented engineering rules are executable and failing rules block CI instead of relying on memory/review prose alone.

---

# Gate C — V1 Implementation / Lots 1–11 100%

For every Feature ID, repeat the same lifecycle instead of treating this as one giant checklist.

## C1. Before feature implementation

- [ ] Feature ID/status/lot correct;
- [ ] FIR complete;
- [ ] Requirements/Acceptance/User Flow linked;
- [ ] UX route/blueprint known;
- [ ] domain entities/invariants known;
- [ ] cloud/local ownership known;
- [ ] offline/sync classification known;
- [ ] permission/RLS/security impact known;
- [ ] migration/import/backup impact known;
- [ ] affected cross-feature/read-model interfaces known;
- [ ] test strategy known;
- [ ] no unresolved semantic TBD.

## C2. During implementation

- [ ] smallest coherent vertical slice;
- [ ] domain/application/infrastructure/UI boundaries respected;
- [ ] code-size/complexity rules stay green;
- [ ] migrations are versioned;
- [ ] local changes preserve pending work;
- [ ] no duplicated business truth;
- [ ] security deny paths implemented alongside allow paths;
- [ ] mobile/desktop/error/offline/conflict states implemented;
- [ ] docs/FIR/Feature Ledger evolve with implementation.

## C3. Feature verification

- [ ] unit/domain;
- [ ] boundary/error;
- [ ] property/mutation where applicable;
- [ ] integration;
- [ ] DB constraints/RLS allow+deny;
- [ ] security/adversarial;
- [ ] IndexedDB/local migration;
- [ ] offline/sync/conflict;
- [ ] import/export/migration/backup where applicable;
- [ ] E2E;
- [ ] accessibility;
- [ ] performance/reference data;
- [ ] desktop/mobile visual review;
- [ ] full `verify` green;
- [ ] feature status moves through `VERIFIED`→`INTEGRATED`→`ACCEPTED` only with evidence.

## C4. Cross-feature integration

For every material change verify affected:

- [ ] Dashboard;
- [ ] Search;
- [ ] Inbox;
- [ ] activity/history;
- [ ] missing-information engine;
- [ ] budget/scenarios;
- [ ] guest/capacity/seating;
- [ ] planning/progress/next action;
- [ ] timeline;
- [ ] imports/exports/backups;
- [ ] permissions/RLS;
- [ ] offline/cache/sync;
- [ ] Settings/Diagnostics;
- [ ] mobile/desktop representations.

## C5. Mandatory checkpoints

- [ ] Checkpoint A after Lots 0–3;
- [ ] Checkpoint B after Lots 4–7;
- [ ] Checkpoint C after Lots 8–10;
- [ ] production-readiness review during Lot 11;
- [ ] rerun 300-control applicable subset and scorecard at each checkpoint;
- [ ] zero unresolved BLOCKING/MAJOR before dependent group continues.

### V1 implementation 100% definition

All V1 Feature IDs through production-readiness scope are accepted, all elapsed-lot requirements objectively verified, and Checkpoints A/B/C pass.

---

# Gate D — V1 Production / Real-data Cutover 100%

## D1. Production release infrastructure

- [ ] actual staging and protected production environments configured;
- [ ] production migration credentials safely installed;
- [ ] production ref/Cloudflare deployment integrated;
- [ ] release lock tested;
- [ ] migration failure stops frontend promotion;
- [ ] production smoke executes automatically;
- [ ] monitoring/diagnostics observation works;
- [ ] compatible frontend rollback is tested.

## D2. Real-data migration/reconciliation

- [ ] venue research migrated/reconciled;
- [ ] guest spreadsheet migrated/reconciled;
- [ ] vendor data migrated/reconciled;
- [ ] budget/guest/statistics independently reconciled;
- [ ] provenance retained;
- [ ] no stronger evidence silently overwritten;
- [ ] legacy sources archived/read-only after cutover.

## D3. Security/identity readiness

- [ ] two independent owner accounts;
- [ ] MFA configured/tested;
- [ ] recovery tested;
- [ ] complete RLS/Storage tenant evidence;
- [ ] no production secret/private data in Git/CI artifacts;
- [ ] production headers/CSP/security posture reviewed.

## D4. Recovery

- [ ] final full `.mariage` backup produced;
- [ ] integrity/encryption verified;
- [ ] restore drill into safe target succeeds;
- [ ] historical migration tests remain green;
- [ ] incident/recovery procedure usable without chat memory.

## D5. Owner/device acceptance

- [ ] both partners complete critical workflows on their real supported devices;
- [ ] mobile/desktop PWA/update flows accepted;
- [ ] offline/reconnect accepted;
- [ ] imports/exports and recovery understood;
- [ ] major usability/blocking defects closed.

## D6. Checkpoint D

- [ ] all 300 controls applicable to V1 production evaluated;
- [ ] no unresolved BLOCKING/MAJOR;
- [ ] final cutover report PASS;
- [ ] source-of-truth declaration made only then.

### V1 production 100% definition

Mariage OS is the operational source of truth only after Gate D passes. Before it, legacy spreadsheets/research remain authoritative.

---

# Gate E — V1.x → V2 / Future Major-Version 100%

This gate becomes applicable when an actual V2 scope exists.

## E1. V2 product delta

- [ ] V2 specification approved;
- [ ] V1→V2 scope delta explicit;
- [ ] every V1 feature classified unchanged/changed/deprecated/replaced/removed;
- [ ] historical IDs retained rather than rewritten;
- [ ] V2 requirements/acceptance added;
- [ ] user migration/communication impact defined.

## E2. Cross-layer migration design

- [ ] PostgreSQL/RLS/RPC V1.x→V2;
- [ ] IndexedDB V1.x→V2;
- [ ] pending sync-operation V1.x→V2;
- [ ] canonical import V1.x→V2;
- [ ] `.mariage` backup V1.x→V2;
- [ ] persisted settings/preferences V1.x→V2;
- [ ] service-worker/cache V1.x→V2;
- [ ] every changed route/interface state V1→V2;
- [ ] minimum safe client/forced-update boundary.

## E3. Historical upgrade tests

- [ ] fresh V2 install;
- [ ] V1.0.x→V2 where supported;
- [ ] V1.1.x→V2;
- [ ] latest V1.x→V2;
- [ ] skipped intermediate frontend versions;
- [ ] old pending offline mutations;
- [ ] V1 backup restore into V2;
- [ ] V1 import fixtures into V2;
- [ ] downgrade/old-client incompatible path safely blocked.

## E4. UI-wide V2 reconciliation

- [ ] Dashboard;
- [ ] Search;
- [ ] Inbox;
- [ ] Venues;
- [ ] Vendors;
- [ ] Guests;
- [ ] Seating;
- [ ] Budget;
- [ ] Tasks;
- [ ] Decisions;
- [ ] Planning;
- [ ] Timeline;
- [ ] Documents;
- [ ] Map;
- [ ] Import/export;
- [ ] Settings/Diagnostics;
- [ ] mobile/tablet/desktop;
- [ ] loading/error/offline/conflict/update-required states;
- [ ] accessibility/help/release notes.

## E5. V2 rehearsal / release

- [ ] representative complete synthetic V1 project upgraded in place in staging;
- [ ] exact production-like migration rehearsal;
- [ ] backup/recovery rehearsal;
- [ ] major security/threat-model review;
- [ ] complete UX/accessibility/performance review;
- [ ] V2 release plan PASS;
- [ ] production expand/migrate/promote sequence;
- [ ] V2 post-release monitoring HEALTHY;
- [ ] irreversible V1 cleanup delayed until proven safe.

### V2-upgrade 100% definition

A future V2 is 100% migration-ready only when a supported V1 project, local state, pending work and backup can be upgraded with objective evidence and without silent data loss.

---

# The exact score interpretation

Do **not** average an unimplemented control into a fake 100.

Use these states per control:

- `PASS — documented design evidence` (pre-code design control);
- `PASS — automated evidence`;
- `PASS — manual/device evidence`;
- `N/A — genuinely not applicable with reason`;
- `NOT YET PROVABLE — later phase`;
- `FAIL`;
- `BLOCKED`.

Numerical score for a phase is 100% only when every control required **for that phase** is `PASS` or justified `N/A`, with zero `FAIL/BLOCKED/NOT YET PROVABLE` among phase-required controls.

The final product-level `300/300` claim requires every applicable `C001..C300` to have its final required evidence, not merely documentation.
