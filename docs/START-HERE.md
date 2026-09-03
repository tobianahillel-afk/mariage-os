# Mariage OS — Start Here

Status: **Normative human/context-free onboarding map**

This document intentionally avoids hard-coding a gate state that can become stale. **Always read `roadmap/IMPLEMENTATION-STATUS.md` first for the current phase, gate, lot and next permitted action.**

AI/LLM contributors must also read root `AGENTS.md` and `V1-FROZEN-MANIFEST.md` before material work.

If you remember one rule: **do not invent material behavior from intuition. Read the governing contract and current status.**

---

## 1. What Mariage OS is

Mariage OS is a collaborative, local-first wedding-planning PWA centered on a private wedding project shared by partners. It centralizes:

- venues;
- vendors/caterers;
- guests/households;
- invitations and secure guest RSVP;
- Email/SMS/WhatsApp invitation/reminder communications through configured providers;
- seating;
- budget/payments/scenarios;
- tasks/decisions/Inbox;
- planning/wedding-day timeline;
- documents/media/evidence;
- search/map/access;
- import/export/backup/recovery.

The first real production deployment is private for one couple, while the core is multi-tenant/public-SaaS-ready.

Its product loop is **Understand → Decide → Act**.

Its visual thesis is **wedding editorial warmth × calm operating-system precision**.

The interface must not degrade into a generic CRUD/admin/CRM surface.

---

## 2. Frozen V1 composition

Read `V1-FROZEN-MANIFEST.md` for exact precedence.

Current V1 trackable capability inventory:

- FTR-001..104: `FEATURE-LEDGER.md`
- FTR-105..120: `FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`

Total: **120 V1 capabilities**.

The guest-communications scope change makes these V1:

- secure household invitation links;
- mobile no-account RSVP portal;
- controlled +1/child additions;
- RSVP questions/deadline/edit policy;
- Email/SMS/WhatsApp Business-compatible invitations/reminders;
- QR/manual fallback;
- campaign preview/status/retry;
- provider webhook/cost/security controls;
- Invitations & RSVP onboarding/settings;
- QIF acceptance.

Any older text that classified guest portal/automatic email as post-V1 is superseded by the frozen manifest, current `roadmap/V1-SCOPE.md` and guest-communications addendum.

---

## 3. Minimal cold-start reading

### Context-free developer/LLM

1. `../AGENTS.md`
2. `roadmap/IMPLEMENTATION-STATUS.md`
3. `V1-FROZEN-MANIFEST.md`
4. this file
5. `engineering/LLM-TASK-ROUTING.md`
6. only the governing contracts for the specific task.

Do not load the entire documentation corpus by default.

### Human product/design onboarding

Read:

1. `PRODUCT-SPECIFICATION.md`
2. `PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md`
3. `PRODUCT-SPECIFICATION-GUEST-COMMUNICATIONS-ADDENDUM.md`
4. `roadmap/V1-SCOPE.md`
5. `PRINCIPLES.md`
6. `USER-FLOWS.md`
7. UX/visual entry points.

---

## 4. Task routing

### Product / feature

- both Feature Ledger files;
- relevant requirement IDs;
- feature contract;
- acceptance scenarios;
- current lot/checkpoint.

### Invitations / RSVP / Email / SMS / WhatsApp

Read in this order:

1. `V1-FROZEN-MANIFEST.md`
2. `FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`
3. `requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md`
4. `features/GUESTS.md`
5. `features/GUEST-RSVP-PORTAL.md`
6. `features/COMMUNICATIONS.md`
7. `ux/GUEST-COMMUNICATIONS-BLUEPRINTS.md`
8. `ux/ROUTE-FEATURE-GUEST-COMMUNICATIONS-ADDENDUM.md`
9. `domain/PHYSICAL-SCHEMA-GUEST-COMMUNICATIONS-ADDENDUM.md`
10. `domain/DEPENDENCY-GRAPH-GUEST-COMMUNICATIONS-ADDENDUM.md`
11. `security/GUEST-COMMUNICATIONS-SECURITY.md`
12. `security/GUEST-COMMUNICATIONS-AUTHORIZATION.md`
13. `architecture/COMMUNICATION-PROVIDER-PORTS.md` when provider integration is involved
14. `operations/COMMUNICATION-PROVIDER-OPERATIONS.md` for real provider/scheduling/cutover
15. `import-export/GUEST-COMMUNICATIONS-PORTABILITY.md` for imports/exports/backups
16. `quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`
17. current Lot/Checkpoint criteria.

### UX / UI / visual

Start with:
- `ux/VISUAL-SYSTEM.md`
- `ux/UX-ARCHITECTURE.md`
- `ux/NAVIGATION.md`
- `ux/SCREEN-BLUEPRINTS.md`
- relevant route/feature addendum
- `ux/DESIGN-SYSTEM.md`
- `ux/COLOR-SYSTEM.md`
- `ux/MOTION-INTERACTION.md`
- applicable feature contract.

For onboarding, invitations and guest RSVP, QIF is mandatory.

### Architecture / data

Read:
- `architecture/OVERVIEW.md`
- `architecture/PUBLIC-SAAS-READINESS.md`
- relevant repository/service/provider-port contracts
- `domain/ERD.md`
- `domain/PHYSICAL-SCHEMA-V1.md` + applicable addenda
- invariants/data dictionary/dependency contracts
- local/offline/sync docs when affected.

