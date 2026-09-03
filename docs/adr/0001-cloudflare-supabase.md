# ADR 0001 — Cloudflare Pages + Supabase

- Status: Accepted
- Date: 2026-09-02

## Context

The couple requires cloud access from phone/tablet/computer, collaboration, photos/documents, simple maintenance and normal operating cost of €0/month.

## Decision

Use:

- Cloudflare Pages for static frontend/PWA hosting;
- Supabase Free for PostgreSQL, Auth, Storage and Realtime;
- portable export/local cache so the product is not operationally trapped.

## Alternatives considered

### Local HTML/file only

Rejected as primary architecture because collaboration/synchronization across devices would be poor.

### Full Cloudflare Workers/D1/R2 custom backend

Technically capable, but more custom auth/API/storage logic and maintenance than needed for this personal project.

### Airtable/no-code as primary system

Fast initially but insufficient customization, provenance/offline/import/security architecture and long-term product control for the desired UX.

### Custom VPS/backend

Rejected as unnecessary operational burden/cost.

## Consequences

Positive:

- minimal infrastructure maintenance;
- managed Auth/Postgres/Storage;
- collaborative cloud data;
- simple static deployment;
- free-tier target plausible for couple usage.

Tradeoffs:

- provider free-tier limits/terms can change;
- Supabase free projects may have service limitations/inactivity behavior;
- application needs clear quota/degraded-mode strategy;
- portability must remain intentional.

## Guardrails

- no automatic paid upgrade;
- real data stays in private Supabase, never public GitHub;
- service/repository abstraction limits provider coupling;
- portable `.mariage`/JSON export remains required.
