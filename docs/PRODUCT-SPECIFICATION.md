# Mariage OS — Master Product Specification

Status: **Normative specification for V1**

This document is the master functional specification for Mariage OS. It is intentionally written so that a developer, tester, security reviewer or future AI agent can understand what must be built without access to prior conversations.

If this document conflicts with a more specialized normative document, the specialized document wins for that specific domain. Any conflict must then be resolved by updating this master specification.

---

## 1. Product mission

Mariage OS is a private, collaborative, local-first wedding-planning progressive web application designed primarily for two partners planning one wedding together.

The product is not a generic project-management suite. It is a decision and execution system for a wedding.

At any time, either partner must be able to answer quickly:

1. Where are we?
2. What has already been decided?
3. What is still unknown or unreliable?
4. What is blocking progress?
5. What should we do next?
6. Who owns that action?
7. By when?
8. What will it cost?
9. What is already contractually committed?
10. What has already been paid?
11. What information requires both partners to agree?
12. Why was a past decision made?

The product must optimize for three verbs: **Understand → Decide → Act**.

---

## 2. Primary users

### 2.1 Couple owners

The normal project has two owner members. Each owner has:

- their own identity;
- individual ratings and favorites;
- individual task ownership;
- individual activity history;
- access to all project data;
- ability to participate in joint decisions.

One partner's opinion must never overwrite the other's opinion merely because it was saved later.

### 2.2 Future limited roles

Viewer/editor roles may be added for parents or professionals, but are not required for the initial functional cutover unless explicitly promoted into V1 scope.

No limited-role feature may weaken the core project-isolation model.

---

## 3. Hard product constraints

The following are binding constraints:

- Normal operation must target **€0/month** on the chosen free tiers.
- The same private data must be accessible from phone, tablet and desktop.
- Real wedding data must never be stored in the public GitHub repository.
- Supabase production is shared cloud truth; IndexedDB is local working/offline state.
- The application must remain useful during temporary network loss.
- The application must make synchronization state visible.
- No destructive import, merge or synchronization behavior may be silent.
- Important facts must support provenance, confidence and freshness.
- `unknown`, `false`, `not applicable` and `conflict` are distinct states.
- Stronger confirmed/contractual evidence must not be silently replaced by weaker imported evidence.
- Financial calculations must use exact monetary semantics, not floating-point business arithmetic.
- Real production authorization is enforced in PostgreSQL/Storage RLS, not only UI checks.
- Critical functionality must be deterministic and testable.
- Required quality gates may not be bypassed for production releases.
- The product must remain exportable and recoverable without vendor lock-in.

---

## 4. Information architecture

Desktop primary navigation:

### Prepare
- Venues
- Vendors
- Guests

### Pilot
- Dashboard
- Tasks
- Decisions
- Budget
- Planning

### Resources
- Map
- Documents
- Import/Export
- Ideas/Inbox when implemented

### System
- Settings
- Diagnostics

Mobile navigation prioritizes:
- Home
- Venues
- Tasks
- Budget
- More

Routes must be deep-linkable. Refreshing `/venues/<id>` must return to the same logical entity after authentication.

---

## 5. Dashboard contract

The dashboard is a prioritization surface, not an analytics wall.

It must present, in priority order:

1. wedding countdown / current project phase;
2. next most useful action;
3. blockers;
4. joint decisions awaiting attention;
5. items waiting on external parties;
6. upcoming deadlines/payments;
7. budget summary;
8. weighted progress by wedding area;
9. meaningful changes by the other partner since last visit.

The dashboard must not create fake urgency. Red/critical alerts are reserved for genuine overdue, blocking, security, financial or data-integrity issues.

The dashboard must become phase-aware. What matters at J-300 is different from J-7.

---

## 6. Venue management

Venues are a first-class decision domain.

Each venue supports:

