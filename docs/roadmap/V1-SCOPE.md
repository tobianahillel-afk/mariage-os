# V1 Scope

Status: **Binding scope for the first production cutover**

V1 is not a prototype. It is the first version considered safe and useful enough to replace fragmented wedding-planning sources as the couple's operational source of truth.

V1 scope is intentionally broad enough to run the wedding project, but narrow enough to avoid building a generic project-management platform.

---

## V1 outcome

At V1 cutover both partners can securely use Mariage OS from supported phone/tablet/desktop devices to:

- understand wedding status;
- manage and compare venues;
- manage vendors including caterers;
- manage guests/households and attendance statistics;
- manage tasks, waiting items and joint decisions;
- track budget, commitments, payments and deadlines;
- store/link documents and photos;
- import/export existing/new data safely;
- work through short offline periods and synchronize safely;
- recover the project from a validated portable backup.

---

## Required V1 capabilities

### Platform foundation

- Vite + TypeScript static frontend.
- Cloudflare Pages deployment.
- Supabase Auth/PostgreSQL/Storage/Realtime.
- private project membership.
- RLS for all project-owned data.
- local IndexedDB working state.
- synchronization queue and conflict model.
- PWA manifest/service worker.
- diagnostics/version information.

### Authentication/security

- production authentication.
- invitation into project.
- two owner accounts.
- MFA/TOTP support and owner rollout according to security spec.
- safe session expiry/re-auth flows.
- secure production headers/CSP.
- no production secrets in client/repository.
- mandatory RLS/security tests.

### Venues

- CRUD/minimal quick add.
- human code and stable ID.
- gallery/table/detail views.
- lifecycle status/rejection reason/history.
- partner favorites/ratings.
- spaces/capacities/dimensions.
- configurable facts/criteria.
- source observations/confidence/freshness.
- missing-information view.
- offers/date pricing.
- quote/contact tracking basics.
- photos: remote references + private uploaded photos.
- documents.
- comparison of up to practical small shortlist.
- coordinates/map integration.

### Vendors

- generic vendor CRUD.
- vendor types.
- contacts/interactions.
- quotes/offers.
- caterer-specific facts/inclusions.
- linked files.
- linked tasks/waiting state.

### Guests

- household + person model.
- group/category.
- priority.
- attendance probability.
- RSVP status.
- partner/child grouping.
- expected-attendance statistics.
- cumulative priority statistics.
- bulk import/export.
- basic logistics/dietary notes.

### Tasks

- personal/joint/third-party owner semantics.
- todo/in-progress/waiting/blocked/done/cancelled.
- due dates and priorities.
- linked entities.
- dependencies/blocker semantics.
- follow-up date for waiting items.
- next-action prioritization inputs.

### Decisions

- question/options.
- linked entities.
- individual approvals.
- require-both mode.
- final outcome/rationale.
- locked/final lifecycle.
- retained alternatives/history.
- `discuss together` queue.

### Budget/payments

- categories/items.
- fixed and variable pricing modes required by spec.
- estimate/quote/approved/contracted states.
- payment schedule.
- paid/remaining views.
- refundable deposit distinction.
- cash-flow upcoming deadlines.
- scenario recalculation by guest count/date where inputs exist.

### Planning/dashboard

- wedding date/project timezone settings.
- phases/milestones.
- weighted progress.
- blockers.
- waiting items.
- next action.
- joint decisions.
- upcoming tasks/payments.
- meaningful partner activity.
- phase-aware prioritization basics.

### Documents/media

- private document upload/linking.
- venue/vendor document association.
- remote photo references.
- private photo originals.
- thumbnails/previews.
- duplicate hash support.
- orphan/incomplete upload safety.

### Map/access

- stored venue coordinates.
- status/filter pins.
- basic venue card from map.
- external route link.
- stored access/TGV facts.
- graceful network/offline map failure.

### Import/export

- CSV.
- XLSX.
- canonical JSON.
- clipboard table/pasted JSON entry where specified.
- type/schema detection.
- mapping preview.
- validation.
- duplicate detection.
- non-destructive merge.
- provenance.
- import history.
- rollback semantics.
- export by major module.
- research-missing-data export.

### Backup/recovery

- structured `.mariage` backup.
- optional full media/doc archive.
- manifest/schema version.
- checksums/integrity validation.
- restore into a controlled target.
- supported-old-version migration fixtures.

### Offline/local-first

- local cached shell.
- essential cached project data.
- queued structured edits.
- restart-safe pending queue.
- reconnect.
- explicit conflicts.
- session-expiry preservation.
- selected/pinned venue visit data offline.

### Quality/operations

- CI Quality Gate.
- 100% in-scope business-code coverage policy.
- mutation testing critical engines.
- unit/property/integration/RLS/security/E2E test suites.
- browser/device support matrix.
- accessibility checks.
- performance budgets.
- backup/recovery drills in tests.
- free-tier quota behavior.

---

## Explicitly post-V1 unless promoted by ADR

The following are useful but not required for source-of-truth cutover:

- visual drag-and-drop seating-plan canvas;
- automatic seating optimization;
- advanced per-guest shuttle scheduling;
- hotel-room block allocation engine;
- dedicated wedding-day operations mode;
- public guest portal;
- temporary vendor-sharing links;
- push notifications;
- AI/OCR automatic contract/quote extraction;
- automatic internet venue research from inside the application;
- messaging/chat inside Mariage OS;
- native App Store/Play Store application;
- payments/banking integration;
- automated email sending;
- full calendar provider synchronization;
- marketplace/vendor discovery product.

The data model should avoid preventing these future additions, but V1 implementation must not prematurely build them.

---

## V1 release blockers

V1 may not cut over if any of the following is true:

- known cross-project access is possible;
- any required project table/bucket lacks verified RLS;
- production secret appears in repository/client;
- silent local-edit loss is reproducible;
- supported backup restore is broken;
- existing-data import is not reversible/reviewable;
- supported financial calculation is known incorrect;
- critical guest-statistic calculations differ from validated reference without resolution;
- open Critical/High security defect remains;
- both partner accounts cannot operate on real supported devices;
- production data cannot be exported independently;
- required tests/quality gates are not green;
- free-tier design has a known automatic paid-overage path;
- the application cannot explain sync errors/pending state to the user.

---

## Cutover evidence package

Before declaring V1 live, retain evidence of:

1. release commit/version;
2. complete passing CI run;
3. RLS/security verification;
4. synthetic golden-project E2E result;
5. real-device smoke test checklist;
6. backup export + integrity check + restore test;
7. imported venue reconciliation summary;
8. guest spreadsheet reconciliation summary;
9. vendor initial-data reconciliation summary;
10. budget/statistics validation against trusted reference inputs;
11. production owner MFA/account-recovery verification;
12. pre-cutover legacy archive;
13. V1 `.mariage` recovery export.

Only then is Mariage OS the operational source of truth.
