# Mariage OS — Public SaaS Readiness Architecture

Status: **Normative architecture constraint for V1; public self-service activation remains post-V1**

Mariage OS launches first as a private production deployment for one couple, but the core must be designed as a real multi-tenant product so a later public launch requires activation work rather than a rewrite.

The target is:

> **Private now, public-ready by construction.**

Public-ready does **not** mean exposing wedding projects publicly. It means many unrelated authenticated couples can safely create isolated projects on the same application/backend while each project remains private to its authorized members.

---

## 1. Frozen principle

The following distinction is mandatory:

### Product engine
Always multi-tenant capable:
- many users;
- many projects;
- many memberships;
- a user may belong to more than one project;
- every project-owned row is scoped by `project_id`;
- authorization is membership-based;
- Storage paths/policies are project-scoped;
- local cache is account + project scoped;
- repositories/services receive explicit project context;
- routes/deep links carry an explicit project context;
- imports, exports, backups, quotas and diagnostics are project-aware.

### Deployment policy
Controls who is allowed to create/join projects.

Initial production mode:
- `private_pair`;
- project provisioning closed except controlled bootstrap/invitation;
- intended couple only.

Future public mode:
- `public_saas`;
- verified users may create projects through protected self-service provisioning;
- invitations join existing projects;
- anti-abuse/quota/consent controls are enabled.

Changing deployment policy must not require changing wedding-domain tables or rewriting RLS.

---

## 2. Never encode single-couple assumptions into domain persistence

Forbidden implementation shortcuts:

- assuming there is only one row in `projects`;
- selecting the first project in the database;
- storing a globally unique venue code such as `S32` without project scope;
- writing RLS based on a fixed production user/email;
- using one global IndexedDB cache without account/project partitioning;
- using Storage paths without project ownership scope;
- using singleton wedding state in application services;
- making project creation impossible at schema level after the first project;
- hard-coding the two production owner UUIDs;
- assuming an authenticated user belongs to exactly one project;
- using routes that cannot identify which project a deep link belongs to.

Private V1 restrictions are policy/configuration, not data-model assumptions.

---

## 3. Project context contract

Every project-owned operation executes with an explicit `ProjectContext` concept containing at minimum:

- authenticated user identity;
- active `projectId`;
- membership role/status;
- deployment mode/read-only capability information where relevant.

UI components do not infer project scope from globally cached records.

Repository/service signatures for project-owned entities are project-scoped, e.g. conceptually:

```text
VenueRepository.list(projectId, query)
VenueRepository.get(projectId, venueId)
TaskService.create(projectId, input)
BudgetService.getScenario(projectId, scenarioId)
```

The database still validates authorization independently; passing `projectId` in the client is never authorization.

---

## 4. Project-scoped routes

Private V1 may visually hide project switching, but canonical authenticated routes must be compatible with multiple projects.

Normative route family:

```text
/app/p/:projectId/dashboard
/app/p/:projectId/venues
/app/p/:projectId/venues/:venueId
/app/p/:projectId/vendors
/app/p/:projectId/guests
/app/p/:projectId/budget
...
```

Rules:

- `projectId` is an opaque identifier, not a secret;
- RLS remains authoritative if an ID is changed manually;
- opening a project route verifies membership before rendering project data;
- unauthorized/not-found responses avoid cross-tenant information leakage;
- a user with one project is routed directly into it;
- a future user with multiple projects receives a project chooser/switcher without changing domain routes;
- links copied between partners retain project context;
- route state never embeds guest names, budget figures, secrets or other private values.

A friendly future project slug may be added as presentation/lookup data but cannot become the authorization primitive.

---

## 5. Project provisioning abstraction

Project provisioning is a protected application capability distinct from ordinary project CRUD.

Define a `ProjectProvisioningService` boundary from V1 even if private mode exposes it only during bootstrap.

### Private mode

Policy denies ordinary self-service project creation.

Controlled bootstrap creates the intended project/initial owner through the secured process in `security/BOOTSTRAP-INVITATIONS.md`.

### Public mode

The same logical provisioning boundary becomes self-service only after public-launch gates pass.

