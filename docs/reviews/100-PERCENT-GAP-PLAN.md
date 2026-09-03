# Mariage OS — Exact 100% / 300-of-300 Gap Plan

Status: **Normative maturity roadmap**

Purpose: define exactly what `100%` means at each maturity level without falsely treating unimplemented behavior as verified.

## Core rule

Mariage OS has five cumulative completion gates:

1. **Pre-Lot 0 design 100%** — 36/36 pre-code criteria at 10/10, no unresolved BLOCKING/MAJOR design issue.
2. **Engineering foundation 100%** — Lot 0 turns design rules into executable tooling/CI/release foundations.
3. **V1 implementation 100%** — feature lots implement and verify all V1 behavior.
4. **V1 production/cutover 100%** — real deployment, real-device acceptance and recovery are proven.
5. **300/300 / future-major 100%** — every applicable control in the absolute checklist has objective evidence, including V1.x→V2 rehearsal once V2 exists.

A lower maturity gate may be 100% while later controls remain intentionally `NOT YET PROVABLE`.

---

# Gate A — Pre-Lot 0 design 100%

Authoritative certificate: `PRE-LOT0-36-CRITERIA-CERTIFICATION.md`.

Gate A requires:

- [x] product mission and V1/post-V1 scope frozen;
- [x] public-ready multi-tenant core separated from private first deployment policy;
- [x] complete Feature/Requirement/Acceptance traceability;
- [x] user flows, UX architecture, screen composition and visual system frozen enough to prevent generic implementation drift;
- [x] cloud/local/offline/sync/data/invariant contracts explicit;
- [x] Auth/RLS/security/privacy/file/external-content design explicit;
- [x] import/export/backup/migration semantics explicit;
- [x] testing/quality/recovery/operations design explicit;
- [x] codebase structure, naming, dependency and complexity rules explicit;
- [x] context-free LLM routing/precedence/handoff explicit;
- [x] Lots 0–12 and Checkpoints A/B/C/D explicit;
- [x] release/version/update/V1→V2 architecture explicit;
- [x] known P1 design-review findings resolved;
- [x] no unresolved BLOCKING/MAJOR design finding remains;
- [ ] exact final-HEAD sentry clean;
- [ ] raw PR mergeability `true/clean` on exact final HEAD;
- [ ] exact final HEAD sealed in PR metadata;
- [ ] Run 4 merged;
- [ ] post-merge gate-state docs updated on `main` to `Lot 0 = READY / NOT_STARTED`.

The last five items are administrative/SHA-specific closure and do not require or permit Lot 0 implementation work.

---

# Gate B — Lot 0 engineering foundation 100%

Lot 0 must implement, execute and enforce the rules already designed.

Required proof includes:

- clean reproducible Vite + strict TypeScript bootstrap;
- committed lockfile and clean `npm ci`;
- lint/format/typecheck;
- automated architecture/dependency/cycle rules;
- file/function/complexity/TODO/dead-code guardrails;
- unit/property/coverage/mutation/Playwright/accessibility/performance harnesses;
- local Supabase reset/migration/constraint/RLS test harness;
- IndexedDB schema/migration/pending-operation harness;
- PWA/service-worker/update compatibility harness;
- secret/dependency/static security scanning;
- privacy-safe preview deployment;
- immutable release manifest/version consistency;
- staging/production release-workflow skeleton with migration-before-dependent-frontend sequencing;
- protected environment/least-privilege design translated into repository configuration where available;
- full clean verification green from fresh clone.

Gate B is 100% only when failure of these rules blocks CI instead of depending on developer memory.

---

# Gate C — V1 implementation 100%

For every V1 Feature ID:

1. identify Feature/Requirement/Acceptance/User Flow IDs;
2. complete/update its FIR;
3. implement the smallest coherent vertical slice;
4. preserve domain/application/infrastructure/UI boundaries;
5. implement cloud/local/offline/security behavior together;
6. add migrations and compatibility handling where required;
7. prove unit/boundary/property/mutation/integration/RLS/security/offline/import/backup/E2E/accessibility/performance behavior as applicable;
8. reconcile Dashboard/Search/Inbox/history/budget/planning/timeline/settings/mobile/desktop/read-model impacts;
9. move lifecycle status only with evidence;
10. pass the relevant integration checkpoint.

Mandatory checkpoints:

- Checkpoint A after Lots 0–3;
- Checkpoint B after Lots 4–7;
- Checkpoint C after Lots 8–10;
- production-readiness review through Lot 11.

No dependent lot continues with unresolved BLOCKING/MAJOR checkpoint findings.

---

# Gate D — V1 production/cutover 100%

Required proof includes:

- protected production deployment path operational;
- migration failure blocks dependent frontend promotion;
- release lock/concurrency protection works;
- post-deployment smoke/health observation works;
- compatible rollback/forward-fix procedure tested;
- real existing wedding data imported/reconciled without silent loss of provenance or stronger evidence;
- two owner identities/MFA/recovery accepted;
- production RLS/Storage isolation evidence complete;
- verified encrypted backup and restore drill;
- both owners complete critical workflows on supported real devices;
- offline/reconnect/update behavior accepted;
- Checkpoint D PASS;
- only then is Mariage OS declared operational source of truth.

---

# Gate E — 300/300 and V1.x→V2

This becomes fully applicable once V2 has an approved product scope.

V2 requires:

- explicit V1→V2 product delta;
- every V1 feature classified `unchanged`, `changed`, `deprecated`, `replaced` or `removed`;
- historical IDs preserved;
- PostgreSQL/RLS/RPC migration path;
- IndexedDB migration path;
- pending offline-operation migration path;
- canonical import and `.mariage` backup migration path;
- persisted settings/preferences migration path;
- Service Worker/cache migration path;
- minimum-safe-client / forced-update boundary;
- reconciliation of all changed UI surfaces and read models;
- historical upgrade fixtures for supported V1.x versions;
- skipped-version upgrade tests;
- V1 backup restore into V2;
- old incompatible client safely prevented from unsafe writes;
- production rehearsal using a complete synthetic V1 project upgraded to V2;
- full 300-control applicable set re-evaluated with objective evidence.

A major version is a migration program, not one ordinary feature PR.

---

# How the 300 controls are used

`ABSOLUTE-300-CONTROL-CHECKLIST.md` is the durable control inventory.

For each control use one state:

- `PASS — evidence linked`;
- `FAIL — remediation required`;
- `NOT YET PROVABLE — assigned to future gate`;
- `NOT APPLICABLE — rationale documented`.

Rules:

- documentation prose alone is not evidence for a runtime control;
- a green happy-path UI is not evidence for security, data integrity or recovery;
- any BLOCKING/MAJOR defect overrides numerical completion percentages;
- every checkpoint reruns the controls whose evidence could have changed;
- a control can regress from PASS to FAIL after a later change and must be treated accordingly.

## Current state

**Gate A design content: 36/36 = 100%.**

The remaining pre-Lot 0 work is only the exact-HEAD sentry/merge seal, Run 4 merge and post-merge status transition. None of that starts Lot 0.
