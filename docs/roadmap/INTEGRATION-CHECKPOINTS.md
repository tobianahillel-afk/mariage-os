# Mariage OS — Cross-Lot Integration Checkpoints

Status: **Normative development governance contract**

Purpose: force periodic full-product reviews during implementation so Mariage OS does not become a collection of individually passing features that no longer form one coherent product.

A checkpoint is stronger than a lot review. It re-checks **all implemented behavior so far** against the frozen V1 architecture, UX, security, data model and product goals.

No checkpoint-closing lot may be considered fully accepted until the checkpoint passes.

---

## Checkpoint groups

### Checkpoint A — Foundation & Core Decision Loop
**After Lots 0–3**

Scope:
- repository/tooling;
- identity/project/bootstrap;
- local-first/sync primitives;
- venues/facts/sources/media basics;
- tasks/decisions;
- navigation/shell/design primitives.

Primary question:
> Can two authorized partners safely research a venue, record trustworthy information, disagree independently, create actions/decisions, go temporarily offline, reconnect, and still understand what happened?

Must prove:
- project isolation/RLS foundation is real;
- app shell/navigation is usable on mobile + desktop;
- first complete vertical slice respects repository/service boundaries;
- source/evidence model is understandable in UX;
- local pending changes survive restart;
- no generic “mega-form” has become the default UI pattern;
- components/patterns introduced so far form a coherent design system;
- Feature Ledger for Lots 0–3 has no unexplained gap.

---

### Checkpoint B — Data Intake & Operational Planning Core
**After Lots 4–7**

Scope adds:
- import/export;
- budget/payments/scenarios;
- guests/households/seating basics;
- vendors/caterers;
- contract/document interactions relevant to these domains.

Primary question:
> Can the couple bring real planning data into Mariage OS safely, compare commercial options, manage people and money, and avoid returning to parallel spreadsheets for the core wedding domains?

Must prove:
- imports cannot silently destroy or duplicate truth;
- guest spreadsheet-style calculations reproduce expected reference figures;
- money/refund/deposit/tax semantics remain exact;
- venue/vendor/guest/budget navigation is still understandable rather than becoming table-driven clutter;
- shared cross-domain links work (vendor↔venue↔budget↔documents↔tasks);
- seating model does not violate RSVP/household integrity;
- personal data exposure is controlled in search/export/logging;
- mobile workflows remain usable despite increased domain density;
- Feature Ledger Lots 0–7 is reconciled.

---

### Checkpoint C — Product Control, Spatial UX & Offline Hardening
**After Lots 8–10**

Scope adds:
- Dashboard;
- Planning/milestones;
- event timeline;
- Search/Inbox integration;
- Map/access;
- mature PWA/offline/conflict behavior.

Primary question:
> Has Mariage OS become a coherent wedding operating system where the couple can understand, decide and act quickly, including on mobile and during temporary network loss?

Must prove:
- dashboard genuinely prioritizes instead of duplicating every module;
- one primary job per screen remains true;
- global Search/Inbox shorten workflows rather than add navigation confusion;
- planning milestones and wedding-day timeline remain distinct mental models;
- Map failure does not break access to venue data;
- each queueable offline workflow behaves according to the offline matrix;
- service-worker/update/local migration paths preserve pending work;
- conflict UX is understandable without database terminology;
- key cross-domain derived data is correctly invalidated/recomputed;
- reference performance and accessibility checks pass across the now-large product.

---

### Checkpoint D — Recovery, Real Data & V1 Cutover
**After Lots 11–12**

Scope:
- backup/restore;
- production hardening;
- real-data migration/reconciliation;
- final device acceptance;
- operational source-of-truth cutover.

Primary question:
> Can the couple trust Mariage OS with the real wedding and recover if the cloud, device, import, migration or user action goes wrong?

Must prove:
- portable backup→verify→restore succeeds;
- encrypted backup path succeeds where enabled;
- no real wedding data exists in public GitHub artifacts;
- RLS/Storage/security matrices are evidenced, not merely specified;
- legacy venue/guest/vendor data is reconciled;
- critical financial/guest/seating figures match trusted sources;
- both partners accept real phone/tablet/desktop UX;
- no source-of-truth ambiguity remains;
- no V1 release blocker remains;
- rollback/recovery path exists for cutover failure.

---

# Mandatory checkpoint review dimensions

Every checkpoint produces a versioned review report with each dimension marked:

- `PASS`
- `PASS_WITH_FOLLOW_UP` (only non-blocking, explicitly assigned issue)
- `FAIL`
- `NOT_APPLICABLE`

