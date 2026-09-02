# Architecture

Mariage OS is a static Vite + TypeScript progressive web application hosted on Cloudflare Pages, backed by Supabase Auth/PostgreSQL/RLS/Storage/Realtime, with IndexedDB providing local-first/offline working state.

This root document is intentionally a short architectural entry point. The normative architecture is under `docs/architecture/`, `docs/domain/`, `docs/security/` and the ADRs.

## Read in this order

1. `docs/PRODUCT-SPECIFICATION.md`
2. `docs/architecture/OVERVIEW.md`
3. `docs/architecture/STACK.md`
4. `docs/architecture/TRUST-BOUNDARIES.md`
5. `docs/architecture/DATA-OWNERSHIP.md`
6. `docs/architecture/LOCAL-FIRST.md`
7. `docs/architecture/SYNC.md`
8. `docs/architecture/OFFLINE.md`
9. `docs/architecture/PWA-LIFECYCLE.md`
10. `docs/architecture/STORAGE.md`
11. `docs/architecture/LOCAL-DATA-SCHEMA.md`
12. `docs/architecture/REPOSITORY-SERVICE-CONTRACTS.md`
13. `docs/architecture/DEPENDENCY-GRAPH.md`
14. `docs/domain/ERD.md`
15. `docs/domain/PHYSICAL-SCHEMA-V1.md`
16. `docs/security/SECURITY-ARCHITECTURE.md`
17. `docs/engineering/MIGRATIONS.md`
18. `docs/engineering/CI-CD.md`
19. relevant ADRs under `docs/adr/`

For a full onboarding path, use `docs/START-HERE.md`.

## High-level runtime

```text
Authorized browser / installed PWA
        │
        ├── View/components
        │       ↓
        ├── Application/domain services + pure engines
        │       ↓
        ├── Repository/local-store/sync layer
        │       ├── IndexedDB durable working cache
        │       └── pending mutation/conflict queues
        │
        └── HTTPS
              │
              ▼
        Supabase project
        ├── Auth
        ├── PostgreSQL + RLS
        ├── scoped Realtime
        └── private Storage + Storage RLS

Static application bundle
        ▲
Cloudflare Pages
        ▲
Public GitHub repository
(code/docs/migrations/tests/synthetic fixtures only)
```

## Core architecture rules

- **UI is not a security boundary.** Database/Storage authorization is authoritative.
- **GitHub stores the application, not the wedding.** Real wedding data and secrets never belong in the public repository.
- **Supabase is shared cloud truth.** IndexedDB is durable local working/offline state, not a second independent project truth.
- **Local-first does not mean last-write-wins.** Revisions, operation IDs and explicit conflicts protect collaborative edits.
- **Views do not scatter raw Supabase calls.** Domain/service/repository/provider boundaries centralize offline, validation, testing and portability.
- **Important facts preserve evidence.** Observations, sources, confidence, freshness and retained values are separate concepts.
- **Derived values are not manually duplicated truth.** The dependency graph determines recomputation/staleness.
- **Schema changes are versioned migrations.** PostgreSQL, IndexedDB, canonical import and backup schemas all have explicit evolution rules.
- **Imports are conservative.** Preview first; no implicit deletion; stable IDs/idempotence; stronger evidence protected; rollback/recovery defined.
- **Files are private and quota-aware.** Originals/derivatives are separated, orphan uploads are cleaned, essential structured data has priority over decorative media.
- **PWA caches are versioned.** Stale service-worker assets cannot silently run indefinitely against incompatible schemas.
- **Free-tier sustainability and open recovery are architecture requirements.** The application never silently opts into paid usage.

## Sources of truth

- Product behavior: normative docs in Git.
- Physical schema: migrations in Git, constrained by `PHYSICAL-SCHEMA-V1.md`.
- Production wedding state: Supabase production project.
- Local working/offline state: IndexedDB on authorized devices.
- Portable recovery: validated `.mariage` export.
- Legacy spreadsheets/research: authoritative only until formal V1 cutover.

## Architecture changes

A significant change requires an ADR when it changes any of:

- hosting/backend/provider choice;
- frontend framework/runtime architecture;
- local-first/synchronization model;
- data/evidence model;
- security/trust boundary;
- backup/import format;
- V1 scope materially;
- migration/portability strategy.

The ADR must document context, alternatives, consequences, migration impact, security impact and verification impact.
