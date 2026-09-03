# Requirements and Feature Traceability

Status: **Normative implementation-verification process**

Sources:

- requirements: [`../REQUIREMENTS-CATALOG.md`](../REQUIREMENTS-CATALOG.md);
- feature capabilities: [`../FEATURE-LEDGER.md`](../FEATURE-LEDGER.md);
- feature implementation process: [`IMPLEMENTATION-PLAYBOOK.md`](IMPLEMENTATION-PLAYBOOK.md);
- current progress: [`../roadmap/IMPLEMENTATION-STATUS.md`](../roadmap/IMPLEMENTATION-STATUS.md).

The purpose of traceability is to ensure no important behavior exists only in chat memory, no P0/P1 requirement remains a paper statement, and no feature is declared done without evidence across all relevant layers.

## Requirement prefixes

Use catalog prefixes exactly:

- `PRD-` product/collaboration
- `IAM-` identity/project isolation
- `SYN-` local-first/synchronization
- `PWA-` PWA/offline lifecycle
- `VEN-` venues
- `FAC-` facts/provenance/confidence
- `VND-` vendors
- `GST-` guests/households/seating
- `TSK-` tasks
- `DEC-` decisions
- `FIN-` budget/payments
- `PLN-` planning/timeline
- `MED-` documents/media/storage/contracts
- `CAP-` Inbox/search/capture
- `IMP-` import/export
- `BAK-` backup/migration/recovery
- `SEC-` security/privacy
- `QLT-` quality/testing
- `UX-` UX/accessibility
- `OPS-` free-tier/operations

IDs are stable. Do not reuse a retired ID for different behavior.

Feature IDs use `FTR-xxx` and are stable once implementation begins.

---

## Three traceability layers

### 1. Requirement layer
Answers: **What must be true?**

Example: `FAC-004` — weaker imported evidence cannot silently replace stronger contractual truth.

### 2. Feature layer
Answers: **Which user/system capability realizes that requirement?**

Example: `FTR-020` multi-source observations + `FTR-040` evidence-aware merge.

### 3. Evidence layer
Answers: **What code/schema/tests/review proves it?**

Example:
- FactService/merge engine;
- facts/observations schema/RLS;
- import merge tests;
- acceptance scenario;
- PR/release evidence.

A requirement may map to several features and a feature may satisfy several requirements.

---

## Requirement lifecycle

A requirement moves through:

1. `Specified` — documented in catalog and detailed contract.
2. `Mapped` — linked to one or more Feature IDs/cross-cutting controls.
3. `Implemented` — necessary code/schema exists.
4. `Verified` — required objective evidence passes.
5. `Released` — included in accepted production release.

P0/P1 cannot be `Verified` solely because code exists.

---

## Feature lifecycle

Use the lifecycle defined by Implementation Playbook:

`SPECIFIED → READY → IN_PROGRESS → IMPLEMENTED → VERIFIED → INTEGRATED → ACCEPTED`

Feature status and requirement status are related but not identical.

A feature may be `VERIFIED` while a requirement spanning another incomplete feature is not yet fully `Verified`.

---

## Traceability record

Implementation must make it possible to produce rows such as:

| Requirement | Feature | Detailed spec/UX | Lot/PR | Code/schema | Test/evidence | Security | Status |
|---|---|---|---|---|---|---|---|
| IMP-003 | FTR-039/040/042 | MERGE + DEDUP | Lot 4 / PR X | ImportService | idempotent reimport E2E | n/a | Verified |
| UX-001 | FTR-017 | Venue blueprint | Lot 2 / PR Y | VenueDetail | desktop/mobile UX review | accessibility | Verified |

The live matrix may be Markdown or generated from repository metadata after Lot 0, but it must remain readable/exportable without proprietary tooling.

---

## Feature Implementation Record traceability

Every FIR contains at minimum:

- Feature ID;
- Requirement IDs;
- Acceptance IDs;
- User Flow;
- routes/screens;
- domain entities/invariants;
- services/repositories;
- cloud/local persistence;
- offline class;
- authorization/security;
- tests/evidence;
- UX review evidence;
- status.

If a reviewer cannot follow a feature from user need to test evidence using repository artifacts, traceability is incomplete.

---

## PR requirements

A feature PR lists:

```text
Features: FTR-019, FTR-020
Requirements: FAC-002, FAC-004, VEN-005
Acceptance: ACC-009, ACC-010
User flows: UF-04
Lot: 2
```

And identifies:
- routes/UX pattern affected;
- data/migration impact;
- security/RLS impact;
- offline/sync impact;
- import/export impact;
- derived-data impact;
- tests and visual evidence.

Reviewers verify that no new production behavior is hidden outside this mapping.

---

## Test naming

For critical behavior, include Requirement/Acceptance IDs where practical:

```text
IMP-003 reimporting the same externalId is idempotent
SEC-003 cross-project venue SELECT is denied
FIN-005 guest-count change recomputes scenario without changing quote history
ACC-061 seating concurrent move resolves safely
```

One test can support multiple requirements; one requirement commonly needs multiple tests/layers.

---

## UX traceability

User-facing features also map to:

- `UX-ARCHITECTURE.md` screen type;
- `SCREEN-BLUEPRINTS.md` composition;
- route in `SCREEN-CONTRACTS.md`;
- `UX-REVIEW-CHECKLIST.md` result;
- synthetic desktop/mobile evidence.

A requirement like “venue comparison exists” is not satisfied by any arbitrary table that happens to contain venue columns; the intended UX contract is part of implementation truth.

---

## Security traceability

Applicable security requirements link to:

- threat(s) from `security/THREAT-MODEL.md`;
- ASVS item(s);
- RLS/RPC/storage policy;
- direct allow/deny/adversarial tests;
- release-blocker status when failing.

---

## Migration traceability

If a requirement/feature changes stored semantics, record:

- DB/local/import/backup schema impact;
- migration;
- old fixture compatibility test;
- export/import compatibility;
- rollback/recovery;
- affected Feature IDs.

---

## No orphan implementation

A significant production behavior must not appear without:

- Requirement ID or accepted cross-cutting rule;
- Feature ID;
- governing spec/UX contract;
- lot assignment;
- tests/evidence;
- security/data/offline implications considered.

A new UI control that changes business state is not “just UI” and requires traceability.

---

## No paper-only V1 requirements/features

Before a lot/checkpoint/V1 cutover:

- all elapsed-lot Feature IDs are reconciled;
- every applicable P0/P1 is `Verified` or explicitly outside the current gate because a mapped future lot remains unimplemented;
- no P0/P1 in an elapsed lot remains “assumed done”.

At final V1 cutover every applicable P0/P1 must be objectively verified or formally removed/deferred through accepted scope change.

---

## Checkpoint reconciliation

Each cross-lot checkpoint must compare:

1. Feature Ledger rows for elapsed lots;
2. requirements mapped to those features;
3. actual code/schema/routes;
4. automated/manual evidence;
5. UX review evidence;
6. current Implementation Status.

Any mismatch becomes a checkpoint finding.

---

## Documentation-only phase

Before Lot 0:

- requirements are `Specified`;
- Feature IDs are `SPECIFIED`;
- implementation evidence is absent by design;
- `IMPLEMENTATION-STATUS.md` records the gate CLOSED.

Lot 0 later establishes executable CI/test metadata conventions but must preserve this traceability model rather than replacing it with an opaque external tracker.
