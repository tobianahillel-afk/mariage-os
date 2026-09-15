# ADR 0001 — Cloudflare Pages + Supabase

- Status: Accepted
- Date: 2026-09-02
- Amended: 2026-09-15 by ADR 0010

## Context

The couple requires cloud access from phone/tablet/computer, collaboration, photos/documents, simple maintenance and normal operating cost of €0/month.

## Decision

Use:

- Cloudflare Pages for the frontend/PWA deployment;
- Supabase Free for PostgreSQL, Auth, Storage and Realtime;
- portable export/local cache so the product is not operationally trapped.

The default application architecture remains static Pages assets backed by managed Supabase services.

ADR 0010 authorizes one narrow exception: the Pages project may contain the security-sensitive `POST /api/private-document-promote` Pages Function used only for trusted private-document promotion. That Function replaces the former Supabase Edge promotion endpoint and is not a general application API/backend.

No Cloudflare D1/R2/KV application datastore or general-purpose Worker backend is authorized by this amendment.

## Alternatives considered

### Local HTML/file only

Rejected as primary architecture because collaboration/synchronization across devices would be poor.

### Full Cloudflare Workers/D1/R2 custom backend

Technically capable, but more custom auth/API/storage logic and maintenance than needed for this personal project.

ADR 0010 does not reverse this rejection: it authorizes only one bounded Pages Function where an upstream HTTP termination boundary is security-required and the equivalent Supabase Edge route was proven unable to satisfy the frozen ingress contract.

### Airtable/no-code as primary system

Fast initially but insufficient customization, provenance/offline/import/security architecture and long-term product control for the desired UX.

### Custom VPS/backend

Rejected as unnecessary operational burden/cost.

## Consequences

Positive:

- minimal infrastructure maintenance;
- managed Auth/Postgres/Storage;
- collaborative cloud data;
- simple Pages deployment;
- free-tier target plausible for couple usage;
- one explicitly governed same-origin server boundary is available where a static-only deployment cannot satisfy a frozen security control.

Tradeoffs:

- provider free-tier limits/terms can change;
- Supabase free projects may have service limitations/inactivity behavior;
- the ADR-0010 Pages Function introduces one Cloudflare server secret/runtime boundary that requires CI/runtime verification;
- application needs clear quota/degraded-mode strategy;
- portability must remain intentional.

## Guardrails

- no automatic paid upgrade;
- ADR-0010 must prove its exact 25 MB workflow on the intended free runtime; inability to do so re-blocks that packet rather than silently enabling paid infrastructure;
- no general Cloudflare backend expansion without another accepted ADR;
- real data stays in private Supabase, never public GitHub;
- service/repository abstraction limits provider coupling;
- production server credentials remain secret bindings, never static assets or repository values;
- portable `.mariage`/JSON export remains required.
