# Deliberately Deferred Decisions

Status: **Normative implementation-choice register**

This file lists choices intentionally left to named implementation lots. Anything already fixed by the frozen V1 product/domain/security/visual contracts must not be reinterpreted as deferred.

A deferred implementation choice may change mechanism, not product/data/security/UX/visual semantics.

## Lot 0

### Tool versions
Choose maintained compatible Node/Vite/TypeScript/Vitest/Playwright/etc. versions, commit a lockfile and document support/runtime requirements.

### Lint/format stack
Choose minimal maintained tooling enforcing documented standards.

### Test layout
Choose colocated vs centralized layout consistently.

### Local Supabase bootstrap
Choose exact scripts/commands for migrations, seed and isolated test reset.

## Lot 1

### IndexedDB implementation
Choose native IndexedDB vs a small maintained wrapper based on transaction ergonomics, migrations, bundle size, typing and maintenance/security. Repository/local-first abstractions and frozen local-data semantics must remain unchanged.

### Auth UX mechanism
Choose the current supported Supabase browser-safe sign-in UX (for example password and/or provider-supported email flow) while preserving controlled single-couple bootstrap, identity-bound invitation, MFA and recovery rules.

### Session configuration
Choose concrete ordinary-session values compatible with provider capability and usability. Critical operations still require recent/strong authentication.

## UI implementation

### Font stack
Choose the exact accessible/licensed type families that implement the frozen two-role typography direction in `VISUAL-IDENTITY.md`/`DESIGN-SYSTEM.md`. No proprietary font dependency is required for correct operation.

### Color palette
**Not deferred:** V1 color architecture, neutral foundation, brand family, domain accents and semantic roles are frozen in `docs/ux/COLOR-SYSTEM.md`.

Implementation may create additional tonal derivatives only when they preserve the frozen hue/role relationship and pass accessibility review. It may not replace the palette with a simpler one-accent theme without reviewed visual/spec change.

### Data-table implementation
Start semantic/simple. Add virtualization only if measured performance budgets require it.

### Motion implementation mechanism
The behavior and reduced-motion semantics in `docs/ux/MOTION-INTERACTION.md` are frozen. Exact CSS/Web Animations/View Transition implementation details may use progressive enhancement and browser support as appropriate without changing the interaction meaning.

### Seating presentation
**Not deferred:** structured seating sections/tables/assignments are V1.

**Deferred/post-V1:** drag-and-drop seating canvas, automatic optimization and advanced visual floor-plan editing.

### Wedding-day presentation
**Not deferred:** structured event timeline is V1.

**Deferred/post-V1:** dedicated live operations mode, staff command center or push-driven day-of execution system.

## Lot 4 import/export

### XLSX library
Choose maintained parser satisfying hostile-file/active-content requirements.

### JSON Schema tooling
Choose concrete validator/schema dialect compatible with browser and CI; canonical V1 semantics and addendum remain authoritative.

### CSV parser
Choose native/small maintained parser after hostile fixture testing.

## Lot 9 map

Choose mapping/tile integration based on zero-cost operation, privacy, bundle size, attribution and graceful failure. Map provider must not become required for core venue data access.

## Lot 10 service worker

Choose manual service worker vs maintained Vite/PWA helper only after proving lifecycle/update behavior satisfies `PWA-LIFECYCLE.md`.

## Provider quota reporting

Implement only provider usage values that can be safely and accurately measured. Where exact live values are unavailable, show explicitly labeled locally-known estimates/counters rather than invented precision.

## Backup implementation tuning

The backup format, authenticated encryption semantics and algorithm/KDF parameter storage are frozen. Implementation may benchmark device UX and choose supported runtime tuning only within the versioned format/security contract; any algorithm/format change requires explicit version/spec review.

## Explicitly post-V1

- graphical drag/drop seating canvas and automatic seating optimization;
- advanced shuttle/hotel allocation engine;
- dedicated live wedding-day operations mode;
- guest portal/vendor temporary sharing links;
- push notifications;
- AI/OCR automatic quote/contract extraction;
- automatic Internet venue research inside the app;
- internal messaging;
- native App Store/Play Store app;
- banking/payment integration;
- automated email sending;
- full calendar-provider synchronization.

## Not allowed as “implementation discretion”

The following are **not** deferred:

- V1 feature boundary;
- project isolation/RLS;
- same-project referential integrity;
- controlled single-couple bootstrap;
- invitation security semantics;
- local pending-edit durability;
- logout safe-purge semantics;
- weekday mapping;
- money/tax semantics;
- payment/refund/deposit states;
- named budget scenarios;
- fact value types/evaluation rules;
- parent-scoped nested external IDs;
- canonical import non-destructive behavior;
- seating structured data;
- event timeline structured data;
- contract version/readiness semantics;
- portable backup/recovery requirements;
- visual thesis and multi-color domain architecture;
- semantic/domain color separation;
- visual/UX acceptance gates.

## Closing a deferred item

When a choice is made:

1. record it in code/config or ADR if architectural;
2. update/remove this item;
3. add relevant tests/review evidence;
4. verify no normative requirement is weakened.
