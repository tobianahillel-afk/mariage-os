# Deliberately Deferred Decisions

Status: **Normative ambiguity register**

This file prevents implementation details from becoming accidental hidden requirements. Every item here is intentionally deferred to a named lot. Anything not listed here and already covered by a normative specification should not be reinterpreted silently.

## Lot 0 decisions

### Tool versions
Choose concrete Node/Vite/TypeScript/Vitest/Playwright/etc. versions compatible with current stable tooling. Commit lockfile. Record significant choice only if it changes architecture.

### Lint/format stack
Select minimal maintained tooling that enforces the documented coding standards without creating unnecessary dependencies.

### Test directory convention
Choose colocated vs centralized test layout and document it consistently.

### Local Supabase bootstrap
Choose exact scripts/commands for local migrations/seed/test reset.

## Lot 1 decisions

### IndexedDB implementation
Decide native API vs a small maintained wrapper based on:

- transaction ergonomics;
- migration support;
- bundle size;
- typing;
- maintenance/security posture.

The choice must preserve repository/local-first abstraction boundaries.

### Auth UX
Finalize password vs email-link UX details according to current Supabase capabilities and MFA compatibility, while preserving invitation/project isolation requirements.

### Session durations
Select concrete configured values after testing usability/security; critical actions still require recent/strong auth according to security spec.

## Lot 2/UI decisions

### Visual palette and fonts
Finalize exact accessible palette/font stack consistent with Design System. Do not require proprietary fonts to run.

### Table implementation
Use ordinary semantic table/grid first; introduce virtualization only if performance measurements require it.

## Lot 4 import decisions

### XLSX library
Choose minimal maintained parser that does not execute macros/active content and supports required values/sheets.

### Canonical JSON schema tooling
Choose concrete JSON Schema validator/version suitable for browser and CI. The documented semantics remain authoritative.

### CSV parser
Choose native/small parser library after hostile fixture testing.

## Lot 9 map decisions

Choose mapping library/tile integration based on:

- zero-cost operation;
- privacy;
- bundle size;
- offline graceful failure;
- attribution obligations.

Map provider must not become essential to venue data access.

## Lot 10 service worker

Choose manual service worker vs maintained Vite/PWA helper only after confirming lifecycle/update behavior can satisfy `PWA-LIFECYCLE.md` without hiding dangerous stale-cache behavior.

## Quota usage reporting

Providers may not expose every free-tier quota through a safe public client API. Implement only values that can be measured accurately. Never display invented precision. Where live provider usage cannot be fetched safely, display locally known upload/storage counts and link/admin guidance as documented.

## Push notifications

Not V1. Do not introduce a notification backend merely to satisfy reminders. V1 uses in-app reminders and calendar export where implemented.

## Seating plan

Not V1. Domain should avoid preventing it, but do not create premature drag/drop canvas complexity.

## AI/OCR

Not V1. Imports and document handling must work fully without AI services or paid inference.

## Rule for closing an item

When a deferred decision is made:

1. record it in code/config or a new ADR if architectural;
2. update this file/remove resolved item;
3. add relevant tests;
4. verify it does not contradict normative requirements.
