# ADR 0007 — Private Deployment, Multi-Tenant/Public-Ready Core

Status: **Accepted**

## Context

Mariage OS is initially built for one real couple and one real wedding project. The first production goal is private, simple and zero-cost.

However, the product may later become a public application used by unrelated couples.

A naive implementation could optimize too aggressively for the first deployment by assuming:

- one project exists;
- each user belongs to one project;
- routes do not identify project context;
- local cache is global;
- project provisioning is permanently one-time;
- service methods rely on implicit current wedding;
- project-scoped tenant tests are unnecessary.

Those choices would make a later public launch require a major rewrite of routing, services, local storage, authorization and data access.

## Decision

Mariage OS V1 uses:

- **private deployment policy** for the real couple;
- **multi-tenant/public-ready architecture** in the core from the first implementation.

The tenant is `project_id`.

Users and projects are many-to-many through project membership.

Project-owned domain operations use explicit project context.

Canonical authenticated routes are project-scoped.

RLS/Storage/Realtime/local cache/import/backup preserve tenant isolation.

Private one-project provisioning restrictions are implemented as trusted deployment/provisioning policy, not as a schema limitation.

Future public activation adds public signup, abuse protection, provisioning eligibility, quotas/entitlements, legal/support/operational layers without rewriting the wedding-domain engine.

## Consequences

### Positive

- future public SaaS transition is incremental rather than architectural rewrite;
- tenant isolation is continuously tested before public launch;
- deep links are unambiguous;
- local-first architecture handles future project switching safely;
- support for multiple synthetic projects improves security testing now;
- provider/domain boundaries remain cleaner.

### Cost now

- service/repository APIs carry project context even for a one-project real user;
- tests need multi-project fixtures;
- canonical URLs contain project context;
- local cache partitioning is stricter;
- provisioning is abstracted earlier than strictly needed for one private couple.

This additional complexity is accepted because it protects a plausible product evolution and materially strengthens isolation/security even in private V1.

## Rejected alternatives

### A. Implement as a one-project personal app and refactor later
Rejected because tenant assumptions spread through routing, cache and services and are expensive/risky to remove after real data/collaboration exists.

### B. Make public signup a V1 feature immediately
Rejected because it adds abuse, support, legal, email-deliverability, quota and operational scope before validating the core wedding product.

### C. Put every request behind a custom backend now
Rejected because ordinary project CRUD can remain simpler through browser-safe Supabase APIs + RLS. Public-only sensitive operations can later use a small control-plane/serverless boundary.

## Verification

During private V1 development/checkpoints:

- multiple synthetic projects coexist;
- one synthetic user belongs to multiple projects;
- unrelated users remain tenant-isolated;
- route/local cache/Realtime/Storage are project-scoped;
- private provisioning still denies unrelated project creation.

Governed by:

- `architecture/PUBLIC-SAAS-READINESS.md`;
- `domain/TENANCY-MODEL.md`;
- `PUBLIC-READINESS-REQUIREMENTS.md`;
- `security/PUBLIC-ABUSE-PROTECTION.md`;
- `operations/PUBLIC-LAUNCH-GATE.md`.
