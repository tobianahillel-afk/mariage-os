# Mariage OS — LLM Cold-Start Review: Invitations / RSVP / Communications

Status: **CONTEXT-FREE TAKEOVER REVIEW — PASS CANDIDATE**

Purpose: prove that a developer/LLM with no chat history can discover the current V1 scope, ownership, priority, architecture, UX and tests for the newly added guest-communications features.

## Entry-point test

A context-free agent reads root README/AGENTS/status/manifest.

Expected discoveries:

- current V1 has 120 features, not 104;
- FTR-105..120 are V1;
- guest portal/Email/SMS/WhatsApp are no longer post-V1;
- Lot 0 is not currently to be started during the re-freeze branch;
- guest communication work belongs primarily to Lots 6 and 11;
- QIF is an internal acceptance criterion, not an external standard;
- provider choice is deferred but architecture/security semantics are frozen.

**Result: PASS by documentation path.**

## Scenario 1 — “Implement WhatsApp invitations”

Expected route:

1. status/gate;
2. V1 manifest → FTR-115 and related FTR-112/116/117/120;
3. COM/PUB-COM/QIF requirements;
4. COMMUNICATIONS feature;
5. UX campaign blueprint;
6. authorization/security;
7. provider ports;
8. provider operations;
9. acceptance GC-021..046/057 etc.;
10. Lot 6 sandbox/port vs Lot 11 production ownership.

Agent must conclude:

- official Business-compatible API/provider only;
- no WhatsApp Web automation;
- no provider SDK in UI/domain;
- no browser secret;
- template/provider eligibility is provider-specific infrastructure;
- frozen audience/preview/idempotency/webhook/cost caps mandatory;
- exact provider choice is deferred.

**PASS.**

## Scenario 2 — “Build the guest RSVP link”

Agent must find FTR-105..109/111, RSVP requirements, portal UX, guest-token security, capability route and schema.

Must conclude:

- no guest account;
- token is capability, not project membership;
- raw token hash-at-rest/non-log;
- guest-safe DTO only;
- +1/child allowances server-side;
- network-required authoritative submit;
- RSVP updates canonical guests/stats/dependencies;
- no private priority/probability/notes.

**PASS.**

## Scenario 3 — “Add a phone number column to Guests and send SMS immediately”

Correct behavior:

- recognize contact point is first-class entity, not arbitrary column-only truth;
- use contact import/normalization/eligibility contract;
- importing/storing contact never triggers send;
- SMS send goes through campaign preflight/provider port;
- exact SMS provider deferred;
- phone validation/security/cost caps required.

**PASS.**

## Scenario 4 — “Store RSVP token in IndexedDB so we can always show the same link”

Correct behavior:

- find local-data addendum;
- reject ordinary persistent raw-token cache as current V1 default;
- use one-time raw token share/reissue/rotation unless a separately reviewed encrypted-secret design is introduced.

**PASS.**

## Scenario 5 — “Make anonymous RLS allow SELECT/UPDATE on guests when token matches”

Correct behavior:

- stop;
- guest portal contract explicitly rejects broad anonymous CRUD;
- implement narrow server/RPC/edge capability boundary returning allowlisted DTO and transactional submit.

**PASS.**

## Scenario 6 — “Schedule messages in setTimeout in the browser”

Correct behavior:

- reject;
- provider operations/offline/state contracts require durable server scheduler;
- browser may store scheduling intent only.

**PASS.**

## Scenario 7 — “Retry all campaign recipients because request timed out”

Correct behavior:

- inspect recipient/attempt/idempotency state;
- reconcile provider acceptance/reference;
- retry only eligible failed/unconfirmed logical intents;
- never blindly resend successful recipients.

**PASS.**

## Scenario 8 — “Show sent/delivered/read as RSVP status”

Correct behavior:

- reject; communications and RSVP are independent state machines;
- channel read/delivery can inform follow-up but cannot infer attendance.

**PASS.**

## Scenario 9 — “Make Communications a new sidebar section”

Correct behavior:

- UX blueprint/route contract says workflow is Guests → Invitations & RSVP;
- advanced channel config belongs Settings;
- only change IA through reviewed product/UX scope update.

**PASS.**

## Scenario 10 — “Ask for SPF, DKIM and WhatsApp API keys during onboarding”

Correct behavior:

- QIF/onboarding contract rejects provider jargon/mandatory technical setup;
- onboarding records intent and permits defer;
- advanced provider setup belongs Settings/Lot11 readiness.

**PASS.**

## Scenario 11 — “The user has no paid provider”

Correct behavior:

- manual secure link/QR remains supported;
- no artificial block on guest RSVP;
- core zero-cost target remains meaningful;
- automatic channel shown unavailable with next setup action.

**PASS.**

## Scenario 12 — “Provider webhook contains project_id=B; update B”

Correct behavior:

- reject caller-supplied tenant identity as authority;
- verify signature;
- resolve stored provider message/attempt → recipient → project;
- deduplicate event;
- normalize state.

**PASS.**

## Scenario 13 — “Restore a backup with scheduled campaigns”

Correct behavior:

- restore history/data but do not automatically reactivate or dispatch schedules;
- provider secrets are absent;
- require explicit reconciliation/provider re-binding.

**PASS.**

## Scenario 14 — “Switch from provider X to provider Y”

Correct behavior:

- implement new infrastructure adapter behind stable port;
- preserve historical provider events/IDs;
- do not rewrite campaign/guest domain;
- perform readiness/migration tests.

**PASS.**

## Scenario 15 — “Add provider-specific fields everywhere for convenience”

Correct behavior:

- reject provider SDK types in domain/UI;
- keep provider reference/raw diagnostic metadata at infrastructure/operational boundary;
- normalized domain states/results remain stable.

**PASS.**

## Scenario 16 — “Guest is offline; show success immediately and sync RSVP later”

Correct behavior:

- reject current V1 semantics;
- preserve form values, show not-confirmed/network-required retry;
- success only after server commit; idempotency handles lost acknowledgement.

**PASS.**

## Scenario 17 — “Send 500 WhatsApps; provider says it costs money”

Correct behavior:

- show known/reliable cost/cap in preflight;
- enforce configured cap;
- no automatic paid upgrade/overage;
- core €0 target does not imply external provider is free.

**PASS.**

## Scenario 18 — “Implement V2 later”

Agent must include:

- FTR-105..120 in historical V1 baseline;
- communication schema migration;
- token/link compatibility;
- pending/scheduled send safety;
- webhook backward compatibility;
- templates/provider ports/history;
- backup migration;
- no accidental resend during app update.

**PASS.**

## Navigation/readability assessment

A context-free contributor can determine:

- current scope: manifest/status;
- feature ownership: extension ledger;
- why/what: product/feature docs;
- routes/visual flow: UX addenda;
- data: schema/state/invariants/dependencies;
- security: security README + guest contracts;
- code placement: engineering addendum/provider ports;
- portability/offline: dedicated addenda;
- tests: GC suite;
- sequencing: Lots + acceptance/checkpoint addenda;
- implementation choices still open: Deferred Decisions.

No essential implementation semantic depends on chat history.

## Result

**PASS — context-free routing is sufficient at design level.**

Re-check after the final re-freeze merge by reading from `main`, not this review document alone.