- stable database ID;
- optional human code such as `S32` or `P10`;
- identity and contact information;
- geographic coordinates;
- status/lifecycle;
- individual partner ratings/favorites;
- multiple physical spaces;
- capacities per space/configuration;
- criteria/facts with provenance;
- multiple offers and date-dependent pricing;
- availability observations;
- media and documents;
- contacts/interactions;
- linked tasks and decisions;
- rejection reason/history;
- visit notes;
- missing-information analysis;
- comparison membership;
- import provenance.

The application must distinguish the commercial maximum capacity of a venue from suitability for the couple's actual configuration.

For the current wedding use case, venue evaluation must be capable of representing at least:

- 150–200 seated guests;
- one large shared reception room;
- two distinct dance-floor areas in that same room;
- external caterer allowed;
- outdoor chuppah/civil-ceremony suitability;
- rain plan;
- climate/heat/winter suitability;
- room aesthetics;
- elevated/panoramic location;
- accessibility from Paris;
- nearby TGV station;
- station-to-venue transfer;
- parking;
- accommodation;
- music end time and acoustic constraints;
- furniture/inclusions;
- kitchen/caterer facilities;
- mehitsa feasibility/provision;
- quote/contact progress.

A rejected venue remains searchable and must preserve the rejection reason. Rejection is not deletion.

---

## 7. Vendor management

Vendors use a generic vendor model with type-specific attributes.

Supported categories include at minimum:

- caterer;
- photographer/videographer;
- DJ/music;
- florist/decorator;
- transport;
- accommodation;
- other wedding service providers.

A vendor can have:

- multiple contacts;
- multiple offers/quotes;
- documents;
- tasks;
- interactions;
- due dates;
- reliability notes;
- compatibility links to venues;
- package/inclusion details.

Caterers require richer support for price-per-person, servers, drinks, cake, tableware, kosher constraints and venue compatibility.

---

## 8. Guest and household management

The system models both households and individual guests.

It must support:

- family/group structure;
- priorities;
- probability of attendance;
- RSVP lifecycle;
- partner/children relationships;
- age group;
- dietary/logistical notes where necessary;
- transportation/accommodation needs;
- table assignment in later seating features;
- cumulative priority statistics;
- expected-attendance calculations;
- bulk import/export.

Household grouping must prevent duplicated invitation management while retaining individual attendance states.

Guest data is personal data and must never appear in public repository fixtures.

---

## 9. Budget, commitments and payments

The financial model must distinguish:

- estimate;
- quoted amount;
- approved amount;
- contracted amount;
- partially paid;
- paid;
- refunded/cancelled;
- refundable deposits/cautions;
- fixed vs variable cost.

Variable calculation modes must include:

- fixed;
- per guest;
- per table;
- per hour;
- quantity × unit price;
- minimum/package logic where required.

Changing guest count or date must recompute derived scenarios without rewriting historical quotes.

The application must provide:

- budget total;
- probable/minimum/max reasonable scenarios where configured;
- committed amount;
- paid amount;
- remaining contractual amount;
- upcoming cash-flow deadlines;
- cost-per-guest derived views.

Money semantics are defined by `domain/MONEY.md`.

---

## 10. Tasks and waiting states

Tasks are executable work. They are not decisions.

A task supports:

- title/description;
- owner: partner A, partner B, both, or third party;
- status;
- due date;
- priority;
- dependencies;
- linked domain entity;
- blocker status;
- waiting-for party;
- follow-up date;
- history.

Required statuses include:

- todo;
- in progress;
- waiting externally;
- blocked;
- done;
- cancelled.

A task that is waiting on a vendor must not appear as unfinished personal work without context.

---

## 11. Decisions

A decision captures a choice, not merely an action.

It supports:

- question/title;
- options;
- evidence/linked entities;
- deadline;
- whether both partners must approve;
- each partner's vote/approval;
- final outcome;
- rationale;
- alternatives retained;
- locked/final state;
- history.

A final critical decision must retain why it was taken.

The system must support an explicit `discuss together` queue.

