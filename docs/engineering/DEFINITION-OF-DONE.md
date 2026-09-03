# Definition of Done

Status: **Normative implementation completion contract**

This document defines when work is considered complete. “It works on my machine”, “the UI exists”, “coverage is 100%”, “most fields are present” or “the agent says it is done” are not sufficient.

A V1 feature follows the lifecycle and Feature Implementation Record rules in `IMPLEMENTATION-PLAYBOOK.md` and is tracked by the union of `../FEATURE-LEDGER.md` (FTR-001..104) and `../FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md` (FTR-105..120).

AI-executed Lots additionally follow `AI-LOT-ORCHESTRATION.md`. A Lot requested by the user is not one AI work unit; it is decomposed into bounded Work Packets with mandatory three-pass acceptance.

---

## Feature-level Definition of Done

A feature may reach `ACCEPTED` only when all applicable items below are satisfied.

### Identity / traceability

- Feature ID exists and status is accurate;
- Feature Implementation Record is complete;
- applicable Requirement/Acceptance/User Flow IDs are linked;
- applicable `SEC-*` / `AUTHZ-*` / guest-communication IDs are linked;
- lot assignment/current-lot responsibility is correct;
- Work Packet evidence is linked when implementation is AI-orchestrated;
- no required `TBD` remains outside an explicitly allowed deferred choice;
- no important implementation rationale exists only in chat/PR comments;
- a context-free contributor can locate the owning modules/tests from repository records.

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
- route/navigation matches navigation/route contracts;
- major screen composition matches `SCREEN-BLUEPRINTS.md` or an approved equivalent/addendum pattern;
- one primary user job is clear;
- summary/detail/evidence hierarchy is preserved;
- page is not an uncontrolled mega-form/table/admin CRUD surface;
- desktop behavior is verified;
- narrow mobile behavior is verified;
- tablet behavior is reasonable where materially different;
- loading/empty/partial/offline/pending/conflict/error/permission states are handled as applicable;
- Back/context preservation is correct where applicable;
- keyboard/accessibility basics are verified;
- errors are actionable/human-readable;
- no critical action depends on color alone;
- frozen visual/domain color identity is respected;
- QIF passes where applicable;
- major user-facing PR includes synthetic desktop/mobile visual evidence;
- UX/visual review has no unresolved BLOCKING/MAJOR finding.

A technically functional screen that clearly looks like generic database administration is not Done.

### Architecture / implementation

- implementation follows `CODEBASE-STRUCTURE.md`;
- implementation follows View/UI → application/domain → ports ← infrastructure, wired by composition root;
- direct provider calls are not scattered through UI/domain/application code;
- no duplicate parallel architectural path was introduced;
- no circular dependency exists;
- canonical naming/folder ownership is respected;
- TypeScript strict mode passes;
- no unexplained unsafe type escape exists in critical business logic;
- validation is implemented at trust boundaries;
- domain behavior is not duplicated across screens/services;
- authorization is not delegated solely to frontend code;
- cloud/local representations agree for offline-capable behavior;
- migrations exist where schema semantics change;
- destructive behavior is explicit/recoverable according to policy.

### Maintainability / code-size gate

- file/function/complexity/nesting/parameter rules in `MODULE-SIZE-COMPLEXITY.md` pass;
- no unexplained file > hard default threshold;
- no unexplained function > hard default threshold;
- no god service/class or dumping-ground `utils.ts`/`helpers.ts` pattern;
- no untracked TODO/FIXME/HACK/TEMP;
- any size/complexity exception is explicit, justified and approved;
- static boundary/cycle/dead-code checks pass where tooling exists.

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
- local schema/PWA updates do not erase pending work;
- project/account switches cannot leak cached data.

### Tests

All applicable tests exist and pass:

- unit/domain;
- branch/error-path;
- property-based where valuable;
- mutation testing where required;
- integration;
- IndexedDB/local migration;
- database/RLS allow + deny;
- capability/provider/webhook tests where applicable;
- security/adversarial;
- import/export/round-trip;
- offline/sync;
- migration;
- backup/restore;
- E2E;
- accessibility;
- performance/reference data where applicable;
- static architecture/complexity/dead-code checks.

Coverage policy is defined separately; in-scope business code targets 100% thresholds for statements, branches, functions and lines. Coverage never substitutes for behavior/security/UX evidence.

### Security/privacy

- no new exploitable Critical/High vulnerability is accepted;
- no secret/personal production data added to Git;
- RLS/storage policies updated and deny tests added when access changes;
- same-project relational integrity remains enforced;
- permission/relationship/strong-auth/capability rules remain correct;
- input handling follows centralized runtime validation policy;
- SQL/query construction follows safe parameterization/allowlist rules;
- file/input handling follows allowlist/validation policy;
- no raw executable user content introduced;
- security headers/CSP remain compatible;
- threat model/ASVS traceability updated when materially affected;
- external links/media requests obey privacy rules;
- logs/diagnostics/URLs avoid unnecessary PII;
- no new security-review trigger remains unreviewed.

### Documentation / progress / handoff state

