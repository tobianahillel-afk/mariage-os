# Mariage OS — Implementation Status Board

Status: **Living repository source of truth for development progress**

Purpose: answer “where exactly are we?” without relying on chat history, memory or interpretation of recent commits.

## Current phase

**V1 pre-code scope-change documentation/review: IN PROGRESS.**

The previous 36/36 pre-Lot 0 design freeze passed and Run 4 merged. The V1 is now being deliberately expanded before implementation with:

- secure household RSVP links/QR;
- no-account mobile guest RSVP portal;
- guest contact points;
- Email/SMS/WhatsApp Business-compatible invitation/reminder communications;
- campaign/template/preflight/webhook/cost-control architecture;
- Invitations & RSVP onboarding/settings;
- internal QIF acceptance criterion.

**Implementation gate for starting Lot 0: TEMPORARILY ON HOLD until this scope change is re-reviewed, re-certified and merged.**

**Lot 0 remains READY / NOT_STARTED. Do not start it.**

No application/tooling implementation work has started.

## Current V1 feature inventory

Authoritative current design rows are the union of:

- `../FEATURE-LEDGER.md` — FTR-001..104;
- `../FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md` — FTR-105..120.

Current total: **120 V1 capabilities**, all still design-level `SPECIFIED` except Lot 0 readiness is a lot state, not a feature implementation state.

Implementation counts:

- `IN_PROGRESS`: 0
- `IMPLEMENTED`: 0
- `VERIFIED`: 0
- `INTEGRATED`: 0
- `ACCEPTED`: 0

## Scope-change evidence in progress

Primary entry points:

- `../V1-FROZEN-MANIFEST.md`
- `../PRODUCT-SPECIFICATION-GUEST-COMMUNICATIONS-ADDENDUM.md`
- `../requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md`
- `../GUEST-COMMUNICATIONS-TRACEABILITY.md`
- `../features/GUEST-RSVP-PORTAL.md`
- `../features/COMMUNICATIONS.md`
- `../ux/GUEST-COMMUNICATIONS-BLUEPRINTS.md`
- `../security/GUEST-COMMUNICATIONS-SECURITY.md`
- `../architecture/COMMUNICATION-PROVIDER-PORTS.md`
- `../quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`
- `LOTS.md` + guest communication lot/checkpoint addenda.

## Lot status

Allowed lot states:
- `NOT_STARTED`
- `READY`
- `IN_PROGRESS`
- `LOT_REVIEW`
- `CHECKPOINT_REVIEW`
- `ACCEPTED`
- `BLOCKED`

| Lot | Name | State | Feature range / focus |
|---:|---|---|---|
| 0 | Repository & tooling | **READY / HOLD** | engineering foundation; explicit kickoff forbidden during re-freeze |
| 1 | Identity/project foundation | NOT_STARTED | FTR-002..012 + FTR-119 foundation hooks |
| 2 | Venues core | NOT_STARTED | FTR-013..028 + file basics |
| 3 | Tasks/decisions/Inbox | NOT_STARTED | FTR-029..035 |
| 4 | Import/export foundation | NOT_STARTED | FTR-036..044 + contact import safeguards |
| 5 | Budget/payments | NOT_STARTED | FTR-045..053 |
| 6 | Guests/invitations/RSVP/communications/seating | NOT_STARTED | FTR-054..063 + FTR-105..119 |
| 7 | Vendors/contracts | NOT_STARTED | FTR-064..068, 089..093 as assigned |
| 8 | Dashboard/planning/timeline/search | NOT_STARTED | FTR-069..078 + RSVP actionable summaries |
| 9 | Map/access | NOT_STARTED | FTR-079..082 |
| 10 | Offline/PWA hardening | NOT_STARTED | FTR-083..088 + comm draft/send boundaries |
| 11 | Backup/recovery/providers/production | NOT_STARTED | FTR-094..099 + FTR-113..117/FTR-120 production evidence |
| 12 | Existing data/cutover | NOT_STARTED | FTR-100..104 + contact/guest RSVP acceptance |

## Cross-lot checkpoints

| Checkpoint | Lots | State | Guest communication impact |
|---|---|---|---|
| A | 0–3 | NOT_STARTED | public capability/provider boundary hooks reviewed |
| B | 4–7 | NOT_STARTED | primary FTR-105..119 + QIF/security integration gate |
| C | 8–10 | NOT_STARTED | dashboard/search/offline/PWA communication coherence |
| D | 11–12 | NOT_STARTED | real provider/cutover/QIF evidence for enabled channels |

## Current review tasks before re-freeze

1. reconcile every old V1/post-V1 reference affected by guest portal/automatic communications;
2. verify 120-feature / acceptance-corpus navigation from root/LLM entry points;
3. verify product/onboarding/QIF/UX placement is intuitive and does not create module clutter;
4. verify schema/state/invariants/dependencies/offline/import/backup/versioning coherence;
5. verify Auth/authorization/token/webhook/provider-secret/privacy/cost-abuse model;
6. verify roadmap/lots/checkpoints/cutover evidence;
7. simulate context-free LLM takeover for RSVP/Email/SMS/WhatsApp tasks;
8. re-run and document all 36 pre-Lot 0 design criteria;
9. scan final branch for stale wording/private data/secrets;
10. merge only after zero BLOCKING/MAJOR finding remains.

## Next permitted action

**Documentation/review/re-freeze only. Do not start Lot 0.**

Forbidden during this phase:

- Vite/TypeScript initialization;
- package/toolchain creation;
- GitHub Actions implementation;
- Supabase migrations/configuration implementation;
- application source code;
- provider SDK integration;
- real Email/SMS/WhatsApp send;
- Feature ID implementation.

## Handoff summary

```text
Previous pre-code design: PASS / merged
Current change: V1 guest invitations + RSVP + Email/SMS/WhatsApp + QIF
Current feature inventory: 120
Scope-change review: IN PROGRESS
Implementation gate for Lot 0 kickoff: HOLD
Lot 0: READY / NOT_STARTED
Features IMPLEMENTED: 0
Next permitted action: documentation coherence review and 36-criterion re-certification only
```

The repository is the canonical handoff. Chat history is supplementary only.