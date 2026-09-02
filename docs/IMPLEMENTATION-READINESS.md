# Implementation Readiness Review

Status: **DESIGN FROZEN; IMPLEMENTATION GATE CLOSED pending final architecture/product review**

This document answers whether a developer with no prior conversation context can begin implementation safely and consistently.

## Current result

**NOT YET AUTHORIZED TO START LOT 0.**

The V1 product/domain baseline is frozen and substantially implementation-ready, but the project is intentionally running one final cross-document architecture/product review before the gate opens.

The gate opens only when `FINAL-DESIGN-REVIEW.md` proves that:

- no known BLOCKING/MAJOR contradiction remains;
- frozen scope is consistently represented in product, routes, domain schema, local schema, security, tests and lots;
- all required V1 behaviors have a persistence/derived-data model where needed;
- every material external dependency/trust boundary has a failure/privacy/security contract;
- all high-risk transitions are testable;
- documentation entry points agree;
- the Run 4 PR is mergeable/reviewed and contains no private production data/secrets.

---

## What is already ready

### Product/scope

- frozen master product specification;
- V1/post-V1 boundary;
- stable requirements catalog;
- feature contracts;
- route/screen contracts;
- user flows/wireframes;
- critical acceptance scenarios;
- explicit deferred implementation choices.

### Architecture

- Cloudflare static frontend + Supabase architecture;
- TypeScript/Vite/no-React V1 decision;
- trust boundaries/data ownership;
- local-first/sync/offline model;
- PWA update lifecycle;
- Storage lifecycle;
- IndexedDB reference schema;
- repository/service/provider boundaries;
- dependency/invalidation rules;
- portability ADRs.

### Domain/data

- conceptual ERD;
- physical PostgreSQL V1 schema plus freeze addendum;
- same-project integrity policy;
- IDs/dates/time/money/state machines/invariants;
- facts/observations/multiple sources/value types;
- criterion definitions/evaluation;
- venue/vendor/guest/tasks/decisions/finance/documents models;
- date options, route origins/observations, ratings/preferences;
- structured seating;
- event timeline;
- named budget scenarios;
- Inbox/search support;
- document version/contract-readiness support;
- deletion/retention.

### Import/export/recovery

- CSV/XLSX/canonical JSON semantics;
- canonical V1 addendum;
- parent-scoped nested external IDs;
- mapping/dedup/merge/rollback;
- mapping profiles/tags/categories;
- portable `.mariage` format;
- encrypted-backup contract;
- migration/cutover strategy.

### Security/privacy

- controlled single-couple bootstrap;
- secure partner invitation semantics;
- MFA/session/re-authentication policy;
- PostgreSQL/Storage RLS contract and table matrix;
- same-project FK/link rules;
- file/frontend/privacy/supply-chain controls;
- threat model and ASVS framework;
- remote-content privacy controls;
- public-code/private-data policy.

### Quality/operations

- layered testing strategy;
- coverage + mutation policy;
- RLS/security/E2E/offline/backup/migration testing;
- accessibility/performance/browser contracts;
- free-tier behavior;
- disaster recovery/incident process;
- lots 0–12 with reconciled acceptance criteria.

---

## Final review still required

The final review must explicitly cross-check these dimensions rather than assume they are correct because documents exist:

1. **Product completeness** — every important couple workflow is represented and bounded.
2. **Scope coherence** — V1/post-V1 wording agrees everywhere.
3. **Navigation coherence** — every V1 feature has a discoverable route/flow and no orphan screen.
4. **Persistence completeness** — every durable behavior has storage semantics; derived values are not mistaken for source data.
5. **Relational integrity** — all project-owned relationships are same-project safe.
6. **RLS coverage** — every table/bucket/function has explicit allowed/denied operations.
7. **Local/cloud parity** — offline-capable entities/mutations can be represented in local schema/queue.
8. **Sync semantics** — every collaborative mutation class has merge/conflict/idempotence behavior.
9. **Import/export parity** — canonical schema/DB/domain identities align.
10. **Finance correctness** — scenario/tax/payment/refund/contract links agree.
11. **Guest/seating correctness** — probability/RSVP/household/seating invariants agree.
12. **Venue decision correctness** — blocking criteria, facts, access, offers and ratings remain distinct.
13. **Vendor/contract correctness** — offer/document/readiness semantics agree.
14. **Timeline/date correctness** — date candidates, timezone, after-midnight and fixed/relative deadlines agree.
15. **File/media lifecycle** — upload, dedup, derivatives, remote refs, versioning, purge and quota are complete.
16. **Backup/recovery** — format, encryption, restore, migration and destructive-operation recovery agree.
17. **Security/privacy** — threat model covers every entry point and privacy-sensitive external request.
18. **Free-tier sustainability** — no open signup, accidental large upload or provider behavior silently creates a paid-risk path.
19. **UX state completeness** — happy, loading, empty, offline, conflict, error, permission and destructive states are specified.
20. **Accessibility/mobile** — no V1 feature requires hover/pointer-only/desktop-only interaction.
21. **Testability** — every P0/P1 behavior can be objectively verified.
22. **Implementation sequencing** — every frozen feature belongs to a lot and no lot requires an undeclared future dependency.
23. **Operations/cutover** — project can safely become and cease being source of truth.
24. **Documentation precedence** — no old normative sentence contradicts the frozen baseline.
25. **Repository hygiene/mergeability** — no private artifacts, secrets or unresolved review/merge blockers.

---

## Gate rule

`FINAL-DESIGN-REVIEW.md` must contain a finding register with severity/status/evidence. The implementation gate can change to **OPEN** only when:

- all BLOCKING and MAJOR findings are resolved;
- remaining MINOR findings are either resolved or explicitly safe/non-semantic;
- master spec, requirements, V1 scope, screen contracts, lots and checklists agree;
- reviewer comments are resolved/responded to;
- final PR consistency/hygiene check passes;
- PR is merged into `main`.

After that, the first permitted implementation work is Lot 0. Until then, **do not write Lot 0 code**.
