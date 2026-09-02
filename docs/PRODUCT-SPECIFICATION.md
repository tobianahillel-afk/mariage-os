# Mariage OS — Frozen V1 Product Specification

Status: **FROZEN V1 DESIGN BASELINE — implementation gate remains CLOSED pending final architecture/product review**

This is the master functional specification for Mariage OS. It is written so a developer, tester, security reviewer or future AI agent can understand the product without prior conversation context.

Specialized normative documents remain authoritative for their domain. This master document defines the product-level contract and reconciles the final pre-code audit. A specialized document may add detail but must not contradict this baseline. Any discovered contradiction is a documentation defect and blocks implementation until resolved or explicitly accepted through ADR/spec change.

---

## 1. Product mission

Mariage OS is a private, collaborative, local-first wedding-planning PWA for two partners planning one wedding together.

It must centralize the information required to **understand, decide and act** across:

- venues;
- vendors/caterers;
- guests and households;
- budget, scenarios and payments;
- tasks and waiting states;
- joint decisions;
- planning/milestones;
- wedding-day timeline;
- seating assignments;
- documents/media;
- evidence/sources;
- map/access;
- Inbox/quick capture;
- import/export/backup/recovery.

The product is not a generic project-management suite. It is the couple's wedding decision-and-execution system.

At any time either partner should be able to answer quickly:

1. Where are we?
2. What is decided?
3. What is still unknown, stale or contradictory?
4. What blocks progress?
5. What are we waiting for?
6. What should I/we do next?
7. Who owns it and by when?
8. What will it cost?
9. What is quoted, contracted, paid and still due?
10. Which decisions need both partners?
11. Why was a previous decision made?
12. Is our critical data backed up and synchronized?

---

## 2. Primary users and deployment model

### Two owner accounts

V1 is optimized for exactly two primary owners. Each partner has:

- an individual authenticated identity;
- independent ratings/favorites/preferences;
- individual task ownership;
- individual activity cursor/history;
- access to the same authorized project data;
- participation in decisions requiring both approvals.

One partner's opinion must never overwrite the other's because it was saved later.

### Single-couple public deployment

The web application/repository can be public, but the production data service is **not a public SaaS signup surface**.

V1 uses a controlled bootstrap/invitation flow so unrelated Internet users cannot create arbitrary projects or consume the couple's free-tier resources. After both production owners are enrolled, open signup/project creation is disabled unless deliberately reopened for a controlled recovery/admin flow.

---

## 3. Hard constraints

These constraints are release-binding:

- Normal production operation targets **€0/month**.
- Real wedding data never belongs in the public GitHub repository.
- Supabase production is the shared cloud source of truth.
- IndexedDB is local working/cache/offline state, not a separate permanent authority.
- PostgreSQL/Storage RLS enforces project authorization; UI hiding is never sufficient.
- Cross-project references are forbidden at both authorization and referential-integrity levels.
- Important facts can retain multiple observations, provenance, confidence and freshness.
- `unknown`, `false`, `not_applicable` and `conflict` are distinct.
- Stronger confirmed/contractual evidence is not silently replaced by weaker input/import data.
- Financial arithmetic uses exact minor-unit semantics, never authoritative binary floating point.
- Import, merge, rollback and synchronization behavior is explicit and non-destructive by default.
- Confirmed local edits are never silently lost on reconnect, session expiry or PWA update.
- Public/private exports use explicit allowlists.
- The project remains portable through open canonical exports and `.mariage` backups.
- Required quality/security gates cannot be bypassed for production convenience.

---

## 4. Information architecture

### Prepare

- Venues
- Vendors
- Guests
- Seating

### Pilot

- Dashboard
- Tasks
- Decisions
- Budget
- Planning
- Wedding timeline

### Resources

- Map
- Documents
- Inbox
- Search
- Import/Export

### System

- Settings
- Backup/Restore
- Diagnostics
- Security

Mobile prioritizes Home, Venues, Tasks, Budget and More. Routes are deep-linkable after authentication and must restore logical context safely.

The authoritative route/state matrix is `docs/ux/SCREEN-CONTRACTS.md`.

---

## 5. Dashboard contract

Dashboard is a prioritization surface, not an analytics wall. It prioritizes:

1. countdown/current phase;
2. next useful action;
3. blockers;
4. joint decisions;
5. waiting-external items;
6. upcoming tasks/payments;
7. budget/scenario summary;
8. weighted milestone progress;
9. meaningful partner changes since the member's last activity cursor;
10. backup/sync/security warnings only when genuinely actionable.

