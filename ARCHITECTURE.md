# Architecture

Mariage OS is a static TypeScript/Vite PWA hosted on Cloudflare Pages, backed by Supabase Auth/PostgreSQL/RLS/Storage/Realtime, with IndexedDB for local-first/offline behavior.

This root document intentionally stays short. The canonical architecture is documented under `docs/architecture/`.

## Read in order

1. `docs/architecture/OVERVIEW.md`
2. `docs/architecture/STACK.md`
3. `docs/architecture/TRUST-BOUNDARIES.md`
4. `docs/architecture/DATA-OWNERSHIP.md`
5. `docs/architecture/LOCAL-FIRST.md`
6. `docs/architecture/SYNC.md`
7. `docs/architecture/OFFLINE.md`
8. `docs/domain/ERD.md`
9. `docs/security/SECURITY-ARCHITECTURE.md`
10. `docs/engineering/CI-CD.md`

## Core architecture rules

- UI never owns authorization truth.
- Supabase is the shared cloud state; IndexedDB is local working/offline state.
- screens access data through domain/service/repository layers rather than arbitrary backend calls.
- production data never enters public GitHub.
- schema changes are migrations.
- important facts preserve provenance/confidence.
- imports/sync are conservative and recoverable.
- free-tier sustainability and portability are explicit constraints.

Significant architecture changes require an ADR.