---

## 12. Planning and milestones

Planning must distinguish:

- high-level wedding phases;
- weighted milestones;
- tasks;
- vendor-specific deadlines;
- payment deadlines.

Progress must not be a raw percentage of tasks completed. Foundational milestones carry greater weight than decorative finishing tasks.

The product must be able to represent phases such as:

- framing;
- venue/date;
- vendors;
- invitations/RSVP;
- logistics;
- finalization;
- wedding week;
- wedding day;
- post-wedding.

---

## 13. Documents and media

Documents and media are separate concepts.

Documents include:
- quotes;
- contracts;
- invoices;
- brochures;
- plans;
- menus;
- evidence/proofs.

Media includes:
- venue photos;
- visit photos;
- inspiration images;
- thumbnails/previews.

For imported photos:

- original bytes are preserved when explicitly stored;
- derived thumbnails/previews may be compressed;
- source/provenance is retained;
- externally hosted images may remain URL references to protect free storage quota;
- important final-candidate images may be explicitly archived privately.

Unsafe active content must not be executed.

---

## 14. Map and accessibility

Venue coordinates are stored rather than geocoded at every render.

Map functionality must support:

- venue pins;
- status filters;
- region filters;
- selected-venue summary;
- graceful degradation when map tiles/network are unavailable;
- routing links to external map applications.

Accessibility facts can include:

- driving time from configurable origins;
- nearest TGV station;
- train journey notes;
- transfer time;
- public-transport feasibility;
- shuttle feasibility;
- parking;
- nearby accommodation.

The map is useful, but never critical to core data access.

---

## 15. Sources, evidence and confidence

Important factual values must be able to retain observations instead of being flattened into one unexplained value.

Example:

- official website: room = 300 m²;
- directory: room = 250 m²;
- venue email: room = 300 m².

The system retains all observations and selects/displays a retained value according to explicit evidence rules.

Evidence levels can represent, in increasing practical strength:

- estimate/personal inference;
- third-party directory;
- official website;
- direct verbal confirmation;
- direct written confirmation;
- quote;
- signed contract.

A stronger contractual/confirmed observation is not silently overwritten by a weaker import.

Facts may become stale according to domain-specific freshness policy.

---

## 16. Missing-information engine

For entities such as venues/vendors, the product must identify missing critical facts.

It must distinguish:

- unknown critical requirement;
- known negative requirement;
- conflicting evidence;
- stale evidence;
- optional missing information.

The user can generate suggested follow-up questions/tasks from missing information, but automation must remain reviewable rather than silently creating uncontrolled work.

---

## 17. Import/export

Import/export is a core product subsystem.

Supported entry modes:

- CSV;
- XLSX;
- canonical Mariage OS JSON;
- `.mariage` backup;
- clipboard table;
- pasted JSON;
- media/document upload.

Canonical automated exchange format is versioned Mariage OS JSON.

Import lifecycle:

1. choose/read locally;
2. detect type/schema;
3. parse;
4. map fields;
5. validate;
6. detect duplicates;
7. compute merge plan;
8. preview all meaningful changes;
9. commit transaction;
10. retain provenance/import history;
11. allow safe rollback where possible.

Default import semantics are non-destructive:

- missing rows never imply deletion;
- repeated imports must be idempotent when stable IDs/hash indicate same input;
- locked critical decisions are protected;
- stronger existing evidence is preserved;
- ambiguous duplicates require human resolution.

The user must be able to export missing/stale data for external research and later re-import completed results.

---

## 18. Offline/local-first behavior

The UI writes to local working state first so interactions remain fast and resilient.

Synchronization state must be visible as one of:

- synchronized;
- synchronizing;
- offline with pending mutations;
- conflict;
- synchronization error.

Offline mode must support at minimum:

- opening cached essential data;
- viewing pinned/recent venue information;
- editing text/facts/tasks;
- completing visit checklist actions;
- queueing mutations;
- later synchronization.

