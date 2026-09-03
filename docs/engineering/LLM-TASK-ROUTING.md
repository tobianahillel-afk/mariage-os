# LLM / Context-Free Task Routing Matrix

Status: **Normative context-routing aid**

Purpose: let an AI agent or developer read the *minimum sufficient* authoritative context for a task instead of loading the entire documentation tree and losing precedence.

`AGENTS.md` remains the root instruction file. `docs/START-HERE.md` remains the full onboarding map.

---

## Universal first reads

For every material task:

1. `docs/roadmap/IMPLEMENTATION-STATUS.md`
2. `AGENTS.md`
3. `docs/V1-FROZEN-MANIFEST.md`
4. relevant Feature ID(s) / Requirement ID(s)
5. current lot/checkpoint contract

If implementation gate is closed, do not write feature code.

If the user requests an entire Lot, `docs/engineering/AI-LOT-ORCHESTRATION.md` is mandatory before implementation.

---

## Routing table

| Task type | Must read | Usually also read | Required durable output |
|---|---|---|---|
| **Whole Lot (`Do/Fais Lot N`)** | AI Lot Orchestration, Implementation Playbook, DoD, LOTS, base + addendum Lot Acceptance, both Feature Ledgers | dependency graph, quality/security contracts for the Lot | Lot Coverage Matrix + Work Packet plan/records + current packet/pass status + Lot reconciliation + integration/acceptance evidence |
| New feature | relevant Feature Ledger row, feature contract, requirements, acceptance scenarios, FIR template | UX, domain, security, offline, import docs | FIR + code/tests + ledger/status update |
| UI screen/change | UX Architecture, Screen Blueprint/Contract, Design System, feature contract | Navigation, color/motion, accessibility | screenshots/evidence + UX review |
| Domain rule | domain context doc, invariants, state machines, data dictionary | derived-data/dependency graph | unit/property tests + requirement trace |
| DB schema | physical schema + addenda, invariants, RLS mapping, migrations | ERD, authorization | migration + DB/RLS tests |
| RLS/permissions | security README, authz model, permission matrix, RLS matrix | threat model, privileged ops | allow/deny tests + security evidence |
| Auth/session | Authentication, Auth Hardening, Bootstrap Invitations | public abuse, privileged ops | Auth config evidence + E2E/security tests |
| Offline/sync | Local-First, Sync, Offline, Local Data Schema | PWA Lifecycle, dependency graph | restart/reconnect/conflict tests |
| Import | Import formats/schema/mapping/dedupe/merge/rollback | domain semantics, file security | hostile fixtures + preview/round-trip tests |
| Backup/restore | backup format, backups, disaster recovery, migrations | file security, crypto/security baseline | restore/integrity/migration evidence |
| Finance | Money, Budget/Payments, budget feature | import merge/protected truth | exact arithmetic/property tests |
| Guests/seating | Guests, Seating, invariants; guest communication contracts when RSVP/contact affected | import migration, privacy | probability/seating/RSVP tests |
| Venues/facts | Venues, Facts/Sources, criteria docs | media/access/import | fact/provenance/criteria tests |
| Vendor/contracts | Vendors, Documents/Media, Contract Readiness | finance, security | lifecycle/readiness/version tests |
| Search/read model | feature contract + permission mapping + dependency graph | performance, privacy | authorization/performance tests |
| Security hardening | `docs/security/README.md` full relevant path | ASVS/security testing | SEC/AUTHZ evidence |
| Tooling/lint | Lot 0, Coding Standards, Codebase Structure, Module Limits, Quality Gates | CI/CD, supply chain | reproducible config + verify command |
| Dependency addition | Supply Chain + Coding Standards | bundle/performance/CSP/privacy | dependency justification |
| Refactor | owning Feature IDs, Coding Standards, Codebase Structure | tests/acceptance | no semantic drift + existing tests green |
| Bug fix | owning Feature/Requirement/Acceptance + regression location | domain/security depending on bug | failing regression first + fix/evidence |
| Migration | Migrations + affected schema/local/import/backup contract | rollback/recovery | old-fixture compatibility test |
| Release/cutover | Release Process, Definition of Done, checkpoints | security/public/free-tier/backup | release evidence package |
| Documentation change | governing normative doc + precedence | index/start-here if discoverability changes | audit/traceability consistency |

---

## Whole-Lot execution rule

A Lot is a product milestone and user command boundary, not a normal LLM context window.

When the user requests `Do Lot N`:

1. compute the complete current-lot Feature/control inventory;
2. build dependency-aware bounded Work Packets;
3. validate that every required responsibility is packet-assigned;
4. default to one Work Packet `IN_PROGRESS` at a time;
5. run each packet through Pass A IMPLEMENT, Pass B ADVERSARIAL REVIEW, Pass C ACCEPTANCE;
6. persist current Lot/packet/pass so a cold-start agent can resume;
7. after all packets, require `required responsibilities - accepted/evidenced responsibilities = ∅`;
8. run a separate Lot Integration Pass;
9. apply base + applicable addendum Lot acceptance;
10. run the checkpoint if the Lot closes a checkpoint group.

The user is not required to manage individual packets.

---

## Context-budget rule for LLMs

Do not load the full repo documentation into context for one small task or one large Lot.

Recommended strategy:

1. read task/lot status and IDs;
2. for a Lot, construct the Work Packet plan first;
3. for the current packet, read the narrow governing feature/spec;
4. follow explicit references from that document;
5. read cross-cutting contracts only when applicable;
6. summarize constraints in FIR/Work Packet records before coding;
7. re-open exact contracts before Pass B and Pass C if the task is long.

This reduces accidental priority inversion and context compression from having unrelated documentation in one context.

---

## Pre-implementation task brief

Before coding a material feature/packet, the agent should be able to state internally/from repository evidence:

```text
Current gate/lot:
Current Work Packet/pass if a Lot is active:
Feature IDs:
Requirement IDs:
Acceptance IDs:
Primary user job:
Routes/screens:
Authoritative domain entities:
Cloud tables/RPC/storage:
Local stores/offline class:
Permission keys/security requirements:
Critical invariants:
Import/export/backup impact:
Tests required:
Files/modules expected to own the change:
Known deferred choices:
```

If one of these is materially unknown, the task is not Ready.

---

## Post-implementation task brief

Before declaring completion:

```text
Feature lifecycle status:
Work Packet state/pass:
Code modules added/changed:
Schema/migrations:
Tests/evidence:
UX evidence:
Security/RLS evidence:
Offline/sync evidence:
Docs/ADR changes:
Open limitations/blockers:
Next permitted action:
```

For Lot closure additionally record:

```text
All planned packets accepted:
Required-vs-evidenced reconciliation:
Lot Integration Pass:
Lot Acceptance result:
Checkpoint result if applicable:
```

Update durable repository records rather than leaving this only in the conversation.

---

## Conflict handling

If two documents appear to disagree:

1. use `AGENTS.md` precedence;
2. check whether one is an explicit addendum;
3. check `DEFERRED-DECISIONS.md`;
4. check ADRs/audit/final review;
5. if still ambiguous, treat as documentation defect and resolve before semantic implementation.

Never choose the easier interpretation silently.