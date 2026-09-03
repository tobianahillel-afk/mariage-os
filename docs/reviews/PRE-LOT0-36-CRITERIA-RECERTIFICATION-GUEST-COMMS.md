# Mariage OS — Pre-Lot 0 36-Criteria Re-Certification — Guest Communications Scope

Status: **FINAL DESIGN RE-CERTIFICATION CANDIDATE — CURRENT V1**

Purpose: re-score the exact 36 pre-code design dimensions after promoting guest RSVP, Email, SMS and WhatsApp communication into V1.

This supersedes the previous 36-criterion certificate for the **current V1 scope** once this scope-change PR is merged.

## Scoring rule

`10/10` means:

- current V1 behavior is explicit enough to implement without material guessing;
- guest-communications impact has been reconciled where applicable;
- authoritative docs/precedence/routing are known;
- verification/evidence is defined;
- zero unresolved BLOCKING/MAJOR design finding exists for that dimension;
- runtime proof is correctly assigned to implementation lots rather than falsely claimed.

## Re-certified criteria

| # | Criterion | Score | Guest-communications re-review basis |
|---:|---|---:|---|
| 1 | Product mission / couple jobs | **10/10** | Product loop now includes invite/contact/respond without changing Understand→Decide→Act. Communications serve guest execution rather than becoming generic CRM. |
| 2 | V1 / post-V1 scope | **10/10** | Guest portal and Email/SMS/WhatsApp explicitly promoted to V1; post-V1 exclusions corrected; frozen manifest resolves precedence. |
| 3 | Private-V1 vs public-SaaS boundary | **10/10** | Private couple may configure providers; future tenant/provider/entitlement topology remains public-ready behind ports. |
| 4 | Multi-tenant project context | **10/10** | Contact/invitation/campaign/recipient/event data project-scoped; cross-tenant guest/webhook tests defined. |
| 5 | Feature inventory / traceability | **10/10** | V1 now explicitly 120 features; RSVP/COM/QIF/COMMOPS/PUB-COM → FTR → GC → lot matrix is durable. |
| 6 | User flows / acceptance scenarios | **10/10** | Base acceptance corpus extended with GC-001..060 covering happy/error/adversarial/provider/QIF paths. |
| 7 | UX information architecture | **10/10** | Invitations & RSVP lives under Guests; provider setup in Settings; guest portal has separate minimal shell. No top-level messaging clutter. |
| 8 | Navigation / route discoverability | **10/10** | Authenticated guest routes + `/rsvp/:token` capability route mapped to jobs/features; Dashboard/Household deep links defined. |
| 9 | Screen composition | **10/10** | Campaign 6-step focused wizard, household integration, invitation workspace, public RSVP progression and empty/error states are explicit. |
| 10 | Visual identity / color system | **10/10** | New guest/public shell inherits frozen visual system without introducing arbitrary provider branding as primary product UI. |
| 11 | Motion / dynamic list-table behavior | **10/10** | Existing motion/state contracts remain valid; send progress is status-driven, no celebratory success when material failures exist. |
| 12 | Image delivery / metadata / private SEO | **10/10** | Invitation-card assets follow media rules; guest token referrer/third-party-resource privacy explicitly addressed; guest portal not private-data SEO surface. |
| 13 | Future public web shell / marketing SEO | **10/10** | Guest RSVP public capability shell is distinct from public marketing shell and private app; public SaaS addendum preserves indexing/privacy boundaries. |
| 14 | Responsive behavior | **10/10 design** | Guest RSVP mobile-first; campaign wizard stepwise on mobile; lists avoid wide provider tables; representative device evidence assigned later. |
| 15 | Accessibility contract | **10/10 design** | Guest form labels/errors/focus/reduced-motion/QIF accessibility acceptance explicit; provider HTML email must be accessible with text fallback. |
| 16 | Cloud architecture | **10/10** | Provider-neutral ports, server-side scheduler/secrets/webhooks and narrow guest server boundary are defined without changing core cloud ownership. |
| 17 | Local-first / IndexedDB architecture | **10/10** | Communication drafts/cache scope defined; raw guest token excluded from ordinary IndexedDB; guest public browser isolated from authenticated local DB. |
| 18 | Synchronization / conflicts | **10/10** | Contact/template drafts follow sync; sends/RSVP commits use server idempotency/revalidation; lost acknowledgement/duplicate effects explicitly handled. |
| 19 | Offline capability classification | **10/10** | Draft/edit vs cloud-required send/token/guest submit operations classified; UI cannot claim offline send/RSVP confirmation. |
| 20 | Database / same-project integrity | **10/10** | Explicit schema tables/FKs/project scope, attempts/events/eligibility/settings, same-project constraints and indexes specified. |
| 21 | Facts / evidence / criteria model | **10/10** | Existing fact model unaffected; communication eligibility/provenance is explicitly separate from venue fact semantics, avoiding model abuse. |
| 22 | Money / budget / payments | **10/10** | Provider fees separated from core free-tier promise; known-cost/cost caps modeled without silently changing wedding financial truth. RSVP guest-count dependencies preserve historical/contract truth. |
| 23 | Guests / households / seating | **10/10** | Guest contacts, links, self-RSVP, allowances, response history, stats and seating invalidation integrated into canonical household/person model. |
| 24 | Venues / access / vendors | **10/10** | No new contradiction; communications remain guest-domain. RSVP guest-count changes can inform capacity/vendor planning only through documented dependencies. |
| 25 | Tasks / decisions / Inbox / Search | **10/10** | Failed sends/RSVP deadlines can create next actions; Search excludes raw contact/message/provider debug by default; no CRM clutter. |
| 26 | Planning / wedding-day timeline | **10/10** | RSVP completion/deadline may feed milestones/next actions without polluting day-of timeline/provider telemetry. |
| 27 | Documents / contract readiness / media | **10/10** | Invitation-card media follows file/storage safety; communication secrets/tokens not document assets; no contradiction with contracts/media versioning. |
| 28 | Import / external IDs / merge / rollback | **10/10** | Contact import mapped/previewed; no implicit consent/send; raw tokens/secrets excluded; provider history portable without live queue semantics. |
| 29 | Backup / restore / encryption | **10/10** | Communication history/templates can be backed up; provider secrets/raw tokens excluded; restored schedules disabled/non-dispatchable; no accidental send. |
| 30 | Authentication / invitations / authorization / RLS | **10/10 design** | Partner-account invite vs guest capability separated; explicit contact/send permissions; guest-safe server boundary; current permission rechecked at dispatch. |
| 31 | Future public signup / abuse / launch boundary | **10/10 design** | PUB-COM requirements, tenant caps/provider topology/abuse/legal future gates exist while private V1 remains controlled. |
| 32 | Privacy / external content / files | **10/10 design** | Contact/RSVP/message PII minimized; tracking pixels off by default; referrer/token/log/webhook/secret boundaries explicit. |
| 33 | Testing / quality strategy | **10/10 design** | GC-001..060, provider contract tests, webhook/idempotency/security/QIF/mobile/accessibility/cutover evidence mapped to lots/checkpoints. |
| 34 | Operations / recovery / free-tier awareness | **10/10 design** | Provider readiness states, scheduler/monitoring/incidents/cost caps/manual fallback and free-tier distinction are explicit. |
| 35 | Development anti-drift governance | **10/10** | V1 manifest/AGENTS/START-HERE/INDEX/code-structure addendum prevent LLM/provider-SDK/old-scope drift; provider choices explicitly deferred, semantics not. |
| 36 | Lot / checkpoint sequencing | **10/10** | Lot1 hooks, Lot6 functional scope, Lot11 real provider hardening, Lot12 data/guest cutover; Checkpoints A/B/C/D have explicit communication evidence. |

## Result

**36 / 36 current pre-Lot 0 design criteria = 10/10.**

No score depends on pretending that an unimplemented provider, webhook, RLS policy, accessibility rendering or real send has already been tested. Those proofs remain assigned to their implementation phase.

## New-scope residual risk review

The following are implementation risks, not missing design decisions:

- exact Email/SMS/WhatsApp vendor/package choice;
- exact durable scheduler technology;
- exact provider pricing/current platform policy at implementation/cutover;
- actual DNS/account/template configuration;
- actual RLS/webhook/idempotency behavior;
- actual QIF usability with rendered UI;
- actual mobile/browser/provider reliability.

Each is deliberately tied to Lot 6/11/12 evidence and cannot be marked verified during documentation.

## Validity conditions

This re-certification becomes the current frozen certificate only after:

1. context-free cold-start review passes;
2. final branch sentry finds no unresolved stale-scope/secret/private-data issue;
3. zero BLOCKING/MAJOR review finding remains;
4. scope-change PR is merged unchanged;
5. `FINAL-DESIGN-REVIEW.md` and `roadmap/IMPLEMENTATION-STATUS.md` are updated on `main`;
6. Lot 0 remains `READY / NOT_STARTED` until an explicit future kickoff.