A vague “looks good” is not a result.

## 1. Product fidelity

Review:
- Feature Ledger vs V1 Scope;
- original Understand → Decide → Act objective;
- missing P0/P1 requirements;
- accidental scope growth;
- invented behavior not justified by spec/ADR;
- features technically built but not useful in the intended couple workflow.

## 2. UX architecture

Review as a UX designer, not only as QA:
- navigation depth;
- screen purpose;
- information hierarchy;
- page vs tab vs drawer/modal choices;
- progressive disclosure;
- number of competing primary actions;
- mobile flow length;
- table/card usage;
- form density;
- consistency of common patterns;
- discoverability of next action;
- empty/error/offline states;
- visual calm/readability.

Any screen that becomes an uncontrolled dump of available fields is a checkpoint finding.

## 3. Cross-feature coherence

Review:
- links between modules;
- duplicate concepts/state;
- inconsistent status vocabulary;
- duplicated data-entry requirement;
- stale read models;
- global Search/Inbox/activity behavior;
- Dashboard/Planning effects;
- correct navigation back to context.

## 4. Architecture integrity

Review:
- View → service → repository → local/sync → adapter boundaries;
- no scattered provider-specific calls;
- no new source-of-truth duplication;
- cloud/local schema parity for offline-supported behavior;
- migrations/versioning;
- Realtime as hint, not durability;
- storage lifecycle;
- dependency graph.

## 5. Security/privacy

Review:
- RLS allow/deny coverage;
- same-project constraints;
- private Storage;
- privilege transitions/RPCs;
- secrets/PII;
- URL/log/export privacy;
- session/logout/project-switch behavior;
- external content/file security;
- supply-chain changes.

Any cross-project data path is immediate `FAIL`.

## 6. Data integrity/domain rules

Review:
- invariants;
- state machines;
- money/date/null semantics;
- evidence/conflicts;
- external IDs;
- import idempotence;
- relationship integrity;
- derived data invalidation.

## 7. Local-first/offline

Review:
- queueable vs server-required classification;
- restart survival;
- reconnect;
- conflict;
- membership/session expiry;
- storage pressure;
- local schema migration;
- PWA update.

## 8. Testing/evidence

Review:
- Feature Records have evidence;
- acceptance IDs exercised;
- no important behavior covered only by unit tests;
- RLS deny cases;
- E2E mobile/desktop;
- accessibility;
- performance;
- mutation testing where required;
- migration/restore fixtures where applicable.

## 9. Documentation drift

Review:
- README/START-HERE/current phase;
- Feature Ledger statuses;
- requirements/acceptance IDs;
- routes/screens;
- schema/addenda;
- lot progress;
- deferred decisions;
- ADRs;
- no explanation existing only in chat/PR comments.

---

# Checkpoint report format

Create one report per checkpoint, for example:

`docs/reviews/CHECKPOINT-A-REPORT.md`

Required structure:

```text
Checkpoint: A
Commit reviewed: <sha>
Lots included: 0–3
Date:
Reviewer(s):
Overall result: PASS / FAIL

Dimension results:
- Product fidelity: PASS
- UX architecture: PASS
- Architecture integrity: PASS
...

Findings:
CHK-A-001 | MAJOR | UX | Venue detail has 4 competing primary CTAs | OPEN
CHK-A-002 | MINOR | Docs | old route name in NAVIGATION.md | RESOLVED

Feature ledger reconciliation:
- ACCEPTED: ...
- VERIFIED not integrated: ...
- BLOCKED: ...

Required fixes before next group:
...
```

Severity:
- `BLOCKING` — unsafe or fundamentally incompatible; no progress past checkpoint.
- `MAJOR` — material product/architecture/UX/security gap; must resolve before checkpoint PASS.
- `MINOR` — real issue but may be scheduled with owner/date if checkpoint remains safe.
- `NOTE` — observation/no required change.

---

# Progress rule

Checkpoint A must pass before Lot 4 begins as normal work.
Checkpoint B must pass before Lot 8 begins as normal work.
Checkpoint C must pass before Lot 11 production-readiness work proceeds.
Checkpoint D is the V1 cutover gate.

Emergency/foundational work may be performed to fix a failed checkpoint, but new downstream feature scope must not be used to hide unresolved architectural/product debt.

---

# Regression rule

A later checkpoint rechecks earlier guarantees. Passing Checkpoint A once does not permanently exempt project isolation, offline safety or UX architecture from later review.

If a later feature breaks an earlier guarantee, the earlier guarantee becomes open again and must be repaired before the current checkpoint passes.
