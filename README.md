# Mariage OS

Mariage OS is a collaborative wedding-planning application for a couple. It centralizes venues, vendors, guests, secure invitations/RSVP, Email/SMS/WhatsApp communications through configured providers, seating, budget, documents, tasks, decisions, evidence, planning and the wedding-day timeline while staying focused on one question: **what matters next?**

> **AI/coding agents arriving without conversation context must start with [`AGENTS.md`](AGENTS.md), the current [`IMPLEMENTATION-STATUS`](docs/roadmap/IMPLEMENTATION-STATUS.md), and [`docs/V1-FROZEN-MANIFEST.md`](docs/V1-FROZEN-MANIFEST.md).**

## Project status

**Expanded V1 pre-code design is COMPLETE / FROZEN on `main`. Final Design Review is PASS.**

The guest RSVP + Email/SMS/WhatsApp V1 scope change was reviewed and merged through PR #5. The frozen V1 contains **120 Feature IDs**.

**Implementation gate: OPEN. Lot 0: READY / NOT_STARTED.**

Lot 0 does not start automatically: an explicit future kickoff is required. No application code, toolchain, CI workflow, Supabase migration or provider integration has been started.

Current exact phase/gate/next action: [`docs/roadmap/IMPLEMENTATION-STATUS.md`](docs/roadmap/IMPLEMENTATION-STATUS.md).

## Product objective

Either partner should quickly understand:

- where the wedding stands;
- what is decided;
- what is unknown/stale/conflicting;
- what blocks progress or waits on someone else;
- what action matters next and who owns it;
- what requires both partners;
- what is estimated, quoted, contracted, paid and still due;
- why important decisions were made;
- who is invited, contacted, awaiting RSVP or confirmed;
- whether invitations/reminders were delivered or need action;
- whether local/cloud state is synchronized and recoverable.

Invited households can receive a secure no-account RSVP link and update only their authorized response without receiving private project access.

Mariage OS is a **decision-and-action system**, not merely a database/inspiration site.

## Frozen V1 inventory

The current V1 specification contains **120 trackable capabilities**:

- [`docs/FEATURE-LEDGER.md`](docs/FEATURE-LEDGER.md) — FTR-001..104
- [`docs/FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`](docs/FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md) — FTR-105..120

The precise composition/precedence is [`docs/V1-FROZEN-MANIFEST.md`](docs/V1-FROZEN-MANIFEST.md).

Guest communication V1 includes:

- normalized guest email/phone contact points;
- secure household invitation links + QR/manual fallback;
- no-account mobile RSVP portal;
- controlled +1/children additions;
- RSVP questions/deadline/edit policy;
- Email/SMS/WhatsApp Business-compatible campaigns through provider-neutral adapters;
- preview/frozen audience/idempotent retries/webhook status handling;
- onboarding/settings/QIF flows;
- cost/send caps and production provider diagnostics.

## QIF — Quick & Intuitive Flow

QIF is an **internal Mariage OS quality criterion**, not an external certification.

For onboarding, invitations and guest RSVP, the UI must provide obvious next actions, focused progressive steps, nontechnical language, one primary CTA, safe preview before send, clear recovery, mobile-first guest flow and no dead ends.

## Hard constraints

- Cloud-accessible from supported phone/tablet/desktop.
- Two primary partner owners in first deployment, multi-tenant/public-ready core.
- Controlled private production bootstrap; public self-service project signup is post-V1 activation work.
- Core private-V1 infrastructure targets **€0/month** where possible.
- External Email/SMS/WhatsApp delivery may incur provider charges; Mariage OS does not promise those channels are free.
- No automatic paid provider upgrade/overage; secure RSVP link/QR fallback remains available.
- Responsive PWA with explicit offline/pending/conflict behavior.
- Supabase = shared cloud truth; IndexedDB = local working/offline state.
- PostgreSQL/Storage RLS + same-project integrity enforce isolation.
- Guest RSVP capability ≠ project membership.
- Provider webhook ≠ trusted project command until authenticated/normalized.
- Provider credentials never belong in browser/project export/public Git.
- Public GitHub contains code/docs/tests/synthetic fixtures only.
- Real wedding data/secrets/backups never belong in GitHub.
- Important facts retain evidence/confidence/freshness/conflicts.
- Financial/date/import semantics are exact and explicit.
- No silent destructive import, conflict overwrite, duplicate paid send or confirmed-data loss.
- Portable verified recovery is first-class.
- UX/visual/QIF gates cannot be satisfied by dumping all fields into one mega-page/table.
- Code follows canonical layers/folders/dependencies/size/complexity; provider SDKs stay in infrastructure adapters.

