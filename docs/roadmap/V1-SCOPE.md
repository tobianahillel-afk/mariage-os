# V1 Scope

Status: **FROZEN V1 scope for first production cutover — implementation gate still CLOSED pending final design review**

V1 is not a prototype. It is the first version safe/useful enough to replace fragmented wedding-planning sources as the couple's operational source of truth.

## V1 outcome

Both partners can securely use Mariage OS from supported phone/tablet/desktop devices to:

- understand project status and next action;
- compare venues and candidate dates;
- manage vendors/caterers;
- manage guests/households/RSVP and structured seating;
- manage tasks, Inbox capture and joint decisions;
- track named budget scenarios, commitments, payments and deadlines;
- manage weighted planning milestones and a structured wedding-day timeline;
- store/link/version/review documents, photos and evidence;
- search authorized project data quickly;
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
- RLS on all project-owned data/storage.
- same-project relational constraints/validated links.
- IndexedDB project/account-scoped local working state.
- queued sync/conflict model.
- PWA manifest/service worker/version lifecycle.
- diagnostics/version information.

## Authentication/security

- browser-safe Supabase authentication flow chosen in Lot 1.
- controlled first-owner bootstrap.
- one-time hashed identity-bound partner invitation.
- unrestricted project creation/signup disabled after owner bootstrap according to deployment policy.
- mandatory owner TOTP MFA before real-data cutover.
- session/re-auth/recovery flows.
- logout pending-work safeguard + private local-cache purge.
- CSP/security headers/no client secrets.
- exact RLS matrix + allow/deny tests.

## Project setup/date/access origins

- locale/timezone/currency.
- zero/several candidate wedding dates.
- explicit atomic selected-date transition.
- target guest count.
- configurable venue criteria/evaluation priorities.
- one/several private reference origins for access comparison.

## Venues

- quick add/CRUD.
- human code + UUID/external-ID support.
- gallery/table/detail/compare/visit.
- lifecycle/rejection/history.
- independent partner favorites/ratings.
- spaces/capacities/dimensions.
- configurable typed facts/observations/multi-source evidence/confidence/freshness.
- deterministic blocking/weighted compatibility + missing-information workflow.
- offers/date pricing/tax semantics.
- candidate-date availability observations.
- contact/interaction/quote tracking.
- contextual access routes/TGV facts.
- remote marketing photos + private uploaded originals.
- documents/tags.
- offline venue visit pinning.

## Vendors

- generic vendor CRUD/types/status.
- contacts/interactions/follow-ups.
- offers/components/tax semantics.
- caterer-specific criteria/inclusions.
- linked files/tasks/tags/budget.
- venue compatibility.
- partner opinions where specified.

## Guests

- household/person model.
- configurable categories/groups.
- priority + attendance probability.
- RSVP lifecycle.
- partner/child grouping.
- expected/cumulative priority statistics.
- transport/accommodation/dietary/accessibility logistics where useful.
- bulk import/export.

## Structured seating

- seating sections/zones.
- tables/capacities.
- one active assignment per guest.
- unassigned/duplicate/over-capacity readiness checks.
- RSVP change review semantics.
- table/alphabetical/section export/print.
- offline structured access/edits according to offline matrix.

Graphical drag-and-drop floor-plan canvas and automatic optimization remain post-V1.

## Tasks

- member/both/third-party/unassigned ownership.
- todo/in-progress/waiting/blocked/done/cancelled.
- due date/priority/blocker/follow-up.
- links/dependencies/cycle prevention.
- deterministic next-action inputs.

## Inbox/quick capture

- fast text/URL/file-reference capture from global entry.
- local/offline persistence.
- explicit idempotent conversion to supported domain entity/command.
- duplicate/context review before conversion where needed.
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
- multiple named scenarios with date/venue/guest/package/component assumptions.
- zero-or-one active operational scenario.
- minimum/probable/high/custom planning views where configured.
- estimate/quote/approved/contracted values.
- tax included/excluded/unknown/not-applicable semantics.
- non-refundable deposit/installments/final balance.
- refundable security deposit separated from final expected cost.
- payment/refund/credit/deposit-return lifecycle including partial refunds.
- due/overdue/paid/remaining/cash-flow views.
- offline financial edits remain explicitly pending until cloud validation.

## Planning/dashboard

- phases + weighted milestones.
- milestone dependencies/completion rules.
- relative vs fixed deadlines.
- blockers/waiting/next action.
- joint decisions/upcoming tasks/payments.
- meaningful partner changes using per-member activity cursor.
- phase-aware priorities.
- seating readiness.
- backup/sync/security warnings only when actionable.

