# Implementation Readiness Review

Status: **Final design-phase readiness assessment**

This document answers one question: **Can a developer with no prior conversation context begin implementing Mariage OS safely and consistently?**

## Readiness result

**YES — ready to begin Lot 0 after this documentation branch is reviewed and merged.**

The specification is intentionally detailed enough that implementation does not need to reconstruct product intent from chat history.

This does not mean every package, pixel or implementation helper is pre-selected. It means:

- product behavior is specified;
- V1 boundary and non-goals are explicit;
- routes/screens and core workflows are specified;
- architecture boundaries are explicit;
- PostgreSQL and local-data reference schemas are explicit;
- domain semantics/invariants are explicit;
- source/evidence/conflict behavior is explicit;
- import/export/backup semantics are explicit;
- security/privacy requirements are explicit;
- test/quality/release gates are explicit;
- implementation lots have objective exit criteria;
- deliberate implementation-time choices are explicitly registered rather than hidden ambiguities.

---

## Product specification — PASS

Available:

- master product specification / cahier des charges;
- product mission and jobs-to-be-done;
- two-owner collaboration model;
- hard constraints including €0/month target;
- explicit non-goals;
- exact V1 scope and post-V1 backlog;
- feature contracts including Auth/Onboarding and Settings/Diagnostics;
- route/screen contracts;
- user flows;
- wireframes/navigation/design system/forms;
- 40 critical Given/When/Then acceptance scenarios;
- requirements catalog with stable P0/P1/P2 IDs.

No critical V1 behavior intentionally relies only on prior chat memory.

---

## Architecture — PASS

Available:

- cloud/frontend architecture;
- stack rationale;
- trust boundaries;
- source-of-truth/data ownership model;
- local-first interaction architecture;
- revision/idempotent sync/conflict contracts;
- offline policy;
- PWA/service-worker update lifecycle;
- Storage lifecycle/orphan/quota architecture;
- IndexedDB local working schema;
- repository/service/provider boundaries;
- business dependency/invalidation graph;
- portability principles;
- ADRs for the major architectural decisions.

Implementation may choose small helper libraries only within these contracts.

---

## Domain/data — PASS

Available:

- conceptual ERD;
- physical PostgreSQL V1 reference schema with tables/columns/constraints/index/RLS baseline;
- data-dictionary rules;
- IDs/external IDs/hashes;
- dates/time/timezone/after-midnight semantics;
- exact money semantics;
- lifecycle state machines;
- 50 core invariants;
- fact definitions/observations/sources/retained values;
- confidence/freshness/revalidation;
- default venue/caterer criteria registry and stable keys;
- derived-data rules/dependency graph;
- deletion/retention;
- venue/vendor/guest/task/decision/budget/document/media contracts.

Lot 1+ migrations implement rather than invent the physical schema.

---

## Import/export — PASS

Available:

- CSV semantics;
- XLSX semantics;
- canonical JSON v1 logical contract with normalized shapes;
- `.mariage` open backup architecture;
- mapping rules;
- locale parsing rules;
- duplicate detection;
- stable namespaced external IDs;
- evidence-aware merge precedence;
- preview/non-destructive defaults;
- protected fields;
- provenance/import history;
- rollback after subsequent edits;
- migration/cutover plan;
- round-trip requirements;
- export-missing/stale-research workflow.

Implementation still needs concrete machine-readable JSON Schema files and synthetic XLSX/CSV templates in Lot 4. Their semantics are no longer undefined.

---

## Security/privacy — PASS for implementation start

Available:

- security architecture;
- threat model;
- authentication/MFA/session policy;
- invitation/project-isolation behavior;
- PostgreSQL RLS authorization contract;
- Storage RLS/file security;
- XSS/CSP/security-header requirements;
- privacy/data-minimization policy;
- public-code/private-data ADR;
- supply-chain controls;
- OWASP ASVS 5.0 verification-matrix framework;
- security/adversarial test strategy;
- incident/vulnerability-reporting process.

