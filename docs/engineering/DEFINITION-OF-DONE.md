# Definition of Done

Status: **Normative implementation completion contract**

This document defines when work is considered complete. “It works on my machine”, “the UI exists”, “coverage is 100%”, or “most fields are present” are not sufficient.

A V1 feature follows the lifecycle and Feature Implementation Record rules in `IMPLEMENTATION-PLAYBOOK.md` and is tracked by `../FEATURE-LEDGER.md`.

---

## Feature-level Definition of Done

A feature may reach `ACCEPTED` only when all applicable items below are satisfied.

### Identity / traceability

- Feature ID exists and status is accurate;
- Feature Implementation Record is complete;
- applicable Requirement IDs are linked;
- applicable Acceptance IDs/User Flow IDs are linked;
- lot assignment is correct;
- no required `TBD` remains outside an explicitly allowed deferred choice;
- no important implementation rationale exists only in chat/PR comments.

### Specification

- behavior is documented;
- primary user job is documented;
- route/surface is documented;
- user-visible states are documented;
- data/state transitions are documented;
- acceptance criteria exist;
- failure and edge cases are specified;
- privacy/security implications are reviewed;
- offline/sync implications are reviewed;
- import/export/backup implications are reviewed where applicable;
- derived-data/invalidation consequences are known.

### UX / navigation / visual quality

- screen pattern matches `UX-ARCHITECTURE.md`;
- route/navigation matches `NAVIGATION.md` and `ROUTE-FEATURE-MATRIX.md`;
- major screen composition matches `SCREEN-BLUEPRINTS.md` or an approved equivalent pattern;
- one primary user job is clear;
- summary/detail/evidence hierarchy is preserved;
- page is not an uncontrolled mega-form/table/admin CRUD surface;
- desktop behavior is verified;
- narrow mobile behavior is verified;
- tablet behavior is reasonable where materially different;
- loading/empty/partial/offline/pending/conflict/error/permission states are handled as applicable;
- Back/context preservation is correct where applicable;
- keyboard/accessibility basics are verified;
- errors are actionable and human-readable;
- no critical action depends on color alone;
- major user-facing PR includes synthetic desktop/mobile visual evidence;
- `UX-REVIEW-CHECKLIST.md` has no unresolved BLOCKING/MAJOR finding.

A technically functional screen that clearly looks like generic database administration is not Done.

### Architecture / implementation

- implementation follows View → service/domain → repository/local/sync → provider boundaries;
- direct provider calls are not scattered through UI/domain code;
- TypeScript strict mode passes;
- no unexplained unsafe type escape exists in critical business logic;
- validation is implemented at appropriate boundaries;
- domain behavior is not duplicated across screens;
- authorization is not delegated solely to frontend code;
- cloud and local representations agree for offline-capable behavior;
- migrations exist where schema semantics change;
- destructive behavior is explicit/recoverable according to policy.

### Data integrity

- applicable invariants are enforced/tested;
- same-project relationships cannot be forged;
- source vs derived data is not duplicated ambiguously;
- null/unknown/conflict semantics remain correct;
- money/date/time semantics remain correct;
- state-machine transitions cannot be bypassed through generic update where protected transition is required;
- import identity/protected evidence semantics remain correct when affected.

### Offline / synchronization

Where applicable:

- offline class is explicit;
- eligible edit is durably local before user-visible local success;
- pending operation survives restart;
- retry is idempotent;
- session expiry preserves local pending work;
- conflict behavior is defined/tested;
- server-required protected action cannot be falsely presented as finalized offline;
- local schema/PWA updates do not erase pending work.

### Tests

All applicable tests exist and pass:

- unit/domain;
- branch/error-path;
- property-based where valuable;
- mutation testing where required;
- integration;
- IndexedDB/local migration;
- database/RLS allow + deny;
- security/adversarial;
- import/export/round-trip;
- offline/sync;
- migration;
- backup/restore;
- E2E;
- accessibility;
- performance/reference data where applicable.

Coverage policy is defined separately; in-scope business code targets 100% thresholds for statements, branches, functions and lines. Coverage never substitutes for behavior/security/UX evidence.

### Security/privacy