Public provisioning requires at minimum:

1. authenticated verified identity;
2. bot/abuse challenge where configured;
3. applicable rate-limit/quota checks;
4. required legal-consent versions accepted;
5. account/project eligibility checks;
6. atomic project + owner membership creation;
7. entitlement/default-quota initialization;
8. auditable operation result;
9. idempotence against retries/double submission.

No public provisioning implementation may depend on a browser-held privileged/service-role secret.

---

## 6. Deployment configuration

Deployment mode must be read from trusted configuration, not trusted solely from a frontend toggle.

Conceptual modes:

- `private_pair`;
- `invite_only`;
- `public_saas`.

The UI may read a safe public representation to decide which screens/buttons to show, but server/database authorization controls the actual provisioning capability.

Changing `private_pair -> public_saas` is an explicit release/configuration event with a public-launch checklist.

---

## 7. Authentication public readiness

Core identity rules are compatible with public operation from V1:

- each human has an independent Supabase Auth identity;
- verified email identity is separated from wedding membership;
- membership is explicit in `project_members`;
- invitation acceptance is identity-bound;
- no authorization comes from frontend-only claims;
- MFA capability remains supported;
- recovery does not grant arbitrary project membership.

Public activation additionally enables/tunes:

- self-service signup UI;
- email verification enforcement;
- CAPTCHA/Turnstile on abuse-sensitive Auth flows;
- Auth rate limits;
- custom transactional SMTP when required by public traffic;
- account recovery UX/support runbook;
- account deletion/export flows;
- legal consent capture.

Public activation does not change project RLS semantics.

---

## 8. Public abuse boundary

The wedding CRUD API must not become the abuse-control layer.

Public-only high-risk capabilities are separated conceptually as a small control plane:

- account/signup protections;
- project provisioning;
- invitation issuance throttling;
- email/contact forms;
- quota/entitlement changes;
- future billing webhook handling;
- privileged support/admin operations.

These operations may use provider/serverless functions as required, while ordinary project CRUD continues through the browser-safe Supabase client + RLS architecture.

This prevents a future public launch from requiring the whole application to move behind a custom backend.

---

## 9. Entitlements and quotas

Do not scatter assumptions such as `maxPhotos = 100` across features.

Introduce an `EntitlementPolicy` application boundary before public launch and keep V1 quota decisions centralized.

Conceptual capabilities include:

- project count per account;
- member count per project;
- Storage/media bytes;
- document/media item counts;
- large import limits;
- optional premium feature flags;
- backup limits if ever needed;
- future plan identity.

Private V1 uses the zero-cost/free-tier policy.

A future paid/free public plan changes entitlement configuration, not feature-domain logic.

Billing-provider identifiers, if added later, remain separate from wedding data and are never authorization by themselves.

---

## 10. Storage and media at public scale

Existing project-scoped private Storage remains valid for public mode.

Public readiness requires:

- project-scoped paths/policies;
- no user-provided filename as authority/path identity;
- quota checks before large upload;
- orphan cleanup;
- pagination/lazy loading;
- derivatives/thumbnails separated from originals;
- deletion/recovery behavior scoped to one project;
- no cross-project signed URL generation;
- no globally public bucket for private wedding media.

Public marketing assets use a completely separate public asset path/bucket/build asset strategy.

---

## 11. Realtime and query scaling

Subscriptions and queries are always limited to the active authorized project and relevant entity set.

Do not:

- subscribe a client to all projects;
- fetch every row merely to compute a counter;
- use global broadcasts containing private wedding payloads;
- depend on client-side filtering for tenant separation.

Index/pagination rules remain project-first so growth from one project to many does not require redesigning query semantics.

---

## 12. Local-first multi-account/multi-project readiness

IndexedDB/local state is partitioned by at least:

```text
account/user identity
    -> project ID
        -> entity/cache/queue
```

Requirements:

- switching project never displays another project's cached rows;
- switching account never displays prior account private data;
- pending mutations preserve their original account/project scope;
- logout safe-purge applies to the authenticated account/project caches as defined by security policy;
- future project switcher can activate a different cache partition without schema redesign;
- offline pins are project-scoped.