## Chosen architecture

- **Frontend:** Vite + TypeScript, no React in V1.
- **Hosting:** Cloudflare Pages free-tier target for private V1.
- **Backend:** Supabase Auth/PostgreSQL/Storage/Realtime free-tier target.
- **Authorization:** centralized permissions + PostgreSQL/Storage RLS + same-project relational validation.
- **Guest portal:** narrow public/capability endpoint + minimal guest-safe DTO, not generic anonymous DB access.
- **Communications:** provider-neutral Email/SMS/WhatsApp ports; secrets/server dispatch/webhooks in infrastructure.
- **Local/offline:** project/account-scoped IndexedDB + durable mutation queue; communication drafts may persist, provider send is server-authoritative.
- **PWA:** versioned Service Worker + Web App Manifest.
- **Files:** private Supabase Storage + privacy-safe external media references.
- **Repository:** public GitHub with no production/private wedding data.

> **GitHub stores the application. Supabase stores the synchronized wedding. IndexedDB protects temporary local work. Providers deliver optional communications. Verified `.mariage` backups preserve portability/recovery.**

## Documentation — start here

- AI/context-free: [`AGENTS.md`](AGENTS.md) → [`IMPLEMENTATION-STATUS`](docs/roadmap/IMPLEMENTATION-STATUS.md) → [`V1-FROZEN-MANIFEST`](docs/V1-FROZEN-MANIFEST.md).
- Human full map: [`docs/START-HERE.md`](docs/START-HERE.md).
- Full index: [`docs/INDEX.md`](docs/INDEX.md).

Key product/scope:
- `docs/PRODUCT-SPECIFICATION.md`
- `docs/PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md`
- `docs/PRODUCT-SPECIFICATION-GUEST-COMMUNICATIONS-ADDENDUM.md`
- `docs/roadmap/V1-SCOPE.md`
- `docs/requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md`
- `docs/GUEST-COMMUNICATIONS-TRACEABILITY.md`

Guest communications task entry points:
- `docs/features/GUEST-RSVP-PORTAL.md`
- `docs/features/COMMUNICATIONS.md`
- `docs/ux/GUEST-COMMUNICATIONS-BLUEPRINTS.md`
- `docs/security/GUEST-COMMUNICATIONS-SECURITY.md`
- `docs/architecture/COMMUNICATION-PROVIDER-PORTS.md`
- `docs/quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`

## Security/privacy

Never commit real guest/contact data, private notes/ratings, budgets/payments, contracts/invoices, private photos, production dumps, `.mariage` backups, raw RSVP tokens, provider credentials, auth tokens or secret/service-role keys.

Security work starts at [`docs/security/README.md`](docs/security/README.md). Browser/UI is not an authorization boundary.

## Quality

A feature is not complete because it works once. Applicable evidence includes strict typing/lint/architecture, unit/property/mutation/integration tests, DB/RLS allow+deny, guest-capability adversarial tests, webhook/idempotency tests, Playwright journeys, QIF/accessibility/mobile evidence, offline/PWA/import/backup/migration tests, provider production smoke evidence when enabled, and no accepted known exploitable Critical/High release vulnerability.

Coverage is a gate, not proof of correctness by itself.

## Development control

Every feature follows:

`SPECIFIED → READY → IN_PROGRESS → IMPLEMENTED → VERIFIED → INTEGRATED → ACCEPTED`

Feature Implementation Records link requirements, routes, UX/QIF, module ownership, domain model, cloud/local persistence, security, provider/offline behavior and tests.

Mandatory integration checkpoints re-review the whole product after Lots 0–3, 4–7, 8–10 and 11–12. Guest communications add specific Checkpoint B/D evidence.

## Current next step

**Wait for an explicit Lot 0 kickoff. Do not start Lot 0 automatically.**