# Mariage OS — Final Design Review

Status: **PASS — EXPANDED V1 FROZEN / IMPLEMENTATION GATE OPEN**

Purpose: authoritative pre-code design decision after adding secure guest RSVP links and outbound Email/SMS/WhatsApp communications to V1 and re-reviewing product, UX, architecture, data, security, quality, operations, public-readiness, release, LLM handoff and maintainability.

## Final decision

The expanded V1 design/documentation is **COMPLETE and FROZEN on `main`**.

The frozen V1 feature set is:

- base capabilities `FTR-001..FTR-104`;
- guest RSVP/communication capabilities `FTR-105..FTR-120`;
- total: **120 V1 Feature IDs**.

The governing composition/precedence is recorded in `V1-FROZEN-MANIFEST.md`.

PR #5 (`docs: promote guest RSVP and communications into frozen V1`) was reviewed and merged from exact sealed head `96b18f04e6b2af9f21614751096cca7db00a88ea`. Merge commit: `7088d4c48aa9043733bbc015235a538ee4c06120`.

## Scope-change review result

The guest-communications scope change is reconciled across:

- product specification and V1 scope;
- Feature Ledger/requirements/traceability;
- user journeys and acceptance scenarios;
- onboarding and QIF (Quick & Intuitive Flow) criteria;
- navigation/routes/screen blueprints;
- domain schema/state machines/invariants/dependency graph;
- project authorization/capability-link security;
- provider ports and repository/service boundaries;
- local/offline behavior;
- import/export/backup/restore;
- free-tier/cost semantics;
- public-SaaS readiness;
- lots/checkpoints/cutover;
- LLM cold-start/task routing.

Dedicated scope-change review: `reviews/V1-GUEST-COMMUNICATIONS-SCOPE-CHANGE-REVIEW.md`.
Cold-start review: `reviews/LLM-GUEST-COMMUNICATIONS-COLD-START-REVIEW.md`.
Acceptance suite: `quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`.

## Final pre-code score

Authoritative score: `reviews/PRE-LOT0-36-CRITERIA-CERTIFICATION.md`.

Result:

- **36 / 36 criteria = 100/100 each**;
- arithmetic mean: **100.0/100**;
- zero known unresolved BLOCKING design findings;
- zero known unresolved MAJOR design findings for the expanded V1;
- PR #5 had no open review thread at the final sentry point;
- branch was `behind_by: 0` before merge;
- exact-head sentry found no tested known-person identifiers or tested high-signal credential/key patterns in the scope-change patch;
- changed-file inventory was documentation only;
- runtime-only proof remains explicitly assigned to Lot 0 or later and is not falsely claimed.

## Critical safety conclusions for the new V1 scope

- `/rsvp/:token` is a narrow household capability, not an anonymous project session.
- Raw RSVP capability tokens are never stored as project data or exposed through logs/diagnostics.
- Guest portal data transfer is allowlisted; internal priority/probability/private notes are never guest-visible.
- Provider credentials remain server/platform secrets.
- Provider integrations are behind application ports/adapters; domain/UI code does not depend directly on WhatsApp/SMS/email SDKs.
- Outbound send is server-authoritative and idempotent; offline/client state cannot claim a send occurred.
- Webhook/provider callbacks require verified source/signature semantics and deduplication.
- Restore/migration never automatically reactivates queued/scheduled outbound campaigns.
- Paid communication channels are opt-in/bounded; free secure link/QR remains a core fallback.
- V1 WhatsApp integration must use an official/approved WhatsApp Business-compatible provider/API path; browser automation/personal-account circumvention is forbidden.

## Implementation gate

**OPEN** means Lot 0 is allowed to begin only after an explicit future kickoff request.

It does **not** mean Lot 0 has begun.

Current implementation state:

- V1 design: **COMPLETE / FROZEN**;
- V1 Feature IDs: **120 SPECIFIED**;
- implementation gate: **OPEN**;
- Lot 0: **READY / NOT_STARTED**;
- application code: **not started**;
- package/toolchain implementation: **not started**;
- CI/workflow implementation: **not started**;
- database migrations: **not started**;
- provider integration code: **not started**;
- real Email/SMS/WhatsApp sending: **not started**.

## Runtime evidence boundary

The design is implementation-ready, not runtime-verified. Real proof remains required later for lint/typecheck/coverage, DB/RLS/capability endpoint execution, provider sends, webhook verification, mobile/accessibility rendering, Service Worker behavior, production monitoring and V1→V2 migration rehearsal.

## Next permitted action

**Wait for an explicit Lot 0 kickoff.** Until then, no application/tooling/migration/provider implementation is authorized.