- no new exploitable Critical/High vulnerability is accepted;
- no secret/personal production data added to Git;
- RLS/storage policies updated and deny tests added when access changes;
- same-project relational integrity remains enforced;
- file/input handling follows allowlist/validation policy;
- no raw executable user content introduced;
- security headers/CSP remain compatible;
- threat model/ASVS traceability updated when materially affected;
- external links/media requests obey privacy rules;
- logs/diagnostics/URLs avoid unnecessary PII.

### Documentation / progress state

- governing feature/product/UX docs updated;
- architecture/ADR updated if needed;
- schema/import contracts updated if needed;
- Requirement/Feature/Acceptance matrices remain accurate;
- Feature Ledger status updated;
- `IMPLEMENTATION-STATUS.md` updated when material progress changes;
- changelog/release notes updated when user-facing/release-relevant;
- checkpoint report updated if work closes/affects a checkpoint.

### CI

The complete required verification pipeline passes from a clean environment. Required checks may not be bypassed for convenience.

---

## Lot Definition of Done

A lot is not complete merely because its main screens exist.

Before lot acceptance:

- all required Feature IDs assigned to the lot are reconciled;
- no required Feature ID remains unexplained `SPECIFIED`, `READY`, `IN_PROGRESS`, `IMPLEMENTED` or `BLOCKED`;
- applicable features are at least `INTEGRATED`, normally `ACCEPTED` according to lot contract;
- lot-specific tests/exit criteria pass;
- UX review covers representative screens/workflows;
- security/RLS/data/offline guarantees from prior lots still pass;
- Implementation Status is updated.

If the lot closes a checkpoint group, the lot remains in `CHECKPOINT_REVIEW` until the checkpoint report passes.

---

## Cross-lot checkpoint Definition of Done

At Checkpoints A/B/C/D:

- checkpoint report exists;
- all elapsed-lot Feature IDs reconciled;
- product/UX/architecture/security/data/offline/testing/docs dimensions reviewed;
- regressions of earlier guarantees rechecked;
- no unresolved BLOCKING/MAJOR finding remains;
- Implementation Status records checkpoint PASS;
- only then may the next normal lot group proceed.

See `../roadmap/INTEGRATION-CHECKPOINTS.md`.

---

## Release blockers

The following block release/cutover regardless of schedule:

- known data loss or silent corruption path;
- cross-project authorization/reference leak;
- broken RLS/Storage policy on private data;
- secret/private-data exposure;
- incorrect supported financial/guest/seating calculation;
- broken or misleading offline confirmation semantics;
- backup that cannot be validated/restored;
- migration that breaks supported existing data;
- critical offline queue losing pending work;
- unresolved exploitable Critical/High security vulnerability;
- required CI gate failing;
- unresolved BLOCKING/MAJOR checkpoint finding;
- major UX/navigation defect that makes a core V1 workflow materially unusable on supported mobile/desktop devices.

---

## V1 exit criteria

Before V1 becomes operational source of truth for the real wedding:

1. Two separate owners can securely access one project.
2. Venue data can be created, edited, sourced, compared, rejected/restored and tracked historically.
3. Tasks, decisions, budget, vendors, guests, seating, planning and timeline meet V1 acceptance criteria.
4. Import preview/merge/rollback works for supported formats.
5. Offline supported workflows survive restart and later synchronize safely.
6. RLS denial tests confirm one project cannot access another.
7. Complete project backup exports, validates and restores into safe target.
8. Supported old schema fixtures migrate successfully.
9. Critical E2E flows pass on supported desktop/mobile browser profiles.
10. Checkpoints A/B/C pass before production-readiness stage.
11. Checkpoint D final cutover review passes.
12. Product is tested with synthetic/beta data before real-data migration.
13. Real-data migration/reconciliation is complete.
14. Both partners accept UX on their real supported devices.
15. A recovery/export exists before Mariage OS becomes the operational source of truth.

---

## Documentation completeness rule

If a developer with no conversation history cannot determine from the repository:

- what a feature should do;
- where it lives in UX;
- what data/security/offline rules apply;
- what tests/evidence prove it;
- what remains incomplete;
- what next work is permitted;

then the feature/project is not fully documented.
