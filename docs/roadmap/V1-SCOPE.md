# V1 Scope

Status: **Binding scope for first production cutover — freeze candidate**

V1 is not a prototype. It is the first version safe/useful enough to replace fragmented wedding-planning sources as the couple's operational source of truth.

## V1 outcome

Both partners can securely use Mariage OS from supported phone/tablet/desktop devices to:

- understand status/next action;
- compare venues and date options;
- manage vendors/caterers;
- manage guests/households/RSVP and a reliable basic seating plan;
- manage tasks, Inbox capture and joint decisions;
- track named budget scenarios, commitments, payments and deadlines;
- store/link documents/photos/evidence;
- search project data quickly;
- import/export existing/new data safely;
- work through short offline periods and synchronize safely;
- recover from a validated portable backup.

---

# Required V1 capabilities

## Platform foundation

- Vite + TypeScript static frontend.
- Cloudflare Pages.
- Supabase Auth/PostgreSQL/Storage/Realtime.
- single-couple closed production bootstrap.
- two private owner accounts.
- RLS all project-owned data/storage.
- same-project relational DB constraints.
- IndexedDB local working state.
- queued sync/conflict model.
- PWA manifest/service worker/version lifecycle.
- diagnostics/version information.

## Authentication/security

- verified email/password authentication.
- controlled first-owner bootstrap.
- one-time hashed partner invitation.
- unrestricted signups disabled after owner bootstrap.
- project creation locked against unrelated public users.
- mandatory owner TOTP MFA before real-data cutover.
- session/re-auth recovery flows.
- logout pending-work safeguard + private local-cache purge.
- CSP/security headers/no client secrets.
- exact RLS matrix + allow/deny tests.

## Project setup/date/access origins

- project locale/timezone/currency.
- zero/several candidate wedding dates.
- explicit selected date transition.
- target guest count.
- configurable venue criteria.
- one/several private reference origins for access comparison.

## Venues

- quick add/CRUD.
- human code + UUID/external-ID support.
- gallery/table/detail/compare.
- lifecycle/rejection/history.
- independent partner favorites/ratings/personal notes.
- spaces/capacities/dimensions.
- configurable facts/observations/multi-source evidence/confidence/freshness.
- missing-information/verification workflow.
- offers/date pricing/tax semantics.
- candidate-date availability observations.
- contact/interaction/quote tracking.
- contextual access routes/TGV facts.
- remote marketing photos + private uploaded originals.
- documents/tags.
- visit workflow/offline pinning.

## Vendors

- generic vendor CRUD/types/status.
- contacts/interactions/follow-ups.
- offers/components/tax semantics.
- caterer-specific criteria/inclusions.
- linked files/tasks/tags.
- partner opinion support where relevant.

## Guests

- household/person model.
- configurable guest categories/groups.
- priority + attendance probability.
- RSVP lifecycle.
- partner/child grouping.
- expected/cumulative priority statistics.
- transport/accommodation/dietary logistics where useful.
- bulk import/export.

## Basic seating plan

- configurable seating sections.
- tables/capacities.
- one active assignment per guest.
- unassigned/over-capacity readiness checks.
- RSVP invalidation handling.
- table/alphabetical/section export + print.
- offline structured access/edits.

A graphical drag-and-drop floor-plan canvas and automatic optimization remain post-V1.

## Tasks

- member/both/third-party/unassigned ownership.
- todo/in-progress/waiting/blocked/done/cancelled.
- due date/priority/blocker/follow-up.
- links/dependencies/cycle prevention.
- next-action inputs.

## Inbox/quick capture

- fast text/URL/hint capture from global `+`.
- offline persistence.
- explicit idempotent conversion to domain entity.
- duplicate detection before conversion.
- archive/discard/recovery.

## Decisions

- question/options/links.
- owner-specific approvals.
- require-all-owners mode.
- final outcome/rationale.
- lock/reopen/history.
- retained alternatives.
- `discuss together` queue.

## Budget/payments

- configurable categories/items.
- fixed + supported variable formulas.
- named scenarios with date/venue/guest assumptions.
- exactly one optional active operational scenario.
- minimum/probable/maximum/custom scenario classes.
- quote/approved/contracted amounts.
- tax included/excluded/unknown semantics.
- nonrefundable deposit/installments/final balance.
- refundable security deposit separated from final cost.
- payment/refund/credit/return lifecycle including partial refunds.
- due/overdue/paid/remaining/cash-flow views.

## Planning/dashboard

