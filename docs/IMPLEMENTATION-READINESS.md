# Implementation Readiness Review

Status: **Final design-phase readiness checklist**

This document answers one question: *Can a developer with no prior conversation context begin implementing Mariage OS safely and consistently?*

## Readiness result

**Ready to begin Lot 0 once this documentation branch is reviewed and merged.**

This does not mean every future implementation detail is pre-decided. It means:

- product behavior is sufficiently specified;
- architecture boundaries are explicit;
- data semantics/invariants are explicit;
- security requirements are explicit;
- quality/release gates are explicit;
- V1 scope is explicit;
- implementation sequencing/lot exit criteria are explicit;
- deliberate future decisions are identified rather than hidden ambiguities.

## Product specification — PASS

Available:

- master product specification;
- product mission/jobs;
- hard constraints;
- explicit non-goals;
- V1 scope;
- module feature contracts;
- user flows;
- wireframes/navigation/interaction states;
- requirements catalog with stable IDs.

## Architecture — PASS

Available:

- cloud/frontend architecture;
- stack rationale;
- trust boundaries;
- source-of-truth/data ownership;
- local-first architecture;
- sync/offline contracts;
- PWA lifecycle;
- storage architecture;
- business dependency/invalidation graph;
- ADR decisions.

## Domain/data — PASS

Available:

- conceptual ERD;
- data-dictionary rules;
- IDs/external IDs/hashes;
- dates/time/timezone semantics;
- exact money semantics;
- lifecycle state machines;
- 50 core invariants;
- fact/source/provenance/confidence/freshness model;
- derived-data rules;
- deletion/retention;
- venue/vendor/guest/task/decision/budget/document/media domain contracts.

## Import/export — PASS

Available:

- supported formats;
- canonical JSON/open backup decision;
- mapping rules;
- duplicate detection;
- merge precedence;
- preview/non-destructive defaults;
- provenance;
- rollback;
- migration/cutover plan;
- round-trip expectations.

Implementation still needs concrete JSON Schema/XLSX template files in Lot 4; their semantics are already specified.

## Security/privacy — PASS for implementation start

Available:

- security architecture;
- threat model;
- Auth/MFA policy;
- RLS authorization contract;
- file security;
- frontend/CSP policy;
- privacy rules;
- supply-chain rules;
- OWASP ASVS 5.0 matrix framework;
- security test strategy;
- incident process.

Before production cutover, the ASVS matrix must contain implementation/test evidence rather than only planned controls.

## Quality/testing — PASS for implementation start

Available:

- layered testing strategy;
- 100% in-scope coverage policy;
- mutation testing policy;
- E2E strategy;
- synthetic/golden project data policy;
- security tests;
- accessibility contract;
- performance budgets;
- browser/device support policy;
- quality gates;
- release process.

Lot 0 must translate these documents into executable configs/scripts/workflows.

## Operations/recovery — PASS

Available:

- free-tier policy;
- backup policy;
- disaster recovery;
- diagnostics/observability;
- incident response;
- schema/local/import migration strategy;
- storage quota priority.

## Implementation plan — PASS

Available:

- ordered Lots 0–12;
- dependencies/goals;
- lot-specific deliverables;
- test/security expectations;
- objective exit criteria;
- real-data migration/cutover plan.

## Public-repository hygiene — PASS at documentation level

Repository policy explicitly prohibits production wedding data/secrets. Actual CI/pre-commit protections are delivered in Lot 0/secure-foundation work and must be green before real data cutover.

## Deliberately deferred implementation details

The following are **not specification gaps**; they are decisions intentionally made during named implementation lots because they depend on measured browser/runtime/tool behavior:

- exact npm package versions;
- final lint/formatter configuration details;
- exact supported browser minimum version numbers;
- exact visual palette/font stack within design/accessibility constraints;
- exact IndexedDB library/native abstraction choice;
- precise virtual-list implementation only if performance measurement requires it;
- concrete JSON Schema files/templates generated from the documented canonical semantics;
- final service-worker implementation technique;
- exact free-tier usage polling capabilities exposed by providers at implementation time.

These choices must not change the documented product/security/data behavior without ADR/spec update.

## Read-before-coding path

A new implementer should read:

1. `README.md`
2. `docs/START-HERE.md`
3. `docs/PRODUCT-SPECIFICATION.md`
4. `docs/REQUIREMENTS-CATALOG.md`
5. `docs/PRINCIPLES.md`
6. `docs/NON-GOALS.md`
7. `docs/architecture/*`
8. relevant `docs/domain/*`
9. `docs/security/*`
10. `docs/quality/*`
11. relevant `docs/features/*`
12. `docs/roadmap/V1-SCOPE.md`
13. `docs/roadmap/LOT-ACCEPTANCE.md`
14. `docs/engineering/DEFINITION-OF-DONE.md`
15. `CONTRIBUTING.md`

Then implement only the next unfinished lot.

## Definition of “documentation complete”

Design-phase documentation is complete when:

- all four documentation runs are merged;
- `START-HERE` and `INDEX` match the actual tree;
- no `pending future documentation batch` language remains incorrectly;
- V1 scope and lot acceptance are linked;
- deliberate open implementation choices are documented;
- no critical product behavior depends only on prior chat memory;
- repository review finds no real wedding data/secrets;
- Run 4 PR is reviewed for link/coherence issues.

After that point, improvements happen through implementation feedback and ADR/spec change, not indefinite pre-coding brainstorming.
