# Deliberately Deferred Decisions

Status: **Normative implementation-choice register**

This file lists choices intentionally left to named implementation lots or future public activation. Anything already fixed by the frozen V1 product/domain/security/public-readiness/engineering contracts must not be reinterpreted as deferred.

A deferred implementation choice may change mechanism, not product/data/security/architecture semantics.

## Lot 0

### Tool versions
Choose maintained compatible Node/Vite/TypeScript/Vitest/Playwright/etc. versions, commit a lockfile and document support/runtime requirements.

### Lint/format implementation stack
Choose minimal maintained tooling that enforces `CODING-STANDARDS.md`, `CODEBASE-STRUCTURE.md` and `MODULE-SIZE-COMPLEXITY.md` as closely/reliably as practical.

The rules/thresholds are not deferred; only exact maintained packages/configuration mechanism is.

### Test placement
**Not deferred anymore.** `CODEBASE-STRUCTURE.md` freezes colocated unit/domain/property tests plus dedicated integration/security/E2E/fixtures/DB test locations.

### Local Supabase bootstrap
Choose exact scripts/commands for migrations, seed and isolated test reset.

## Lot 1

### IndexedDB implementation
Choose native IndexedDB vs small maintained wrapper based on transaction ergonomics, migrations, bundle size, typing and maintenance/security. Frozen local-data semantics remain unchanged.

### Auth UX mechanism
**Closed in WP-1.3.** V1 ordinary authentication uses Supabase Auth **email + password** with verified email required for private provisioning and provider-supported recovery. The application consumes a provider-neutral Auth port so a future supported sign-in mechanism may replace the adapter without changing project membership/tenancy semantics.

No browser service-role secret, custom password hashing or custom session-token cryptography is introduced.

### Session configuration
Choose concrete ordinary-session values compatible with provider capability/usability. Critical operations still require recent/strong authentication.

## UI implementation

### Typography stack
Choose exact accessible UI/display font stack within visual contracts. Palette/domain color architecture is frozen.

### Data-table implementation
Start semantic/simple. Add virtualization only if measured performance budgets require it.

### Seating presentation
**Not deferred:** structured seating sections/tables/assignments are V1.

**Deferred/post-V1:** drag-and-drop seating canvas, automatic optimization and advanced visual floor-plan editing.

### Wedding-day presentation
**Not deferred:** structured event timeline is V1.

**Deferred/post-V1:** dedicated live operations mode, staff command center or push-driven day-of execution.

## Lot 4 import/export

### XLSX library
Choose maintained parser satisfying hostile-file/active-content requirements.

### JSON Schema tooling
Choose concrete validator/schema dialect compatible with browser/CI; canonical semantics remain authoritative.

### CSV parser
Choose native/small maintained parser after hostile fixture testing.

## Lot 6 / Lot 11 guest communications

### Email provider
Deferred: exact transactional email vendor/SDK/API.

Not deferred:
- provider-neutral port boundary;
- server-side credentials;
- authenticated sending-domain readiness for production;
- delivery/bounce event handling;
- preview/idempotency/privacy/cost rules;
- manual link/QR fallback.

### SMS provider
Deferred: exact SMS vendor/SDK/API.

Not deferred:
- validated normalized destinations;
- provider-neutral port;
- delivery/failure callbacks;
- bounded retries/cost caps;
- no secrets in browser.

### WhatsApp provider
Deferred: exact official Business Platform-compatible provider/integration mechanism.

Not deferred:
- official provider/API boundary;
- no personal WhatsApp/WhatsApp Web automation;
- provider template/eligibility rules where required;
- authenticated webhook handling;
- send/cost caps;
- provider-neutral domain.

### Durable scheduler mechanism
Deferred: exact server-side scheduling infrastructure compatible with chosen stack/provider.

Not deferred:
- browser timer/service worker cannot be authoritative scheduler;
- dispatch revalidates authorization/provider readiness/caps;
- idempotency prevents duplicate paid sends.

### Guest invitation token representation
Exact standard primitive/package helpers may be chosen, but entropy/hash-at-rest/rotation/revocation/non-logging semantics are not deferred.

