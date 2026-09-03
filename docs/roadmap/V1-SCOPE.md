# V1 Scope

Status: **FROZEN V1 scope for first production cutover — includes guest invitations, RSVP portal and outbound communications**

V1 is not a prototype. It is the first version safe/useful enough to replace fragmented wedding-planning sources as the couple's operational source of truth.

## V1 outcome

Both partners can securely use Mariage OS from supported phone/tablet/desktop devices to:

- understand project status and next action;
- compare venues and candidate dates;
- manage vendors/caterers;
- manage guests/households/RSVP and structured seating;
- generate secure household RSVP links/QR codes;
- send/track invitation and reminder communications through configured Email/SMS/WhatsApp providers;
- let invited households answer through a secure no-account mobile portal;
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
- narrow public/capability guest-RSVP boundary distinct from project-member authentication.

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
- guest RSVP capability tokens use CSPRNG, hash-at-rest, expiry/revocation and narrow allowlisted DTOs.
- provider credentials remain server-side secrets.
- provider webhooks are authenticated/deduplicated before trusted state changes.

## Project setup/date/access origins

- locale/timezone/currency.
- zero/several candidate wedding dates.
- explicit atomic selected-date transition.
- target guest count.
- configurable venue criteria/evaluation priorities.
- one/several private reference origins for access comparison.
- optional Invitations & RSVP setup intent during onboarding.

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
- first-class normalized email/phone contact points.
- invitation/communication state per household.
- bulk import/export without implicit sending.

## Invitations & guest RSVP

- secure household invitation-link lifecycle create/activate/rotate/revoke/expire.
- QR/copy/share fallback with no automatic provider required.
- no-account mobile guest RSVP portal.
- guest-safe DTO; no access to private project application/data.
- household/person attendance response.
- explicit per-household +1/additional-child allowance.
- configurable RSVP deadline/edit policy/questions.
- dietary/accessibility/transport/accommodation/message fields when enabled.
- append-oriented submission history/idempotency.
- response confirmation/edit semantics.
- RSVP updates canonical statistics and invalidate/review seating/budget/planning dependencies as documented.

## Email / SMS / WhatsApp communications

- provider-neutral campaign/template/audience/preflight architecture.
- purposes including invitation, RSVP reminder and information/update.
- safe allowlisted personalization variables.
- exact recipient snapshot before send.
- missing/invalid/suppressed/duplicate contact preflight.
- known external cost estimate where provider exposes reliable data.
- manual or scheduled send model.
- canonical per-recipient states.
- idempotent retries/selective failed-recipient retry.
- email adapter with authenticated production sending-domain readiness.
- SMS adapter with normalized destinations and status callbacks.
- official WhatsApp Business-compatible provider/API only; no personal WhatsApp/Web automation.
- authenticated/deduplicated webhook ingestion.
- suppression of repeatedly invalid/bounced destinations.
- provider/channel health diagnostics.
- send/cost caps; no automatic plan purchase/overage.
- manual secure-link/QR fallback when provider is unconfigured/unavailable.

External provider usage may cost money even though core Mariage OS targets zero-cost infrastructure. This distinction must be explicit in UI/operations.

## QIF — Quick & Intuitive Flow

QIF is an internal Mariage OS acceptance criterion, not an external certification.

For onboarding, guest management, Invitations & RSVP, campaign preparation and guest RSVP:

- primary next action is obvious;
- flow uses wedding language rather than provider/API jargon;
- one primary CTA per focused step;
- sending is impossible without explicit audience/message/channel preview;
- blocked states state what to fix next;
- guest RSVP is mobile-first and accountless;
- result/confirmation is unmistakable;
- no dead-end between Guests → Invitations → Responses → Seating/Budget/next action.

QIF implementation evidence is required at Checkpoint B and final cutover.

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

Provider communication fees are not silently treated as wedding budget items; users may record/link them explicitly if desired.

## Planning/dashboard

- phases + weighted milestones.
- milestone dependencies/completion rules.
- relative vs fixed deadlines.
- blockers/waiting/next action.
- joint decisions/upcoming tasks/payments.
- meaningful partner changes using per-member activity cursor.
- phase-aware priorities.
- seating readiness.
- invitation/RSVP actionable summary (not a provider-debug dashboard).
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
- communication/provider raw debug payloads are not normal global-search content.

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
- optional invitation-card assets use normal media safety rules.

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
- categories/tags/date/scenario/seating/timeline/contact-point support where canonical/module export claims support.
- export by major module.
- missing/stale research export.
- importing contacts does not implicitly create/send a campaign.

