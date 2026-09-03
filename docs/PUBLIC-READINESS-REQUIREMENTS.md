# Mariage OS — Public-Readiness Requirements

Status: **Normative cross-cutting V1 architecture requirements**

These requirements do not make public self-service a V1 feature. They ensure private V1 does not introduce architecture that would force a rewrite before public launch.

IDs use `PUB-*` and are referenced by architecture/implementation/checkpoint reviews.

---

## Tenancy / routing

### PUB-001 — Multi-project persistence
Priority: **P0**

The production schema/domain must allow multiple independent projects to coexist even though real private V1 uses one project.

### PUB-002 — Multi-project membership
Priority: **P0**

One Auth user may belong to multiple projects with project-specific roles without data collision.

### PUB-003 — Project-scoped authorization
Priority: **P0**

Every private wedding data access must be authorized for the requested project; knowledge of `project_id`/entity UUID is insufficient.

### PUB-004 — Project-scoped routes
Priority: **P1**

Canonical authenticated deep links retain explicit project context so multi-project public UX does not require a route redesign.

### PUB-005 — Project-scoped local state
Priority: **P0**

IndexedDB/offline/pending mutations are partitioned by account/project and project/account switching cannot expose another partition.

---

## Provisioning / authentication

### PUB-006 — Deployment-policy provisioning
Priority: **P0**

Private one-couple provisioning restriction must be implemented as trusted deployment/provisioning policy, not a schema assumption that only one project can exist.

### PUB-007 — Provisioning boundary
Priority: **P1**

Project creation uses a dedicated provisioning service/operation boundary distinct from normal project CRUD so future anti-abuse/consent/entitlement controls can be added without changing domain CRUD.

### PUB-008 — No browser privileged secret
Priority: **P0**

Neither private bootstrap nor future public provisioning may require a service-role/privileged secret in the client.

### PUB-009 — Identity/member separation
Priority: **P0**

Authenticated identity and wedding-project membership remain separate concepts; account recovery never grants arbitrary project membership.

---

## Data / Storage / Realtime

### PUB-010 — Same-project referential integrity
Priority: **P0**

Project-owned relationships prevent cross-project parent/entity references independent of UI filtering.

### PUB-011 — Storage tenant isolation
Priority: **P0**

Private media/documents are project-scoped and another project cannot read/write/list/generate authorized access to them.

### PUB-012 — Realtime tenant scope
Priority: **P0**

Realtime subscriptions/events used by a client are limited to authorized relevant project scope and cannot leak another tenant's private payload.

### PUB-013 — Project-aware import/backup
Priority: **P0**

Import, export, backup and restore always know the source/target project context and cannot silently cross tenant boundaries.

---

## UX / SEO

### PUB-014 — Single-project UX without single-project architecture
Priority: **P1**

Private V1 may hide project switching and route mechanics when the user has one project, but underlying project context remains explicit.

### PUB-015 — Public/private web boundary
Priority: **P1**

Future indexable public marketing/Auth pages are architecturally separated from non-indexable private `/app` project routes and metadata.

### PUB-016 — Synthetic public marketing data
Priority: **P0**

No real wedding/guest/budget/document data may be used in public marketing screenshots/assets/SEO previews.

---

## Quotas / portability / public activation

### PUB-017 — Centralized entitlement boundary
Priority: **P1**

Quota/plan decisions must be centralizable through an entitlement/policy boundary; features must not scatter plan-specific limits throughout domain logic.

### PUB-018 — Domain portability
Priority: **P1**

Future public provider/plan changes must not require rewriting wedding-domain semantics; provider integrations remain behind repository/control-plane abstractions where appropriate.

### PUB-019 — Public launch gate
Priority: **P0**

Self-service `public_saas` mode cannot be enabled without PASS of `operations/PUBLIC-LAUNCH-GATE.md`.

### PUB-020 — Public-ready regression test
Priority: **P0**

Private V1 test environments must continuously include multiple synthetic projects/users and prove cross-tenant isolation so public readiness cannot silently regress.

---

## Minimum acceptance evidence during private V1

Before V1 cutover, evidence must include:

- project A + project B coexist;
- one user belongs to both projects;
- another user belongs to only one;
- cross-project DB/RLS attack denied;
- cross-project child-parent reference denied;
- project-scoped routes/deep links tested;
- local cache project isolation tested;
- Realtime cross-project leakage test;
- Storage cross-project access test;
- private provisioning denies unrelated project creation;
- public-ready architecture review recorded at integration checkpoints.