- governing feature/product/UX/docs updated;
- architecture/ADR updated if needed;
- schema/import contracts updated if needed;
- Requirement/Feature/Acceptance/Security matrices remain accurate;
- applicable Feature Ledger status updated;
- Work Packet/pass status updated while the lot is active;
- `IMPLEMENTATION-STATUS.md` updated when material progress changes;
- changelog/release notes updated when user-facing/release-relevant;
- checkpoint report updated if work closes/affects a checkpoint;
- a context-free agent can determine the next permitted action without chat history.

### CI

The complete required verification pipeline passes from a clean environment. Required checks may not be bypassed for convenience.

---

## Work Packet Definition of Done

A Work Packet may reach `ACCEPTED` only when:

- its scope/Feature/current-lot responsibilities are explicit;
- its complexity/sizing review passes `AI-LOT-ORCHESTRATION.md`;
- Pass A implementation completed the intended vertical slice;
- Pass B adversarial review reconstructed expectations from repository contracts rather than relying only on the author's summary;
- all BLOCKING/MAJOR Pass B findings are resolved and affected evidence rerun;
- Pass C mechanically reconciles `EXPECTED vs IMPLEMENTED vs VERIFIED` for every packet responsibility;
- applicable FIRs, tests, docs and status records are current;
- no hidden stub/TODO/temporary architecture remains;
- downstream prerequisites/next action are explicit.

A packet cannot self-promote directly from `IN_PROGRESS` to `ACCEPTED`.

---

## Lot Definition of Done

A lot is not complete merely because its main screens exist or because the implementing agent says the Lot is finished.

Before lot acceptance:

- a complete Lot Coverage Matrix exists;
- every required current-lot Feature/control responsibility is assigned to at least one Work Packet;
- every required Work Packet is `ACCEPTED` through Pass A/B/C;
- mechanical reconciliation of required vs accepted/evidenced responsibilities is empty;
- no required Feature ID remains unexplained for responsibility that should have elapsed in the Lot;
- applicable features are at least `INTEGRATED`, normally `ACCEPTED` according to lot contract;
- a separate Lot Integration Pass verifies important cross-packet end-to-end/derived/invalidation workflows;
- lot-specific base + addendum tests/exit criteria pass;
- UX/QIF/visual review covers representative screens/workflows;
- code architecture/maintainability metrics show no unexplained drift;
- security/RLS/data/offline guarantees from prior lots still pass;
- no unrelated packet remains partially `IN_PROGRESS`;
- documentation/system scorecard is rechecked when lot closes a checkpoint group;
- Implementation Status records the completed packet plan, reconciliation and next permitted action.

If the lot closes a checkpoint group, the lot remains in `CHECKPOINT_REVIEW` until the checkpoint report passes.

---

## Cross-lot checkpoint Definition of Done

At Checkpoints A/B/C/D:

- checkpoint report exists;
- all elapsed-lot Feature IDs/current-lot responsibilities reconciled;
- relevant Work Packet/Lot acceptance evidence exists;
- product/UX/architecture/security/data/offline/testing/docs/maintainability dimensions reviewed;
- `reviews/DOCUMENTATION-SYSTEM-SCORECARD.md` is repeated/updated using implemented evidence;
- regressions of earlier guarantees rechecked;
- no critical score below 9.0 without an explicit finding/remediation;
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
- major architecture drift/circular dependency that undermines frozen boundaries;
- major UX/navigation defect that makes a core V1 workflow materially unusable on supported mobile/desktop devices.

---

## V1 exit criteria

Before V1 becomes operational source of truth for the real wedding:

1. Two separate owners can securely access one project.
2. Venue data can be created, edited, sourced, compared, rejected/restored and tracked historically.
3. Tasks, decisions, budget, vendors, guests, invitations/RSVP/communications, seating, planning and timeline meet V1 acceptance criteria.
4. Import preview/merge/rollback works for supported formats.
5. Offline supported workflows survive restart and later synchronize safely.
6. RLS/capability denial tests confirm one project/household cannot access another.
7. Complete project backup exports, validates and restores into safe target.
8. Supported old schema fixtures migrate successfully.
9. Critical E2E flows pass on supported desktop/mobile browser profiles.
10. Code architecture/boundary/complexity gates are green with no unexplained systemic exception pattern.
11. Every implementation Lot has complete packet/reconciliation/integration evidence.
12. Checkpoints A/B/C pass before production-readiness stage.
13. Checkpoint D final cutover review passes.
14. Product is tested with synthetic/beta data before real-data migration.
15. Real-data migration/reconciliation is complete.
16. Both partners accept UX on their real supported devices.
17. A recovery/export exists before Mariage OS becomes the operational source of truth.

---

## Documentation completeness rule

If a developer/LLM with no conversation history cannot determine from the repository:

- whether work is currently permitted;
- what a feature should do;
- which Lot and Work Packet/pass owns the current work;
- where it lives in UX;
- where its code should physically live;
- what that code may depend on;
- what size/complexity rules apply;
- what data/security/offline rules apply;
- what tests/evidence prove it;
- what remains incomplete;
- what next work is permitted;

then the feature/project is not fully documented.