Invitation tokens, provider credentials and secret webhook material are never included in ordinary exports. Backup treatment follows explicit security/backup rules.

## Backup/recovery

- documented `.mariage` plain archive format.
- optional media/document full archive.
- manifest/schema/app version/checksums.
- optional password-protected authenticated AES-256-GCM client-side container per `operations/BACKUP-FORMAT.md`.
- inspect/verify without mutation.
- wrong-password/tamper rejection before mutation.
- restore into controlled target.
- historical-version fixtures/migrations.
- communication domain data migrates without restoring active provider credentials/secrets from project backups.

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

Couple-side campaign drafts may be durable locally, but provider sends require server connectivity. Guest RSVP authoritative submit is network-required in V1 unless explicitly redesigned later.

## Quality/operations

- CI Quality Gate.
- strict TypeScript/lint/format.
- 100% in-scope business-code lines/statements/functions/branches.
- mutation testing critical engines.
- unit/property/integration/DB/RLS/security/E2E/offline/import/backup/migration tests.
- guest-link and communication adversarial tests.
- QIF usability review for onboarding/campaign/guest RSVP.
- accessibility/performance/browser-device budgets.
- secure supply chain/secret scanning.
- core zero-cost quota behavior plus explicit provider-cost caps.
- disaster/incident runbooks.
- reviewed V1 scope-change re-freeze before Lot 0.

---

# Explicitly post-V1 unless promoted through reviewed scope change

- graphical drag/drop seating floor-plan canvas;
- automatic seating optimization;
- advanced per-guest shuttle scheduling;
- hotel room-block allocation engine;
- rich dedicated live wedding-day operations mode;
- arbitrary self-registration of uninvited guests;
- temporary vendor-sharing links;
- push notifications;
- AI/OCR automatic contract/quote extraction;
- automatic web venue research from inside Mariage OS;
- internal messaging/chat;
- native App Store/Play Store apps;
- banking/payment integration;
- full calendar-provider synchronization;
- public multi-couple SaaS/project creation;
- marketplace/vendor discovery;
- cold-marketing contact acquisition;
- personal WhatsApp/Web automation.

**Secure invited-household RSVP portal and Email/SMS/WhatsApp invitation/reminder communications are explicitly V1.**

---

# V1 release blockers

No cutover if any is true:

- cross-project read/write/reference possible;
- required table/bucket/function lacks verified authorization;
- unrelated public users can create production projects/consume free-tier resources;
- secret/service-role/provider credential exposed;
- both owners not MFA/recovery ready;
- silent local-edit loss reproducible;
- safe logout can lose pending work or expose prior user's cache;
- backup verification/restore/encrypted integrity path broken;
- existing-data import not reviewable/recoverable;
- supported financial or guest calculation known incorrect;
- guest portal can expose/update another household or internal project data;
- invitation token stored/logged raw or insufficiently protected;
- unauthorized +1/child creation possible;
- campaign can send before frozen-audience/message/channel preview;
- duplicate paid sends reproducible through retry/webhook race;
- forged provider webhook can mutate trusted communication state;
- automatic channel can exceed configured send/cost cap without explicit intervention;
- configured production email sender authentication incomplete;
- configured WhatsApp implementation bypasses official provider/platform requirements;
- payment/refund/scenario/tax semantics unresolved;
- seating can accept duplicate/cross-project/invalid finalized assignments silently;
- timeline ordering/dependencies can silently corrupt operational plan;
- open Critical/High security defect;
- both partner accounts fail on supported real devices;
- representative guest RSVP fails on supported mobile browser;
- project cannot be portably exported;
- mandatory tests/gates not green;
- known automatic paid-overage path;
- sync/pending/conflict state not understandable;
- QIF review fails a primary onboarding/invitation/RSVP flow;
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
9. guest spreadsheet/statistics/contact reconciliation;
10. vendor reconciliation;
11. budget/payment/scenario reference validation;
12. seating validation/export test;
13. event-timeline ordering/export test;
14. quote/contract version/readiness workflow test;
15. both-owner MFA/recovery verification;
16. production signup/project-creation lock verification;
17. guest-link cross-household/expiry/revocation/idempotency security suite;
18. representative mobile guest RSVP/QIF evidence;
19. campaign preview/frozen-audience/duplicate-send tests;
20. production provider authentication/webhook/cost-cap evidence for each enabled automatic channel;
21. controlled synthetic/test-recipient real-channel smoke test before real guest campaign;
22. pre-cutover legacy archive;
23. V1 `.mariage` recovery export.

Only then is Mariage OS the operational source of truth.