No fake urgency and no opaque AI ranking. Ranking must be deterministic/explainable.

---

## 6. Venue management

A venue is a first-class decision entity with:

- stable UUID and optional human code such as `S32`/`P10`;
- lifecycle/rejection reason/history;
- location and coordinates;
- partner-specific ratings/favorites;
- multiple spaces with dimensions/capacities;
- typed criteria/facts with evidence;
- multiple offers, components and date/day pricing;
- availability observations/options;
- contacts/interactions;
- route/access observations from one or more reference origins;
- remote and privately archived photos;
- documents and versions;
- linked tasks/decisions/budget items;
- visit mode and notes;
- missing-information analysis;
- compatibility calculation and explanation.

Current wedding use case must support at least:

- 150–200 seated guests;
- one large shared reception room;
- two distinct dance areas in the same room;
- outdoor chuppah;
- indoor/rain backup;
- mehitsa feasibility/provision;
- external caterer allowed and exclusive-caterer constraints;
- heat/winter/air-conditioning/heating/ventilation;
- room aesthetics and character;
- elevated/panoramic situation;
- Paris/reference-origin access;
- TGV transfer/accessibility;
- parking/accommodation;
- music end time/acoustic constraints;
- furniture/table/chair/linen/tableware inclusions;
- kitchen/caterer logistics;
- quote/contact/visit progress.

Blocking criteria can never be hidden by a high weighted score. Compatibility logic is defined by `domain/CRITERIA-EVALUATION.md` and `domain/DEFAULT-CRITERIA.md`.

Rejected venues are archived history, not deleted data.

---

## 7. Vendor/caterer management

Vendors use a generic supplier model with typed specialization. V1 supports caterer, photo/video, DJ/music, florist/decorator, transport, accommodation and other providers.

Vendors support:

- lifecycle/status;
- multiple contacts/interactions;
- quote/request/clarification/follow-up state;
- multiple offers/packages/components;
- documents and versions;
- linked tasks/decisions/budget;
- venue compatibility;
- reliability/communication notes/ratings where useful.

Caterer support includes price per adult/child, guest minimums, buffet/table service, meat/menu availability, drinks, cake, servers, tableware, linens, setup/cleanup, travel/tasting fees, kosher supervision/compatibility and venue kitchen/logistic requirements.

---

## 8. Guests, households and seating

The guest model supports:

- households/invitation groups;
- individual guests;
- categories/groups;
- priorities;
- attendance probability;
- RSVP lifecycle;
- partner/child relationships;
- age group;
- transport/accommodation needs;
- dietary/accessibility notes only when useful;
- expected attendance;
- cumulative priority statistics;
- bulk import/export.

Names are data, never reliable unique identifiers. Ambiguous same-name guests are not auto-merged.

### Seating in V1

V1 includes a **non-visual structured seating model**:

- sections/zones;
- tables;
- table capacity;
- guest assignments;
- unassigned/over-capacity validation;
- simple statistics/export.

A drag-and-drop graphical seating canvas/automatic optimization is post-V1.

---

## 9. Budget, offers, scenarios and payments

The finance subsystem distinguishes:

- estimated;
- quoted;
- approved/negotiated;
- contracted;
- planned payment;
- due/overdue;
- processing/manual-pending;
- paid;
- partially refunded;
- refunded/cancelled;
- refundable security deposit/caution;
- returned deposit/credit.

Supported pricing includes fixed, per guest, per adult, per child, per table, per hour, quantity/unit and minimum-plus-variable/package logic.

### Named scenarios

Multiple named scenarios can coexist. Each can carry:

- candidate date;
- candidate venue;
- planning guest count;
- selected vendor/venue offers;
- included/optional components;
- assumptions/notes;
- active/inactive status.

Scenario recalculation never rewrites historical quotes or contracted truth.

Tax semantics are explicit (`included`, `excluded`, `unknown`, `not_applicable`) and never guessed.

Dashboard/budget outputs distinguish probable/final expected cost, contractual commitment, paid amount, remaining balance, refundable cash immobilization, upcoming cash flow and contingency.

---

## 10. Tasks, waiting and decisions

### Tasks

Tasks support owner (`partner`, `both`, `third_party`, `unassigned`), status, priority, due date, dependencies, blockers, `waiting_for`, follow-up date, linked entities and history.

`waiting_external` is not presented as unfinished personal work until follow-up becomes actionable.

### Decisions

Decisions support question, options, linked evidence/entities, deadline, individual approvals, require-both mode, final option/result, rationale, alternatives, lock/reopen history and `discuss together` queue.

