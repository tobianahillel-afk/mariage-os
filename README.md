# Mariage OS

Mariage OS is a private, collaborative wedding-planning application for a couple. It centralizes venues, vendors, guests, budget, documents, tasks, decisions, evidence and planning while remaining simple enough to answer one question quickly: **what matters next?**

## Project status

**Design/specification phase: complete in documentation Run 4, pending merge/review.**

After Run 4 is merged, implementation starts at **Lot 0 — Repository and tooling**. No real wedding data is migrated until V1 reaches the explicit cutover gates.

The project is intentionally specification-first: architecture, security, data semantics, import/backup behavior and test gates are documented before feature code.

## Product objective

Either partner should be able to open Mariage OS and quickly understand:

1. where the wedding project stands;
2. what is decided;
3. what remains unknown or unreliable;
4. what blocks progress;
5. what action matters next;
6. who owns it and when it is due;
7. what requires a joint decision;
8. what is estimated, quoted, contracted, paid and still due;
9. which facts are confirmed, stale or contradictory;
10. why important past decisions were made.

Mariage OS is a **decision-and-action system**, not merely a database or wedding inspiration site.

## Hard constraints

- Cloud-accessible from phone, tablet and desktop.
- Two primary partner owners.
- Free-tier-first: normal operation targets **€0/month**.
- Responsive Progressive Web App.
- Local-first interaction with safe offline queue/reconnect behavior.
- Supabase is shared cloud truth; IndexedDB is local working/offline state.
- Public GitHub repository contains code/docs/tests/synthetic fixtures only.
- Real wedding data and secrets never belong in GitHub.
- Important facts can retain evidence, confidence, freshness and conflicting observations.
- Import/export is first-class and non-destructive by default.
- No silent conflict overwrite or silent confirmed-data loss.
- Security, privacy, backup/restore, portability and testability are architectural requirements.

## Chosen architecture

- **Frontend:** Vite + TypeScript, no React in V1.
- **Hosting:** Cloudflare Pages free tier.
- **Cloud backend:** Supabase free tier.
- **Database:** PostgreSQL.
- **Authentication:** Supabase Auth.
- **Authorization:** PostgreSQL/Storage Row Level Security.
- **Files:** private Supabase Storage plus external media references when appropriate.
- **Realtime:** scoped Supabase Realtime subscriptions.
- **Local/offline:** IndexedDB working state + durable mutation queue.
- **PWA:** Service Worker + Web App Manifest with explicit version/update lifecycle.
- **Repository:** public GitHub repository containing no real wedding data.

> **GitHub stores the application. Supabase stores the real wedding. Portable `.mariage` backups keep the couple independent from both.**

## Documentation — start here

Mandatory entry point: [`docs/START-HERE.md`](docs/START-HERE.md).

Master documents:

- [`docs/PRODUCT-SPECIFICATION.md`](docs/PRODUCT-SPECIFICATION.md) — master cahier des charges;
- [`docs/REQUIREMENTS-CATALOG.md`](docs/REQUIREMENTS-CATALOG.md) — traceable P0/P1/P2 requirements;
- [`docs/IMPLEMENTATION-READINESS.md`](docs/IMPLEMENTATION-READINESS.md) — readiness assessment;
- [`docs/INDEX.md`](docs/INDEX.md) — complete documentation map;
- [`docs/roadmap/V1-SCOPE.md`](docs/roadmap/V1-SCOPE.md) — binding V1 boundary;
- [`docs/roadmap/LOT-ACCEPTANCE.md`](docs/roadmap/LOT-ACCEPTANCE.md) — implementation lot exit criteria;
- [`docs/engineering/DEFINITION-OF-DONE.md`](docs/engineering/DEFINITION-OF-DONE.md) — feature completion rules.

## Security and privacy

Real guest names, contact details, private notes, quotes, contracts, invoices, budgets, payment evidence, private photos, production database dumps, `.mariage` backups and secret/service-role keys must never be committed.

Production authorization is enforced through Supabase/PostgreSQL/Storage policy rather than frontend visibility.

Security design and threat/testing requirements are documented under [`docs/security/`](docs/security/).

## Quality policy

A feature is not complete because it works once.

Required engineering posture includes:

- strict TypeScript;
- deterministic unit/property tests;
- 100% lines/statements/functions/branches coverage for defined in-scope business code;
- mutation testing on critical engines;
- database/RLS allow+deny tests;
- integration and Playwright E2E;
- offline/sync/session-expiry tests;
- import/export/rollback/round-trip tests;
- backup/restore and migration compatibility tests;
- accessibility and performance budgets;
- security scanning and no known accepted Critical/High release vulnerability;
- full Quality Gate on every production-bound change.

100% coverage is a gate, not a claim that software can be mathematically guaranteed bug-free.

## Implementation roadmap

Implementation is split into Lots 0–12. The order is deliberate because each later lot depends on integrity/security foundations from earlier work.

See:

- [`docs/roadmap/LOTS.md`](docs/roadmap/LOTS.md)
- [`docs/roadmap/LOT-ACCEPTANCE.md`](docs/roadmap/LOT-ACCEPTANCE.md)

## V1 cutover rule

Mariage OS becomes the operational source of truth only after:

- complete required test/security gates pass;
- both partner accounts work on real devices;
- backup→restore has been demonstrated;
- current venue/guest/vendor sources are imported and reconciled;
- critical guest/budget calculations are validated;
- production recovery export exists;
- no V1 release blocker remains.

Until then, existing wedding spreadsheets/research remain authoritative legacy sources.

## Current next step

After documentation Run 4 is reviewed/merged: **implement Lot 0 only**, following `docs/roadmap/LOT-ACCEPTANCE.md`. Do not skip directly to feature coding.
