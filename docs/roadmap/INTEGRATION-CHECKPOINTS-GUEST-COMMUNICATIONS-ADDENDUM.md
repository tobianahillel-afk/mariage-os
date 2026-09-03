# Mariage OS — Integration Checkpoints Addendum: Guest Communications

Status: **NORMATIVE V1 CHECKPOINT ADDENDUM**

## Checkpoint A — Lots 0–3

Add review questions:

- Does the route/auth architecture clearly separate future `/rsvp/:token` capability access from project-member `/app/**` access?
- Are provider integrations still absent from domain/UI and deferred to ports/infrastructure?
- Does onboarding expose Invitations & RSVP intent without technical provider jargon?
- Is QIF included in feature review templates for applicable future flows?

Checkpoint A does not require guest communication implementation yet.

## Checkpoint B — Lots 4–7

This is the primary guest-communications integration checkpoint.

### Product/UX

- Guests → Invitations & RSVP is discoverable and does not create sidebar clutter.
- Household detail connects contacts, invitation link, response and message history coherently.
- Campaign flow passes QIF.
- Guest RSVP mobile flow passes QIF/accessibility.
- Failures show corrective next actions.
- Manual link/QR path works without providers.

### Data/coherence

- Contact point, invitation, RSVP, campaign and seating/budget dependency behavior is coherent.
- Historical messages/submissions remain historical when contacts/links change.
- Importing contacts never sends.
- Duplicate contacts do not cause unsafe household merges or duplicate sends.

### Security

- guest capability is narrower than member Auth;
- raw tokens absent from storage/logs;
- cross-household attacks fail;
- +1 allowance enforced server-side;
- send permission/audience freeze/idempotency proven;
- fake/test webhook forgery/replay tests pass;
- no provider secrets in frontend.

### Architecture

- provider-neutral ports exist;
- provider SDKs are infrastructure only;
- domain/application code remains testable with fake providers;
- scheduler concept is server-side/durable, not browser timer.

### Traceability

- FTR-105..119 reconciled;
- P0/P1 requirements mapped;
- GC scenarios have evidence or explicitly documented later-phase status.

No BLOCKING/MAJOR finding may remain.

## Checkpoint C — Lots 8–10

Add review questions:

- Dashboard surfaces only actionable RSVP/invitation summaries, not provider telemetry noise.
- Search privacy does not expose raw contact/message/provider identifiers broadly.
- local/offline behavior clearly distinguishes draft editing from network-required dispatch and guest submit.
- PWA update/session behavior cannot accidentally resend queued provider operations.
- scheduled/provider operations remain server-authoritative.

## Checkpoint D — Lots 11–12

For every enabled automatic channel:

- real provider readiness evidence exists;
- synthetic/test-recipient send/callback passed;
- webhook authenticity/replay handling passed;
- production send/cost caps configured;
- monitoring/degraded mode verified;
- credentials absent from client/repo/logs;
- representative mobile guest RSVP passed;
- QIF final review passed;
- restore/update process cannot accidentally dispatch historical campaigns.

A channel may remain production-disabled without blocking overall V1 only if the frozen release definition allows it and the UI clearly shows it unavailable; secure manual link/QR RSVP remains mandatory.