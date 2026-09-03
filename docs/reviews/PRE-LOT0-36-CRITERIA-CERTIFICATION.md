# Mariage OS — Pre-Lot 0 36-Criteria Certification

Status: **FINAL PRE-CODE DESIGN CERTIFICATION**

Purpose: certify the exact design/documentation conditions that must be perfect before Lot 0 may become READY. This is deliberately separate from implementation/runtime evidence, which cannot exist before Lot 0.

## Scoring rule

For this certification, **10/10** means:

- the behavior/contract is explicit enough to implement without material guessing;
- authoritative documents and precedence are known;
- verification/evidence requirements are defined;
- no unresolved BLOCKING/MAJOR design defect remains for the criterion;
- future runtime proof is assigned to a later lot/gate rather than falsely claimed now.

It does **not** mean unimplemented code has already been tested.

## Certified criteria

| # | Pre-Lot 0 criterion | Score | Certification basis |
|---:|---|---:|---|
| 1 | Product mission / couple jobs | **10/10** | Product specification, dashboard/action model and feature contracts define the decision/action purpose and couple mental model. |
| 2 | V1 / post-V1 scope | **10/10** | V1 scope, backlog and deferred-decision governance prevent silent scope creep. |
| 3 | Private-V1 vs public-SaaS boundary | **10/10** | Private initial deployment is policy only; core tenancy remains public-ready. |
| 4 | Multi-tenant project context | **10/10** | Project/membership ownership, routes, caches, DB rows and authorization are project-scoped. |
| 5 | Feature inventory / traceability | **10/10** | Stable Feature IDs, requirements, acceptance scenarios and matrices are defined. |
| 6 | User flows / acceptance scenarios | **10/10** | Critical flows and edge/error cases have explicit expected behavior and evidence paths. |
| 7 | UX information architecture | **10/10** | Screen taxonomy, primary jobs and progressive disclosure are frozen. |
| 8 | Navigation / route discoverability | **10/10** | Desktop/mobile navigation, project-scoped routes and task continuity are explicit. |
| 9 | Screen composition | **10/10** | Screen blueprints prevent generic CRUD/mega-page substitution and define main hierarchy. |
| 10 | Visual identity / color system | **10/10** | Visual thesis, domain palette and semantic color roles are frozen enough to prevent generic styling drift. |
| 11 | Motion / dynamic list-table behavior | **10/10** | Timing, reduced motion, sorting/filtering transitions and optimistic/sync states are specified. |
| 12 | Image delivery / metadata / private SEO | **10/10** | Image loading, privacy, remote content, metadata and private/public indexing boundaries are explicit. |
| 13 | Future public web shell / marketing SEO | **10/10** | Public landing/Auth shell is separated from authenticated private content and future activation is gated. |
| 14 | Responsive behavior | **10/10 design** | Mobile/tablet/desktop behavior and fallback patterns are specified; rendered proof belongs to implementation. |
| 15 | Accessibility contract | **10/10 design** | Keyboard, focus, forms, semantics, reduced motion and accessibility gate are specified; executable proof is later. |
| 16 | Cloud architecture | **10/10** | Cloudflare/Supabase responsibilities, trust boundaries and provider roles are explicit. |
| 17 | Local-first / IndexedDB architecture | **10/10** | Local ownership, partitioning, schema versioning and parity expectations are explicit. |
| 18 | Synchronization / conflicts | **10/10** | Revisions, operation IDs, retries, idempotence, conflicts and resolution UX are specified. |
| 19 | Offline capability classification | **10/10** | Cached-read, queueable-edit, server-required and degraded behaviors are classified. |
| 20 | Database / same-project integrity | **10/10** | Same-project composite relationships, polymorphic validation and invariants are normative. |
| 21 | Facts / evidence / criteria model | **10/10** | Unknown/conflict/provenance/retained-value semantics and extensible criteria are explicit. |
| 22 | Money / budget / payments | **10/10** | Integer minor units, tax semantics, scenarios, payments/refunds/deposits and states are frozen. |
| 23 | Guests / households / seating | **10/10** | Household ownership, guest probabilities/RSVP and non-graphical seating contracts are explicit. |
| 24 | Venues / access / vendors | **10/10** | Venue facts, spaces, offers, transport observations, vendor packages and evidence are specified. |
| 25 | Tasks / decisions / Inbox / Search | **10/10** | Ownership, waiting/blocked semantics, decisions, capture workflow and search behavior are explicit. |
| 26 | Planning / wedding-day timeline | **10/10** | Phases, milestones, dependencies, day offsets and immutable snapshot/export behavior are explicit. |
| 27 | Documents / contract readiness / media | **10/10** | Storage, evidence, versions, readiness and media boundaries are explicit. |
| 28 | Import / external IDs / merge / rollback | **10/10** | Canonical schema, mapping, parent-scoped IDs, preview, protected truth and rollback are specified. |
| 29 | Backup / restore / encryption | **10/10** | `.mariage` versioning, integrity, encryption, recovery and compatibility policies are specified. |
| 30 | Authentication / invitations / authorization / RLS | **10/10 design** | Auth, MFA, invitation binding, permissions, RLS matrices and deny-test requirements are complete. |
| 31 | Future public signup / abuse / launch boundary | **10/10 design** | CAPTCHA/rate limiting/provisioning/legal/SEO/support/capacity are gated separately from private V1. |
| 32 | Privacy / external content / files | **10/10 design** | Data classification, public-repo policy, file validation and external-content controls are explicit. |
| 33 | Testing / quality strategy | **10/10 design** | Unit/property/mutation/integration/RLS/security/E2E/accessibility/performance layers and thresholds are defined. |
| 34 | Operations / recovery / free-tier awareness | **10/10 design** | Backups, diagnostics, resource constraints, recovery expectations and production readiness checks are specified. |
| 35 | Development anti-drift governance | **10/10** | AGENTS, Feature Ledger, FIR, PR template, code boundaries, naming and complexity limits prevent informal implementation drift. |
| 36 | Lot / checkpoint sequencing | **10/10** | Lots 0–12, acceptance contracts and Checkpoints A/B/C/D define dependencies and stop/go decisions. |

## Result

**36 / 36 criteria at 10/10 = 100% pre-Lot 0 design readiness.**

This certification is valid only while:

- no new unresolved BLOCKING/MAJOR design finding is introduced;
- final sentry/public-repository hygiene remains clean;
- PR review threads remain resolved;
- the final reviewed Run 4 HEAD is recorded and merged unchanged.

## What remains intentionally outside this 100%

The following are not pre-code design defects and therefore are not scored below 10 here:

- actual lint/typecheck/coverage execution;
- executable dependency-boundary enforcement;
- real PostgreSQL migrations/RLS deny tests;
- rendered accessibility/mobile/performance evidence;
- real Service Worker/update behavior;
- production monitoring/rollback proof;
- real V1→V2 migration rehearsal.

Those are tracked by `ABSOLUTE-300-CONTROL-CHECKLIST.md` and become provable only in Lot 0 or later.

## Gate rule

This certificate **does not start Lot 0**. It only establishes that the design/specification portion of the gate is complete. The master Final Design Review and final sentry seal still control merge/gate transition.
