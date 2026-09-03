# Architecture

Mariage OS is a static Vite + TypeScript progressive web application hosted on Cloudflare Pages, backed by Supabase Auth/PostgreSQL/RLS/Storage/Realtime, with IndexedDB providing local-first/offline working state.

The first real production deployment is private for one couple, but the **core architecture is multi-tenant/public-ready from V1**. Private one-couple restrictions are deployment/provisioning policy, not assumptions baked into wedding-domain persistence, routing, authorization or local storage.

This root document is intentionally a short architectural entry point. The normative architecture is under `docs/architecture/`, `docs/domain/`, `docs/security/` and the ADRs.

## Read in this order

1. `docs/PRODUCT-SPECIFICATION.md`
2. `docs/PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md`
3. `docs/architecture/OVERVIEW.md`
4. `docs/architecture/STACK.md`
5. `docs/architecture/PUBLIC-SAAS-READINESS.md`
6. `docs/domain/TENANCY-MODEL.md`
7. `docs/architecture/TRUST-BOUNDARIES.md`
8. `docs/architecture/DATA-OWNERSHIP.md`
9. `docs/architecture/LOCAL-FIRST.md`
10. `docs/architecture/SYNC.md`
11. `docs/architecture/OFFLINE.md`
12. `docs/architecture/PWA-LIFECYCLE.md`
13. `docs/architecture/STORAGE.md`
14. `docs/architecture/LOCAL-DATA-SCHEMA.md`
15. `docs/architecture/REPOSITORY-SERVICE-CONTRACTS.md`
16. `docs/architecture/REPOSITORY-SERVICE-PUBLIC-READINESS-ADDENDUM.md`
17. `docs/architecture/DEPENDENCY-GRAPH.md`
18. `docs/domain/ERD.md`
19. `docs/domain/PHYSICAL-SCHEMA-V1.md`
20. `docs/security/SECURITY-ARCHITECTURE.md`
21. `docs/security/PUBLIC-ABUSE-PROTECTION.md`
22. `docs/engineering/MIGRATIONS.md`
23. `docs/engineering/CI-CD.md`
24. relevant ADRs under `docs/adr/`, especially ADR 0007.

For a full onboarding path, use `docs/START-HERE.md`.

## High-level runtime

```text
Authorized browser / installed PWA
        │
        ├── explicit active ProjectContext
        │       ↓
        ├── View/components
        │       ↓
        ├── Application/domain services + pure engines
        │       ↓
        ├── Repository/local-store/sync layer
        │       ├── account/project-scoped IndexedDB cache
        │       └── project-bound pending mutation/conflict queues
        │
        └── HTTPS
              │
              ▼
        Supabase project
        ├── Auth identities
        ├── PostgreSQL + membership RLS
        ├── project-scoped Realtime
        └── private project-scoped Storage + RLS

Static application bundle
        ▲
Cloudflare Pages
        ▲
Public GitHub repository
(code/docs/migrations/tests/synthetic fixtures only)
```

Future public self-service adds a **small protected control plane** for abuse-sensitive provisioning/entitlement/support operations where needed; ordinary wedding CRUD remains on the same browser-safe Supabase + RLS architecture.

## Core architecture rules

- **UI is not a security boundary.** Database/Storage authorization is authoritative.
- **Private now, public-ready by construction.** Many isolated projects/users must be supported by the core even when the real V1 deployment has one couple/project.
- **Project context is explicit.** Project-owned routes/services/repositories/local state cannot rely on a hidden singleton wedding assumption.
- **Project IDs are context, not secrets.** Membership/RLS/same-project integrity grant access.
- **GitHub stores the application, not the wedding.** Real wedding data and secrets never belong in the public repository.
- **Supabase is shared cloud truth.** IndexedDB is durable account/project-scoped local working/offline state, not a second independent project truth.
- **Local-first does not mean last-write-wins.** Revisions, operation IDs and explicit conflicts protect collaborative edits.
- **Views do not scatter raw Supabase calls.** Domain/service/repository/provider boundaries centralize offline, validation, testing and portability.
- **Important facts preserve evidence.** Observations, sources, confidence, freshness and retained values are separate concepts.
- **Derived values are not manually duplicated truth.** The dependency graph determines recomputation/staleness.
- **Schema changes are versioned migrations.** PostgreSQL, IndexedDB, canonical import and backup schemas all have explicit evolution rules.
- **Imports are conservative.** Preview first; no implicit deletion; stable IDs/idempotence; stronger evidence protected; rollback/recovery defined.
- **Files are private and quota-aware.** Originals/derivatives are separated, orphan uploads are cleaned, essential structured data has priority over decorative media.
- **PWA caches are versioned.** Stale service-worker assets cannot silently run indefinitely against incompatible schemas.
- **Private V1 free-tier sustainability and open recovery are architecture requirements.** Future public launch has a separate capacity/commercial gate and must never be assumed to stay free at scale.
- **Public self-service is a deployment activation, not a domain rewrite.** Public signup/provisioning is gated by `operations/PUBLIC-LAUNCH-GATE.md`.

## Sources of truth

- Product behavior: normative docs in Git.
- Public-readiness/tenancy: `PUBLIC-SAAS-READINESS.md`, `TENANCY-MODEL.md`, ADR 0007 and `PUB-*` requirements.
- Physical schema: migrations in Git, constrained by `PHYSICAL-SCHEMA-V1.md` + normative addenda.
- Production wedding state: Supabase production project(s).
- Local working/offline state: account/project-scoped IndexedDB on authorized devices.
- Portable recovery: validated `.mariage` export.
- Legacy spreadsheets/research: authoritative only until formal V1 cutover.

## Architecture changes

A significant change requires an ADR when it changes any of:

- hosting/backend/provider choice;
- frontend framework/runtime architecture;
- local-first/synchronization model;
- tenancy/project context/public-readiness model;
- data/evidence model;
- security/trust boundary;
- backup/import format;
- V1 scope materially;
- migration/portability strategy.

The ADR must document context, alternatives, consequences, migration impact, security impact and verification impact.