A joint decision cannot finalize before required approvals exist.

---

## 11. Planning, milestones and wedding-day timeline

Planning distinguishes phases, weighted milestones, tasks, vendor deadlines and financial deadlines.

Milestones can have dependencies, links, fixed or relative dates, completion rules and weights. Progress is weighted; low-value microtasks cannot create fake project completion.

### Wedding-day timeline in V1

V1 contains a structured timeline with:

- title/description/status;
- start/end local time and next-day offsets;
- venue/space/location;
- responsible owner/label;
- linked vendors/contacts;
- dependencies;
- audience/notes/sources;
- chronological validation.

A frozen export/snapshot can be produced for distribution. A dedicated advanced live day-of operations mode remains post-V1.

---

## 12. Documents, contracts and media

Documents include quotes, contracts, invoices, plans, menus and evidence. Media includes venue marketing photos, visit photos, inspiration and generated derivatives.

Requirements:

- private by default;
- safe MIME/type/size handling;
- no imported active content execution;
- same binary can link to multiple entities;
- originals remain distinct from thumbnails/derivatives;
- exact-byte dedup may use hash;
- interrupted uploads are not treated as committed;
- superseded/revised documents retain history;
- remote images are nonessential external references and must not expose private project data through URLs/referrers.

### Contract readiness

For important quotes/contracts, the app supports a factual readiness checklist before signature/confirmation (identity/date/location/price/tax/payment/cancellation/postponement/service scope/capacity/caterer constraints/music/access/etc.).

This is planning/data validation, not legal advice.

---

## 13. Facts, evidence and criteria

Facts use typed definitions and retained values backed by append-oriented observations. One observation may cite multiple sources.

Sources can include contract, written confirmation, quote, official website, phone/in-person observation, specialist directory and unsourced estimate/import.

Critical rules:

- retain conflicting evidence;
- preserve historical observations;
- explicit retained-value resolution;
- track freshness/verification;
- type-check fact values;
- never use a priority label such as `blocking-negative`; desirability is encoded by the criterion evaluation rule.

Compatibility output separates:

- blocking status: PASS/FAIL/UNKNOWN;
- weighted score;
- data completeness/evidence readiness;
- human-readable explanation.

---

## 14. Map and access

Venue coordinates are stored. Maps support pins, filters, selected-card access and external directions while gracefully degrading to list/text when tiles/network are unavailable.

Access data can be contextual by origin/mode, including driving time, distance, TGV station/transfer, public transport, taxi/VTC, shuttle, coach, parking, airport and accommodation facts.

Changing a default origin can recalculate derived convenience summaries without rewriting historical route observations.

---

## 15. Inbox and search

### Inbox

Inbox supports low-friction capture of a note/link/idea/file reference before classification. An Inbox item can later be converted idempotently to a task, venue/vendor candidate, document link or other supported entity without losing original provenance.

### Search

Global search can find authorized project entities by appropriate safe fields such as name/code/title/tags and selected notes/metadata. Search must respect RLS, offline availability, privacy classification and deleted/archived visibility rules.

---

## 16. Import/export

Supported V1 inputs include:

- CSV;
- XLSX;
- canonical Mariage OS JSON;
- clipboard table;
- pasted JSON;
- document/media upload;
- `.mariage` restore.

Canonical JSON is versioned. Nested external IDs are scoped by source namespace, entity type and parent context.

Import lifecycle:

1. select/read;
2. detect;
3. parse;
4. map;
5. validate;
6. match/deduplicate;
7. compute merge plan;
8. preview;
9. commit;
10. record provenance/change history;
11. allow safe rollback/reconciliation.

Missing fields/rows do not mean deletion. Locked/contractual truth is protected. Ambiguous duplicates require review. Spreadsheet active content is never executed. CSV export mitigates formula injection.

The user can export missing/stale research fields and re-import enriched results.

---

## 17. Backup, restore and portability

`.mariage` is the open recovery format.

It supports:

- structured project data;
- optional documents/media;
- versioned manifest;
- checksums;
- format/schema/app versions;
- restore validation;
- old-version migration;
- safe rejection of unsupported future versions.

Full private backups support client-side authenticated encryption using the normative `operations/BACKUP-FORMAT.md` contract.

Backup is not considered trustworthy until restore testing reconstructs a golden project semantically.

---

## 18. Local-first/offline/PWA

The user interaction model writes eligible changes into durable local state before cloud acknowledgement.

Visible sync states include synchronized, synchronizing, offline/pending, conflict and error.