Before production cutover the ASVS matrix must contain actual implementation/test evidence, not merely planned control mappings.

---

## Quality/testing — PASS for implementation start

Available:

- layered unit/property/integration/database/RLS/security/E2E strategy;
- 100% lines/statements/functions/branches policy for defined in-scope business code;
- mutation testing of critical engines;
- synthetic/golden project fixture strategy;
- 40 high-level acceptance scenarios;
- accessibility contract;
- browser/device support tiers;
- performance budgets/reference project sizes;
- offline/reconnect/session-expiry tests;
- import/rollback/round-trip tests;
- backup/restore/migration tests;
- release Quality Gates.

Lot 0 translates these specifications into executable configs/scripts/workflows.

---

## Engineering/process — PASS

Available:

- coding standards;
- application/service/repository/provider boundaries;
- error taxonomy/recovery UX;
- diagnostics without behavioral tracking;
- DB/IndexedDB/import/backup migration policy;
- CI/CD policy;
- release process;
- Definition of Done;
- requirement traceability process;
- contributing guide;
- ADR process;
- explicit deferred-decision register.

---

## Operations/recovery — PASS

Available:

- free-tier/no-surprise-cost policy;
- quota priority behavior;
- backup policy;
- open portable recovery format;
- disaster recovery;
- storage garbage collection;
- diagnostics/integrity checking;
- incident response;
- cloud-outage degradation;
- existing-data migration and source-of-truth cutover plan.

---

## Implementation plan — PASS

Available:

- ordered implementation Lots 0–12;
- lot dependencies/goals;
- per-lot deliverables;
- per-lot test/security requirements;
- objective exit criteria;
- V1 release blockers;
- cutover evidence package;
- controlled post-V1 promotion process.

**The next implementation action after merge is Lot 0, not feature UI.**

---

## Public-repository hygiene — PASS at specification level

- public-code/private-data policy is explicit;
- `.gitignore` blocks common private artifacts as defense-in-depth;
- contributing/security docs prohibit production PII/secrets;
- public fixtures must be synthetic;
- secret/PII scanning is required in Lot 0/CI.

Repository privacy is not relied upon for runtime data security.

---

## Deliberately deferred implementation details

These are **not specification gaps**; they are intentionally assigned to named implementation lots and recorded in `DEFERRED-DECISIONS.md`:

- exact npm/package versions;
- final lint/formatter package selection;
- exact supported browser minimum version numbers;
- exact visual palette/font stack within accessibility/design constraints;
- IndexedDB helper library vs native abstraction;
- concrete parser packages;
- concrete JSON Schema validator;
- service-worker helper/manual implementation;
- virtual-list implementation only if measured need exists;
- exact provider quota usage data obtainable safely at implementation time.

None of these may change documented product/security/data semantics silently.

---

## Mandatory no-context reading path

1. `README.md`
2. `docs/START-HERE.md`
3. `docs/PRODUCT-SPECIFICATION.md`
4. `docs/REQUIREMENTS-CATALOG.md`
5. `docs/roadmap/V1-SCOPE.md`
6. `docs/architecture/*` + applicable ADRs
7. relevant `docs/domain/*`
8. relevant `docs/security/*`
9. relevant `docs/quality/*`
10. relevant `docs/features/*`
11. `docs/roadmap/LOT-ACCEPTANCE.md`
12. `docs/engineering/DEFINITION-OF-DONE.md`
13. `CONTRIBUTING.md`

Then implement only the next unfinished lot.

---

## Documentation completeness evidence

See `DOCUMENTATION-COMPLETENESS-CHECKLIST.md`.

The design phase is considered complete when:

- all four documentation runs are merged;
- README/START-HERE/INDEX match the actual tree;
- the completeness checklist is reviewed;
- deliberate open choices are registered;
- no known critical internal contradiction remains;
- public-repository review finds no real wedding data/secrets.

After that point, the project should **stop indefinite pre-code brainstorming**. New discoveries are handled through normal versioned specification/ADR updates triggered by implementation, tests or real couple usage.
