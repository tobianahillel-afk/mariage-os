# Threat Model — Authorization Addendum

Status: **Normative addendum to `THREAT-MODEL.md`**

## Threat: BOLA / IDOR by guessed or altered project/resource ID

Attack:

- attacker changes `/app/p/:projectId/...`;
- submits a known/guessed venue/guest/document UUID from another tenant;
- calls REST/RPC directly without UI.

Controls:

- active membership + explicit permission check;
- row project ownership;
- same-project relational integrity;
- no existence-leaking error details;
- direct deny tests across projects A/B/C.

## Threat: vertical privilege escalation

Attack:

- viewer/editor calls owner-only RPC;
- client changes role field in update payload;
- user attempts to assign themselves owner;
- ordinary permission is reused for security/admin action.

Controls:

- centralized permission catalog/matrix;
- role changes only through privileged command;
- field-level protected membership columns;
- recent strong auth for owner/security operations;
- editor/viewer direct-RPC denial tests.

## Threat: horizontal member impersonation

Attack:

- owner/editor supplies partner's `user_id` to create/update personal rating/preferences/decision approval;
- user overwrites another member's authored state.

Controls:

- author identity derived from `auth.uid()` where possible;
- relationship check independent of broad project role;
- unique author/member constraints;
- direct impersonation deny tests.

## Threat: stale permission / JWT claim after downgrade

Attack:

- client keeps old local role/permission state after server-side downgrade/revocation;
- long-lived token/permission cache attempts mutation.

Controls:

- project permissions resolved from current DB membership/role mapping;
- project role not treated as permanently authoritative client claim;
- RLS/RPC checks current server state;
- local permission cache is UX only;
- downgrade/revocation mid-session tests.

## Threat: permission bleed during project switching

Attack:

- multi-project user switches A→B but old cache/search/realtime/read model exposes A data in B context.

Controls:

- canonical project-scoped routes;
- project-keyed IndexedDB/local stores;
- subscription cleanup/rebinding;
- read-model project context mandatory;
- multi-project switch E2E tests.

## Threat: sensitive-field leakage under broad read role

Attack:

- generic viewer can read guest-sensitive fields, finance or private contracts because row is readable;
- search/export/view exposes columns not intended for role.

Controls:

- permission keys for guest-sensitive, finance, sensitive documents and sensitive exports;
- safe projections/views/read models or column protections where needed;
- export allowlists;
- Search filters by domain read permission;
- viewer sensitive-field deny tests.

## Threat: support/admin universal-access backdoor

Attack:

- future support account becomes hidden owner of every wedding;
- global `is_admin` bypass added for convenience;
- service-role used in normal application paths.

Controls:

- platform admin trust domain separate from project membership;
- no V1 in-app impersonation;
- service-role server/ops only;
- future support access JIT/time-limited/audited and separately reviewed;
- no permanent blanket tenant-read UI.

## Threat: signed Storage URL privilege expansion

Attack:

- user obtains/copies signed URL for object they should no longer access;
- predictable object path treated as authorization.

Controls:

- private Storage policies;
- permission check before signed access generation;
- short expiry;
- opaque paths;
- revocation/expiry expectations documented;
- Storage direct deny tests.

## Threat: privilege escalation through import/restore

Attack:

- import attempts to set membership/project/audit/security fields;
- backup restore injects foreign-project references or role rows.

Controls:

- membership/security fields protected from ordinary import;
- canonical import allowlists/protected truth;
- restore validates target project and authorization;
- role/permission catalogs migration-controlled;
- cross-project restore/import fixtures denied.

## Mandatory adversarial authorization tests

- anonymous private read/write;
- outsider read/write;
- other-project owner access;
- guessed UUID/BOLA;
- project ID tampering;
- viewer/editor owner-command call;
- arbitrary membership-role update;
- role downgrade without re-login;
- membership revoke without re-login;
- partner-rating/approval impersonation;
- sensitive guest/finance/document viewer access;
- Search/export sensitive-field leak;
- project-switch cache/realtime bleed;
- signed Storage URL/path misuse;
- import/restore privilege-field injection;
- platform/support role cannot appear as implicit project membership.