Offline V1 supports cached essential data, structured edits, tasks, selected/pinned venue visits and a durable mutation queue. Media can remain separately pending.

Service-worker/app-shell versions are explicit. A PWA update cannot destroy pending local work or continue incompatible code indefinitely against a changed schema.

Logout policy: do not silently discard pending work. Once synchronized or explicitly exported/discarded, private project cache is purged from that browser profile according to the security/local-data contract.

---

## 19. Security and privacy

Security documentation in `docs/security/` is normative. Minimum V1 requirements include:

- controlled production onboarding/invitations;
- individual accounts;
- MFA/TOTP rollout for owners;
- reauthentication for critical operations;
- RLS for every project-scoped DB table and private Storage;
- same-project FK/polymorphic validation;
- no browser service-role/secret key;
- restrictive CSP/security headers;
- safe text/content rendering;
- file validation and no macro/active execution;
- privacy-minimized diagnostics;
- no behavioral advertising trackers;
- supply-chain controls;
- OWASP ASVS 5.0 evidence matrix before cutover;
- no known accepted Critical/High exploitable release vulnerability.

---

## 20. Free-tier behavior

The app protects the zero-cost goal:

1. warn as free quotas approach risk thresholds;
2. preserve auth/sync/structured business data first;
3. restrict/defer large nonessential media before essential edits;
4. prefer remote references for public marketing imagery;
5. never automatically enable paid upgrades/overages.

Displayed quota values must be measured/known; fake precision is forbidden.

---

## 21. UX contract

The interface is simpler than the data model:

- summary first, detail on demand;
- minimal quick-add rather than giant mandatory forms;
- autosave/drafts for long editing;
- touch-friendly mobile controls;
- keyboard/focus support on desktop;
- no color-only semantics;
- explicit loading/empty/offline/error/permission/conflict states;
- proportional confirmation for risky actions;
- undo for safe reversible actions;
- external navigation must not lose local drafts;
- user-facing language avoids DB/sync implementation jargon.

---

## 22. V1 scope boundary

V1 includes secure cloud collaboration, venues, vendors, guests/households, basic structured seating, budget/scenarios/payments, tasks, decisions, planning/milestones, wedding timeline, documents/media, Inbox/search, map/access, imports/exports, offline/local-first/PWA and backup/restore.

Explicitly post-V1 unless promoted through reviewed scope change:

- drag-and-drop graphical seating canvas/automatic seating optimization;
- advanced transport/hotel allocation engine;
- dedicated live wedding-day operations mode;
- guest portal/vendor sharing links;
- push notifications;
- AI/OCR automatic contract extraction;
- in-app automated Internet venue research;
- internal messaging;
- native App Store/Play Store application;
- banking/payment integration;
- automated email/calendar-provider synchronization.

---

## 23. Quality definition

A feature is complete only when its applicable:

- product behavior;
- data invariants;
- authorization/security controls;
- migration/import/export semantics;
- offline/error states;
- unit/property/integration/RLS/security/E2E tests;
- coverage/mutation requirements;
- accessibility/performance/browser requirements;
- documentation/traceability;
- release gates

are satisfied.

Critical silent data loss, cross-project access, broken supported restore, incorrect supported financial calculations, exposed secrets, unrecoverable migrations or incompatible stale PWA behavior are release blockers.

---

## 24. Source-of-truth cutover

Mariage OS becomes the operational wedding source of truth only after:

- full required CI/security gates pass;
- both owners can operate it on supported real devices;
- current venue/guest/vendor sources are imported and reconciled;
- critical guest/budget calculations match trusted references;
- backup integrity and restore are demonstrated;
- owner MFA/recovery procedures are verified;
- pre-cutover legacy archive is preserved;
- production `.mariage` recovery export exists;
- no V1 release blocker remains.

Before cutover, existing spreadsheets/research sources remain authoritative legacy data.

---

## 25. Freeze and change-control rule

This specification is the **V1 frozen design baseline**, but frozen does not mean immune to evidence.

Before implementation starts, the separate final architecture/product review must pass and close every known BLOCKING/MAJOR issue. Lot 0 must **not** begin merely because this file says `FROZEN`.

After implementation starts, any discovered ambiguity that materially affects behavior, schema, security, synchronization, import/export, migration, privacy or V1 scope requires:

1. specification/requirement update;
2. impact analysis;
3. ADR if architectural;
4. migration compatibility review where needed;
5. updated acceptance tests;
6. normal reviewed merge.

No developer or AI agent may invent material behavior silently.