## Structured wedding-day timeline

- timeline items with status/title/description.
- start/end local time and day offsets.
- venue/space/location.
- responsible owner/label.
- linked vendors/contacts.
- dependencies/cycle validation.
- chronological/after-midnight ordering.
- audience/notes/sources.
- frozen export/snapshot for distribution.
- structured offline edits according to offline matrix.

A rich live wedding-day command-center mode remains post-V1.

## Search

- project-scoped global search for authorized venues/vendors/guests/tasks/decisions/document metadata/Inbox and other bounded V1 entities.
- safe deep links.
- cached-only offline search disclosure.
- archive/deletion/privacy rules.
- no third-party analytics/semantic-search dependency.

## Documents/media/tags/contract readiness

- private document upload/linking.
- remote images + private archived copies.
- original/preview/thumbnail semantics.
- duplicate hash/incomplete upload/orphan cleanup.
- privacy-safe external-image loading.
- document date/version/supersession relationships.
- factual review status/checklist for quotes/contracts.
- review items linked to facts/sources/tasks where useful.
- no implication of legal advice/validity.
- configurable generic tags.

## Map/access

- stored coordinates.
- status/filter pins.
- basic map venue card.
- external route link.
- reference-origin contextual access observations.
- TGV/transport facts.
- privacy-safe external request construction.
- graceful offline/map-provider failure.

## Import/export

- CSV/XLSX/canonical JSON/clipboard/pasted JSON.
- schema/domain detection.
- saved mapping profiles.
- locale/type normalization.
- preview/validation.
- duplicate detection + parent-scoped nested external IDs.
- non-destructive evidence-aware merge.
- protected fields.
- provenance/history/rollback.
- categories/tags/date/scenario/seating/timeline support where canonical/module export claims support.
- export by major module.
- missing/stale research export.

## Backup/recovery

- documented `.mariage` plain archive format.
- optional media/document full archive.
- manifest/schema/app version/checksums.
- optional password-protected authenticated AES-256-GCM client-side container per `operations/BACKUP-FORMAT.md`.
- inspect/verify without mutation.
- wrong-password/tamper rejection before mutation.
- restore into controlled target.
- historical-version fixtures/migrations.

## Offline/local-first

- cached application shell.
- essential project-data cache.
- durable structured mutation queue.
- restart/session-expiry survival.
- reconnect/idempotence/explicit conflicts.
- per-workflow offline capability matrix.
- pinned venue-visit data.
- cross-project/account cache isolation.
- private cache purge after safe logout.

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
- final design review gate before Lot 0.

---

# Explicitly post-V1 unless promoted through reviewed scope change

- graphical drag/drop seating floor-plan canvas;
- automatic seating optimization;
- advanced per-guest shuttle scheduling;
- hotel room-block allocation engine;
- rich dedicated live wedding-day operations mode;
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
- required table/bucket/function lacks verified authorization;
- unrelated public users can create production projects/consume free-tier resources;
- secret/service-role exposed;
- both owners not MFA/recovery ready;
- silent local-edit loss reproducible;
- safe logout can lose pending work or expose prior user's cache;
- backup verification/restore/encrypted integrity path broken;
- existing-data import not reviewable/recoverable;
- supported financial or guest calculation known incorrect;
- payment/refund/scenario/tax semantics unresolved;
- seating can accept duplicate/cross-project/invalid finalized assignments silently;
- timeline ordering/dependencies can silently corrupt operational plan;
- open Critical/High security defect;
- both partner accounts fail on supported real devices;
- project cannot be portably exported;
- mandatory tests/gates not green;
- known automatic paid-overage path;
- sync/pending/conflict state not understandable;
- unresolved BLOCKING/MAJOR final-design-review finding affects V1.

---

# Cutover evidence package

Retain at minimum:

1. release commit/version;
2. complete passing CI;
3. RLS/Storage/security verification matrix;
4. golden synthetic E2E;
5. real-device smoke tests;
6. backup export/integrity/restore test;
7. encrypted-backup wrong-password/tamper test;
8. venue reconciliation;
9. guest spreadsheet/statistics reconciliation;
10. vendor reconciliation;
11. budget/payment/scenario reference validation;
12. seating validation/export test;
13. event-timeline ordering/export test;
14. quote/contract version/readiness workflow test;
15. both-owner MFA/recovery verification;
16. production signup/project-creation lock verification;
17. pre-cutover legacy archive;
18. V1 `.mariage` recovery export.

Only then is Mariage OS the operational source of truth.