Media uploads may remain pending separately.

No confirmed local edit may disappear silently after reconnect.

---

## 19. Security and privacy

Security requirements are normative and defined in `docs/security/`.

Minimum product expectations:

- email-based authentication;
- MFA/TOTP for production owners once enabled by rollout policy;
- private project membership;
- RLS on all project-owned data;
- private Storage policies;
- no service-role/secret key in browser;
- no execution of imported files;
- restrictive CSP;
- no third-party tracking analytics;
- privacy-preserving diagnostics;
- strong confirmation/reauthentication for destructive critical actions;
- synthetic public test data only.

---

## 20. Free-tier behavior

The app must actively protect the €0/month operating goal.

If quotas approach limits:

1. warn before impact;
2. prioritize essential structured data;
3. defer/block large non-essential media before blocking business updates;
4. suggest external-reference mode or cleanup;
5. never automatically upgrade or enable paid usage.

The product must degrade safely rather than surprise the couple with a bill.

---

## 21. Search, filtering and comparison

Global search must eventually find relevant entities by name/code/notes/tags where permitted.

Venue/vendor lists support:

- sorting;
- filtering;
- status views;
- customizable visible columns on desktop;
- saved preferences where implemented.

Venue comparison should normally display no more than 4–5 options simultaneously and support an `only differences` view.

Compatibility scores must be explainable. A blocking criterion failure must not be hidden by a high aggregate score.

---

## 22. UX rules

The interface is simpler than the data model.

Rules:

- summary first, details on demand;
- no giant form required to create an entity;
- drafts/autosave for long editing;
- touch-friendly mobile controls;
- destructive confirmations proportional to risk;
- undo for easy reversible actions;
- explicit loading/empty/error/offline/permission/conflict states;
- no color-only meaning;
- external links open without losing local edits;
- user-visible language must avoid implementation jargon.

---

## 23. Quality definition

A feature is not complete because it works once.

It must satisfy:

- documented behavior;
- acceptance criteria;
- domain invariants;
- relevant threat/security controls;
- deterministic tests;
- in-scope code coverage policy;
- E2E coverage for critical flows;
- mobile/desktop behavior;
- accessibility requirements;
- error/offline states;
- updated documentation;
- full CI Quality Gate.

Critical silent data loss, project-isolation failures, broken restore, known Critical/High vulnerabilities, and supported financial-calculation errors are release blockers.

---

## 24. V1 definition

V1 is the first version safe enough to become the couple's source of truth.

V1 must include at least:

- secure project/auth foundation;
- venue management;
- facts/sources/spaces/media;
- tasks and decisions;
- import/export foundation;
- budget/payments;
- guests/households;
- vendors;
- dashboard/planning;
- map/accessibility basics;
- local-first/offline synchronization hardening;
- backup/restore;
- existing-data migration;
- production security/quality gates.

Visual seating plan, advanced transport allocation, full wedding-day execution mode, push notifications and automated document extraction are post-V1 unless explicitly promoted by a future ADR/spec change.

---

## 25. V1 cutover success

Mariage OS may become the source of truth only after:

- synthetic beta succeeds;
- production authorization is verified;
- backup/restore is demonstrated;
- existing venue/guest/vendor data is imported and reconciled;
- critical calculations match trusted existing references;
- both partners can use it on their real devices;
- offline/reconnect behavior is verified;
- no open release-blocking defect exists;
- a pre-cutover export of legacy sources exists;
- a complete `.mariage` recovery export is successfully verified.

After cutover, legacy spreadsheets/conversations remain archival inputs rather than parallel editable sources of truth.

---

## 26. Specification ownership

Any implementation behavior not justified by this specification or a linked specialized specification must be treated as an explicit design decision, not invented silently.

When requirements change:

1. update specification/requirement ID;
2. assess data/security/test impact;
3. update acceptance criteria;
4. implement;
5. update tests;
6. pass the complete required verification pipeline.