- phases + weighted milestones.
- milestone dependencies/completion rules.
- relative vs fixed deadlines.
- blockers/waiting/next action.
- joint decisions/upcoming tasks/payments.
- meaningful partner changes using per-member activity cursor.
- phase-aware priorities.
- final seating readiness.
- final operational print/export snapshot capability.

## Search

- project-scoped global search for venues/vendors/guests/tasks/decisions/document metadata/Inbox.
- safe deep links.
- cached-only offline search disclosure.
- no third-party analytics/semantic-search dependency.

## Documents/media/tags

- private document upload/linking.
- remote images + private archived copies.
- original/preview/thumbnail semantics.
- duplicate hash/incomplete upload/orphan cleanup.
- privacy-safe external-image loading behavior.
- configurable generic tags.

## Map/access

- stored coordinates.
- status/filter pins.
- basic map venue card.
- external route link.
- reference-origin contextual access observations.
- TGV/transport facts.
- graceful offline/map-provider failure.

## Import/export

- CSV/XLSX/canonical JSON/clipboard/pasted JSON.
- schema/domain detection.
- saved mapping profiles.
- locale/type normalization.
- preview/validation.
- duplicate detection + parent-scoped external IDs.
- non-destructive evidence-aware merge.
- protected-field rules.
- provenance/history/rollback.
- categories/tags/date/scenario/seating support.
- export by major module.
- research-missing-data export.

## Backup/recovery

- documented `.mariage` ZIP-compatible plain format.
- optional media/doc complete archive.
- schema/version/checksums.
- optional password-protected AES-256-GCM client-side container per `operations/BACKUP-FORMAT.md`.
- inspect/verify without mutation.
- restore into controlled recovery target.
- historical version fixtures.

## Offline/local-first

- cached application shell.
- essential project data cache.
- durable structured mutation queue.
- restart/session-expiry survival.
- reconnect/idempotence/explicit conflicts.
- pinned venue-visit data.
- private local cache purged after safe logout.

## Quality/operations

- CI Quality Gate.
- strict TypeScript/lint/format.
- 100% in-scope business-code lines/statements/functions/branches.
- mutation testing critical engines.
- unit/property/integration/DB/RLS/security/E2E/offline/import/backup/migration tests.
- accessibility/performance/browser-device budgets.
- secure supply chain/secret scanning.
- zero-cost quota behavior.
- disaster/incident runbooks.

---

# Explicitly post-V1 unless promoted by ADR/spec

- graphical drag/drop seating-floorplan canvas;
- automatic seating optimization;
- advanced per-guest shuttle scheduling;
- hotel room-block allocation engine;
- rich dedicated wedding-day operations app mode;
- public guest portal;
- temporary vendor-sharing links;
- push notifications;
- AI/OCR automatic contract/quote extraction;
- automatic web venue research from inside Mariage OS;
- internal messaging/chat;
- native App Store/Play Store apps;
- banking/payment integration;
- automated email sending;
- full calendar-provider synchronization;
- public multi-couple SaaS/project creation;
- marketplace/vendor discovery.

---

# V1 release blockers

No cutover if any is true:

- cross-project read/write/reference possible;
- required table/bucket lacks verified RLS;
- unrestricted public users can consume production by creating projects;
- secret/service-role exposed;
- both owners not MFA/recovery ready;
- silent local-edit loss reproducible;
- safe logout can lose pending work or expose prior user's cache;
- backup validation/restore broken;
- existing-data import not reviewable/recoverable;
- supported financial or guest calculation known incorrect;
- payment/refund/scenario semantics unresolved;
- seating finalization can accept duplicate/overcapacity invalid state;
- open Critical/High security defect;
- both partner accounts fail on supported real devices;
- project cannot be portably exported;
- mandatory tests/gates not green;
- known automatic paid-overage path;
- sync/pending/conflict state not understandable;
- unresolved BLOCKING/MAJOR documentation-audit finding affects implemented V1 behavior.

---

# Cutover evidence package

Retain:

1. release commit/version;
2. complete passing CI;
3. RLS/security verification matrix;
4. golden synthetic E2E;
5. real-device smoke tests;
6. backup export/integrity/restore test;
7. encrypted-backup test where enabled;
8. venue reconciliation;
9. guest spreadsheet/statistics reconciliation;
10. vendor reconciliation;
11. budget/payment/scenario reference validation;
12. seating assignment validation/export test;
13. both owner MFA/recovery verification;
14. production signup/project-creation lock verification;
15. pre-cutover legacy archive;
16. V1 `.mariage` recovery export.

Only then is Mariage OS the operational source of truth.