---

## 13. Public web shell vs private application

Future public deployment has two privacy/SEO zones.

### Public marketing/help shell

Examples:

```text
/
/features
/security
/help
/privacy
/terms
/login
/signup
```

May be indexable and use conventional SEO/Open Graph metadata.

### Authenticated wedding application

```text
/app/p/:projectId/...
```

Must remain non-indexable/private and must never expose wedding data in page metadata, social previews, sitemap or static generation.

Marketing SEO and private app routing are separate concerns.

See `ux/SEO-METADATA-IMAGES.md` and future public-launch docs.

---

## 14. Public admin/support boundary

A public product may eventually need support/admin tooling, but it must not be implemented as hidden buttons in the ordinary customer frontend backed by a service-role key.

Future support tooling requires:

- separate privileged authorization;
- audited access;
- least privilege;
- no unrestricted project browsing by default;
- explicit reason/context for privileged access where applicable;
- secret credentials only in server-side trusted environments;
- no weakening of customer RLS as the normal support mechanism.

Private V1 does not need this console, but architecture must not assume owner users are system administrators.

---

## 15. Legal/privacy public readiness

Public launch adds product/legal obligations that are intentionally dormant for private V1 but architecturally anticipated:

- public Privacy Policy/Terms versions;
- explicit consent/version evidence where legally required;
- user account deletion/export;
- project deletion/export;
- data-retention policy;
- support/contact channel;
- subprocessors/provider inventory;
- analytics/cookie decision and consent where applicable;
- privacy-safe diagnostics;
- abuse/reporting process.

These requirements must be reviewed for the jurisdictions actually served before public launch.

No legal/compliance claim may be inferred solely from this architecture document.

---

## 16. Public launch does not imply wedding projects become shareable/searchable

By default, a public Mariage OS SaaS still has private projects.

Not part of public activation unless separately designed:

- public wedding websites;
- guest portals;
- public venue directories;
- public vendor reviews;
- project discovery/search engines;
- anonymous project read access.

Each would require its own explicit privacy/data model.

---

## 17. Public activation delta

If V1 follows this architecture, moving from private deployment to public SaaS should primarily require:

### Activate/build
- public landing/help/legal pages;
- signup + account onboarding;
- protected self-service project provisioning;
- bot/CAPTCHA and tuned rate limits;
- transactional email/SMTP suitable for public usage;
- consent/account lifecycle flows;
- quota/entitlement implementation;
- public support/abuse operations;
- public monitoring/capacity review;
- optional billing if a paid plan is desired;
- project chooser for users with >1 project.

### Reuse without redesign
- projects/project_members model;
- project-scoped RLS;
- domain tables;
- facts/sources;
- venues/vendors/guests/budget/tasks/decisions;
- Storage isolation;
- IndexedDB project isolation;
- import/export/backups;
- offline/sync conflict model;
- route family/project context;
- tests for cross-project isolation.

A future public-launch plan that requires replacing those core systems indicates this constraint was violated.

---

## 18. Testing public readiness before public activation

Even while private, architecture tests should prove:

- two synthetic projects may coexist in the same local/Supabase test environment;
- same user may be member of two synthetic projects without data collision;
- unrelated users cannot access each other's project;
- project-scoped deep links resolve correctly;
- local cache isolates project A/project B;
- external IDs may repeat safely between projects;
- Storage remains isolated;
- import/backup restore targets the intended project only;
- Realtime subscriptions do not leak another project's event;
- private deployment provisioning still refuses unrelated project creation.

These tests preserve the public-ready property continuously rather than testing it only years later.

---

## 19. Architecture acceptance rule

A V1 implementation change fails architecture review if it makes public activation materially harder by introducing a single-couple assumption where a project-scoped abstraction already exists.

The reviewer should ask:

> Could ten unrelated couples run this exact domain engine on the same backend without seeing or corrupting each other's data?

If the answer is no because of domain architecture rather than intentionally disabled onboarding/operations, the change must be redesigned before acceptance.
