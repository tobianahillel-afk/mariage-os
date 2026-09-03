# Route/Screen Contracts — Project Scope Addendum

Status: **Normative public-readiness addendum to `SCREEN-CONTRACTS.md`**

This addendum changes route **shape**, not the screen jobs/content already defined in `SCREEN-CONTRACTS.md`.

Where the base document shows authenticated project routes such as `/dashboard`, `/venues` or `/budget`, the canonical V1 implementation route family is project-scoped:

```text
/app/p/:projectId/dashboard
/app/p/:projectId/search
/app/p/:projectId/inbox
/app/p/:projectId/venues
/app/p/:projectId/venues/:venueId
/app/p/:projectId/venues/:venueId/visit
/app/p/:projectId/venues/compare
/app/p/:projectId/vendors
/app/p/:projectId/vendors/:vendorId
/app/p/:projectId/guests
/app/p/:projectId/households/:householdId
/app/p/:projectId/seating
/app/p/:projectId/tasks
/app/p/:projectId/decisions
/app/p/:projectId/budget
/app/p/:projectId/budget/scenarios/:scenarioId
/app/p/:projectId/planning
/app/p/:projectId/timeline
/app/p/:projectId/map
/app/p/:projectId/documents
/app/p/:projectId/documents/:documentId
/app/p/:projectId/import
/app/p/:projectId/export
/app/p/:projectId/backup
/app/p/:projectId/settings
/app/p/:projectId/diagnostics
```

The exact router syntax/parameter naming may be implemented differently only if all semantics below remain true.

---

## 1. Why project ID is in canonical routes

- deep links remain unambiguous when a user belongs to multiple projects;
- project switch does not depend on hidden global state;
- copied links retain tenant context;
- browser refresh can reconstruct intended context;
- public SaaS activation does not require changing every route;
- authorization can still deny an edited/guessed project ID through RLS.

Project ID is context, never authorization.

---

## 2. Root/auth routes

Public/global routes remain outside project scope:

```text
/
/login
/signup          # hidden/disabled in private_pair mode
/invite/:token
/onboarding
/help            # future public shell
/privacy         # future public shell
/terms           # future public shell
```

After authentication:

- one authorized project → redirect to last safe route or `/app/p/:projectId/dashboard`;
- multiple projects → future project chooser;
- zero projects + private mode → invitation/bootstrap/recovery state;
- zero projects + public mode → protected create-project onboarding.

---

## 3. Unauthorized project route

If a signed-in user opens `/app/p/<other-project-id>/venues` without membership:

- do not render cached/private rows from the requested tenant;
- do not reveal project name/member count/existence unnecessarily;
- show generic unauthorized/not-found recovery UX;
- allow return to an authorized project chooser/home;
- record no sensitive project data in diagnostics.

---

## 4. Single-project V1 UX

The real private couple should not feel burdened by tenant mechanics.

In private V1:

- project chooser may be skipped;
- project ID need not be visually prominent;
- sidebar/header may show the wedding name rather than technical ID;
- route generation happens automatically;
- all project services still receive explicit project context.

The technical route supports future public scale while UX stays simple.

---

## 5. Back/navigation state

Collection filters/compare selections may be encoded in safe query/state when useful, but:

- never encode guest names, notes, budget numbers or secrets unnecessarily;
- changing project resets project-specific filters/selections unless explicitly stored per project;
- browser Back remains useful inside the same project;
- project switch never leaves a stale detail page from previous project rendered.

---

## 6. Offline routes

Offline deep-link handling:

- route may open only if authorized project context was previously established on that account/device and required cache exists;
- project ID selects the correct IndexedDB partition;
- an uncached/unrecognized project cannot be fabricated offline merely from an ID;
- pending mutations remain bound to their original project route/context.

---

## 7. SEO/privacy

All `/app/p/**` routes are private application routes:

- excluded from public sitemap;
- non-indexable according to SEO contract;
- generic/private-safe metadata only;
- no Open Graph generation from wedding entities.

Public marketing pages use the separate shell in `PUBLIC-WEB-SHELL.md`.