### Security

Start at `security/README.md`. Do not implement a new public capability endpoint, provider, webhook or secret flow from the feature document alone.

### Import / export / backup

Read the relevant `import-export/*`, domain/security contract and backup/migration rules. Contacts may be imported, but import never sends invitations implicitly.

### Release / V1→V2

Read:
- `engineering/VERSIONING-UPDATE-DELIVERY.md`
- `engineering/RELEASE-PROCESS.md`
- `engineering/MIGRATIONS.md`
- `architecture/PWA-LIFECYCLE.md`
- quality/security/backup contracts
- provider operations if communication channels are enabled.

A V2 migration must account for guest-link schema, campaign/history, webhook compatibility and provider adapters as well as ordinary app/database layers.

---

## 5. Hard constraints

- Core private Mariage OS targets €0/month infrastructure where practical.
- **External Email/SMS/WhatsApp provider usage may cost money**; the product never promises those channels are free.
- No automatic provider-plan upgrade or unbounded overage.
- Manual secure RSVP links/QR remain the provider-independent fallback.
- Real production/private data never belongs in public Git.
- Supabase is shared cloud truth; IndexedDB is account/project-scoped local working state.
- RLS/same-project integrity enforce private project isolation.
- Guest RSVP capability is NOT project membership.
- Provider webhook is NOT trusted merely because it reaches an endpoint.
- Provider credentials are NOT project/browser data.
- Important facts retain provenance/confidence/freshness/conflicts.
- Strong confirmed/contractual data is protected from weaker overwrite.
- Imports are previewed/non-destructive by default.
- Financial/date/fact semantics follow domain contracts.
- Offline/session/PWA transitions do not silently lose confirmed work.
- Portable backup/restore is first-class.
- Required quality/security/QIF/UX/visual gates cannot be bypassed.
- Multi-tenant/public-ready architecture cannot be weakened for the private deployment.
- The frozen multi-color visual system cannot be simplified into a generic one-accent admin theme.
- Code architecture/naming/complexity rules cannot be ignored for speed.

---

## 6. QIF — Quick & Intuitive Flow

QIF is an **internal Mariage OS acceptance criterion**, not an external standard.

Applicable first-time/high-frequency flows must satisfy:

- obvious next action;
- focused steps;
- one dominant CTA;
- nontechnical user language;
- progressive disclosure;
- safe preview before high-impact action;
- clear recovery from blocked/error state;
- mobile-first where appropriate;
- unmistakable completion/result;
- no dead-end.

Primary QIF scope:
- onboarding;
- adding/importing guests;
- preparing invitations;
- campaign preflight/send/result;
- guest mobile RSVP;
- corrections/reminders.

QIF evidence is reviewed again at Checkpoint B and final cutover.

---

## 7. Sources of truth

- Product/scope: frozen manifest + product spec/addenda + current V1 scope.
- Feature inventory: both Feature Ledger files.
- Development progress/gate: `roadmap/IMPLEMENTATION-STATUS.md`.
- UX/visual: `ux/VISUAL-SYSTEM.md` + governing UX/blueprint contracts.
- Security: `security/README.md` reading graph.
- Code organization: engineering structure/complexity/coding standards.
- Implemented schema/code after development: migrations/typed contracts in Git.
- Production wedding data: authorized Supabase project.
- Offline working state: account/project IndexedDB queue/cache.
- Recovery: verified `.mariage` backups.

Chat history is supplementary only.

---

## 8. When documentation is insufficient

If behavior materially affects UX, scope, security, privacy, money, guest data, communications, provider integration, synchronization, migration or public-readiness and is not specified:

1. check deferred decisions;
2. if not intentionally deferred, stop;
3. treat as documentation defect;
4. update governing contracts/requirements;
5. create ADR if architectural;
6. update Feature Ledger/acceptance evidence.

Do not pick silently.

---

## 9. Implementation discipline

The implementation gate/status is whatever `roadmap/IMPLEMENTATION-STATUS.md` currently says.

When a lot is explicitly started:

1. identify eligible Feature IDs;
2. create/update FIR;
3. identify routes/jobs/data/security/offline/provider impacts;
4. implement smallest coherent vertical slice;
5. respect code/layer/complexity limits;
6. add required tests/evidence;
7. update Feature Ledgers/status;
8. perform lot acceptance;
9. perform mandatory checkpoints after defined lot groups;
10. leave durable handoff in Git.

This documentation does not itself start Lot 0.

---

## 10. Definition of success

For the couple, Mariage OS quickly answers:

- Where are we?
- What is decided?
- What is missing/stale/conflicting?
- What blocks us?
- What are we waiting for?
- What should we do next?
- What will it cost / what is paid?
- Who is invited, contacted, awaiting RSVP or confirmed?
- Can guests answer themselves safely?
- Are invitations/reminders understandable and under control?
- Is our project synchronized/recoverable?

For a guest:

- opening the invitation link immediately explains what to do;
- no account is required;
- private couple/project data is not exposed;
- response is quick, clear, mobile-friendly and confirmed.

For a context-free developer/LLM:

- task ownership/priority/lot is discoverable;
- governing docs are routed;
- implementation boundaries are explicit;
- missing semantics trigger a stop rather than invention;
- status/evidence can be resumed from Git alone.