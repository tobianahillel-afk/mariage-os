# Technology Stack

## Frontend

### TypeScript

Required for domain safety, import contracts, state machines, money/date types and maintainability.

### Vite

Used only as the development/build tool. Production remains a static site.

### UI approach

Prefer lightweight, explicit browser components over a heavy framework unless a later ADR demonstrates a clear need.

### IndexedDB

Used for local cache, pending offline mutations, local metadata and resumable workflows.

### PWA

- Web App Manifest
- Service Worker
- versioned application shell cache
- installable where supported
- graceful browser fallback where not supported

## Hosting

### Cloudflare Pages

Responsibilities:

- static HTTPS hosting;
- preview deployments;
- production deployment from Git;
- security headers.

No real wedding data is hosted in the repository or static bundle.

## Backend platform

### Supabase Free

Responsibilities:

- PostgreSQL database;
- Auth;
- Row Level Security;
- private Storage;
- Realtime where justified.

### PostgreSQL

Schema changes are performed through versioned migrations. Production schema must be reproducible from repository migrations.

## Authentication

Supabase Auth. V1 should use a simple owner-friendly login mechanism and support MFA/TOTP for primary owners before production readiness.

## Authorization

RLS is mandatory on exposed project data. UI checks are convenience only.

## File storage

Supabase Storage private bucket(s). Original user uploads are preserved; optimized derivatives are separate objects.

Remote promotional images should default to source URLs rather than consuming private storage unless deliberately archived.

## Testing toolchain targets

- Vitest: unit/integration/business coverage
- fast-check: property-based testing where valuable
- Playwright: E2E, multi-browser, offline/network scenarios
- Supabase CLI/local stack: DB and RLS testing
- database tests such as pgTAP where appropriate
- mutation testing for critical engines
- static security/dependency/secret checks in CI

Exact package choices will be locked in the quality/testing batch.

## Repository tooling

- npm with committed lockfile
- `npm ci` in CI
- TypeScript strict mode
- ESLint
- formatter
- GitHub Actions

## Dependency policy

A dependency must solve a meaningful problem better than platform APIs or a small maintained local utility. Dependencies should be actively maintained, license-compatible and security-reviewed.

## Explicitly rejected for V1

- custom VPS/backend server;
- Docker requirement for end users;
- React/Next solely for convenience without product justification;
- custom authentication;
- paid mandatory API;
- AI service required for normal operation;
- storing production data in GitHub.

## Free-tier principle

The application must monitor or defensively limit usage where practical so that media storage cannot silently undermine the zero-cost target. If a free-tier limit is approached, nonessential uploads degrade before core structured-data workflows.
