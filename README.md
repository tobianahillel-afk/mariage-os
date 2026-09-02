# Mariage OS

Mariage OS is a private, collaborative wedding-planning application designed for a couple to make decisions quickly, track progress from start to finish, centralize evidence and documents, and keep a reliable view of budget, guests, venues, vendors, tasks, decisions and deadlines.

## Status

**Current phase: specification and architecture only.**

No production feature should be implemented until the foundational documentation, data model, security model, quality gates and delivery lots are approved.

## Product goals

Mariage OS must let two partners answer, in under 30 seconds:

1. Where are we?
2. What is already decided?
3. What is still unknown?
4. What is blocking us?
5. What should we do next?
6. Who owns that action?
7. When is it due?
8. What is the current budget, committed amount and paid amount?
9. Which facts are verified, uncertain or contradictory?
10. What do we need to decide together?

The application is a **decision-and-action system**, not merely a database.

## Core constraints

- Cloud-accessible from phone, tablet and desktop.
- Collaborative for two primary owners.
- Free-tier-first: normal operation targets **€0/month**.
- Progressive Web App (PWA), responsive and usable offline for essential workflows.
- Cloud source of truth with local-first interaction and queued synchronization.
- Public GitHub repository contains **code and documentation only**.
- Real wedding data, personal data, quotes, contracts, private photos and backups never belong in GitHub.
- Every important fact can carry provenance, verification state, freshness and conflicting observations.
- Every major decision keeps its reasoning and history.
- Import/export is a first-class subsystem.
- No silent destructive import, silent conflict overwrite or silent loss of confirmed data.
- Security, privacy, backup/restore and testability are architectural requirements.

## Chosen architecture

- Frontend: TypeScript + Vite, lightweight browser UI.
- Hosting: Cloudflare Pages free tier.
- Cloud backend: Supabase free tier.
- Database: PostgreSQL via Supabase.
- Authentication: Supabase Auth.
- Authorization: PostgreSQL Row Level Security (RLS).
- Files: private Supabase Storage.
- Realtime: Supabase Realtime only where collaboration benefits from it.
- Local cache/offline queue: IndexedDB.
- PWA: Service Worker + Web App Manifest.
- Repository: GitHub.

## Repository rule

> GitHub stores the application, schemas, migrations, tests, fixtures and documentation. Supabase stores the real wedding.

Never commit real guest/contact data, budgets, payments, quotes, contracts, private photos, `.mariage` backups, production dumps, service-role keys or other secrets.

## Documentation entry point

Start with [`docs/START-HERE.md`](docs/START-HERE.md).

## Development policy

A feature is not complete because it works once. It is complete only when its behavior, edge cases, security properties, data model, tests and documentation satisfy the project's Definition of Done.

Quality targets include zero TypeScript/lint errors, all tests passing, 100% coverage thresholds for in-scope business code, integration/RLS/E2E/security/offline/backup/migration testing, and no accepted known Critical or High severity vulnerability in a release.

See [`docs/engineering/DEFINITION-OF-DONE.md`](docs/engineering/DEFINITION-OF-DONE.md).
