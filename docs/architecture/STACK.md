# Technology Stack

Status: **Normative V1 stack constraints; exact package versions remain Lot 0 implementation choices**

## Frontend

### TypeScript

Required for domain types, import contracts, state machines, exact business semantics and maintainability. V1 uses strict TypeScript.

### Vite

V1 development/build tool. Production output is a static web application.

### UI architecture

Per ADR `0002-vite-typescript-no-react.md`, V1 uses lightweight explicit TypeScript/browser UI architecture and **does not use React**. Introducing a framework that contradicts this is an architectural change requiring ADR/spec review, not an implementation convenience choice.

### IndexedDB

Required for project/account-scoped cache, pending mutations, drafts, conflicts, offline pins and unsynced local recovery state. Native vs maintained helper library is deliberately deferred.

### PWA

- Web App Manifest;
- Service Worker;
- versioned app-shell cache;
- explicit update/schema lifecycle;
- installable where supported;
- graceful fallback where unsupported.

## Hosting

### Cloudflare Pages

- public static HTTPS assets;
- preview deployments using synthetic/non-production data/config;
- production static deployment from Git;
- security headers/CSP configuration.

No wedding production data or secrets are embedded in static assets.

## Backend

### Supabase Free tier target

- PostgreSQL;
- Auth;
- Row Level Security;
- private Storage;
- Realtime only where useful.

V1 production is a **controlled single-couple deployment**, not an open public project-creation SaaS. Provider free-tier conditions are rechecked at implementation/release time.

### PostgreSQL

All schema/functions/grants/policies are reproducible through versioned migrations. Physical semantics are constrained by the frozen schema + addendum and RLS matrix.

## Authentication/authorization

### Authentication

Supabase Auth only; no custom password/session cryptography. Lot 1 chooses the current supported browser-safe sign-in UX while preserving:

- controlled first-owner bootstrap;
- identity-bound one-time partner invitation;
- individual owner accounts;
- MFA/TOTP before real-data cutover;
- safe recovery/reauthentication.

### Authorization

PostgreSQL/Storage RLS plus same-project integrity. Frontend checks are UX only. Browser never contains service-role/private provider secrets.

## File storage

Private Supabase Storage for explicitly archived documents/media. Object keys are opaque/project-scoped; original filename is metadata. Original uploads remain immutable; derivatives separate. Public promotional media defaults to privacy-safe remote reference unless deliberately archived.

## Realtime

Use scoped subscriptions where collaboration benefits. Realtime is freshness notification, not sole durability/order authority. Missed events are repaired by normal revision refresh/sync.

## Testing/tooling families

Target capability categories:

- Vitest or chosen compatible test runner for unit/integration/business coverage;
- property-based testing library;
- Playwright for browser/E2E/network/offline scenarios;
- Supabase CLI/local PostgreSQL for DB/RLS/migrations;
- DB-native tests such as pgTAP where useful;
- mutation testing for critical pure engines;
- static dependency/security/secret scans;
- accessibility/performance tooling appropriate to frozen gates.

Exact maintained packages/versions are **not missing documentation**; they are explicitly deferred to Lot 0/feature lot under `DEFERRED-DECISIONS.md` and must satisfy existing contracts.

## Repository tooling

- npm + committed lockfile;
- `npm ci` in CI;
- strict TypeScript;
- lint/format chosen in Lot 0;
- GitHub Actions;
- reproducible clean-checkout verification.

## Dependency policy

Add dependency only when it solves a meaningful requirement better than platform APIs/small maintained utility. Review maintenance/security/license/bundle/test impact and pin reproducibly.

## Explicitly rejected for V1

- custom always-on VPS/backend application server;
- Docker requirement for end users;
- React/Next without reviewed architectural change;
- custom authentication cryptography;
- mandatory paid API for normal operation;
- AI service required for core operation;
- production wedding data in GitHub;
- open multi-couple public project creation.

## Free-tier rule

Protect structured project data/auth/sync before decorative media. No automatic paid upgrade/overage. Provider quota values are displayed only when measured/known rather than invented.