### Communication UI implementation details
Fine visual component implementation may vary within `GUEST-COMMUNICATIONS-BLUEPRINTS.md` and the frozen visual system. The QIF flow/order, preview-before-send and Guests-domain placement are not deferred.

## Lot 9 map

Choose mapping/tile integration based on zero-cost operation, privacy, bundle size, attribution and graceful failure. Map provider must not become required for core venue data access.

## Lot 10 service worker

Choose manual service worker vs maintained Vite/PWA helper only after proving lifecycle/update behavior satisfies `PWA-LIFECYCLE.md`.

## Provider quota reporting

Implement only provider usage values that can be safely and accurately measured. Where exact live values are unavailable, show explicitly labeled estimates/counters rather than invented precision.

This applies to core hosting and communication-provider usage.

## Backup implementation tuning

Backup format, authenticated encryption semantics and algorithm/KDF parameter storage are frozen. Implementation may benchmark device UX and choose supported tuning only within the versioned format/security contract.

## Public SaaS activation — deliberately post-V1

The public-facing activation work is deferred, but public-ready core architecture is not.

Deferred public product/operations work includes:

- public self-service signup UI;
- public project-provisioning control plane;
- Turnstile/CAPTCHA rollout for public Auth flows;
- public provisioning/invite anti-abuse limits;
- public-scale communication-provider account/billing/tenant-quota choices beyond private V1;
- public Privacy Policy/Terms/consent capture;
- public marketing/help site beyond private deployment needs;
- project chooser UI for multi-project users;
- public account lifecycle/support flows;
- entitlement/plan UI and future billing integration;
- public observability/abuse/support operations;
- public-launch capacity/commercial tier decisions.

Not deferred and required in private V1 architecture/tests:

- multi-project-capable schema;
- one user may belong to multiple synthetic projects;
- project-scoped routes/services/local state;
- project-membership RLS;
- same-project referential integrity;
- Storage/Realtime tenant isolation;
- deployment-policy provisioning abstraction;
- public/private SEO boundary;
- guest capability isolation from project membership;
- tenant-scoped communication domain/campaign data;
- `PUB-*` regression tests at checkpoints;
- no single-couple assumptions in core domain code.

## Explicitly post-V1

- graphical drag/drop seating canvas and automatic seating optimization;
- advanced shuttle/hotel allocation engine;
- dedicated live wedding-day operations mode;
- arbitrary self-registration of uninvited guests;
- vendor temporary sharing links;
- push notifications;
- AI/OCR automatic quote/contract extraction;
- automatic Internet venue research inside the app;
- internal messaging/social chat;
- native App Store/Play Store app;
- banking/payment integration;
- full calendar-provider synchronization;
- public self-service SaaS activation listed above;
- cold-marketing contact acquisition/scraped-list messaging.

**Not post-V1 anymore:** secure invited-household RSVP portal, secure invitation links/QR, and Email/SMS/WhatsApp invitation/reminder communication through configured official providers. Those are frozen V1 scope.

## Not allowed as “implementation discretion”

The following are not deferred:

- V1 feature boundary including FTR-105..120;
- QIF acceptance for onboarding/invitations/guest RSVP;
- canonical code layer/folder architecture;
- code-size/complexity guardrails;
- test placement convention;
- project isolation/RLS;
- guest capability isolation;
- same-project referential integrity;
- public-ready multi-tenant core;
- project-scoped authenticated routes/context;
- controlled private provisioning policy;
- partner-account invitation security semantics;
- guest RSVP token security semantics;
- communication audience preview/freeze;
- communication idempotency;
- provider webhook authentication/dedup;
- provider credential isolation;
- no automatic provider paid upgrade/overage;
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
- frozen color/domain visual architecture.

## Closing a deferred item

When a choice is made:

1. record it in code/config or ADR if architectural;
2. update/remove this item;
3. add relevant tests;
4. verify no normative requirement is weakened.

Before public self-service activation, `operations/PUBLIC-LAUNCH-GATE.md` must pass; merely deleting public items from this file is not sufficient authorization.
