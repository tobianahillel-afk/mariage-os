# Mariage OS — Authorization Model

Status: **Normative V1 + public-readiness security contract**

Purpose: define who may do what, on which project/resource, under which conditions, without relying on UI hiding or ad-hoc role checks.

## 1. Core model

Mariage OS uses a hybrid authorization model:

1. **Authentication** establishes user identity and assurance level.
2. **Project membership** establishes the relationship between a user and a project.
3. **Role template** provides a coarse permission bundle.
4. **Explicit permission checks** authorize an action.
5. **Relationship/attribute checks** further constrain actions such as “write only my own rating”.
6. **Recent-auth/MFA requirements** protect high-impact operations.
7. **RLS / Storage RLS / narrow database commands** enforce authorization server-side.

The frontend may use permissions to render appropriate UX, but frontend checks are never authoritative.

OWASP principles applied: least privilege, deny by default, authorization on every request, secure failure, relationship/attribute checks where role alone is insufficient.

## 2. Never authorize by role string in feature code

Forbidden pattern:

```ts
if (member.role === 'owner') {
  // privileged behavior
}
```

Required application abstraction:

```ts
can(projectId, permission, context?)
```

Required database abstraction conceptually:

```sql
has_project_permission(target_project_id, requested_permission)
```

Role-to-permission mapping is centralized. Domain services ask for a permission, not a role name.

## 3. Project permissions are not trusted from stale JWT claims

Project membership/role can vary by project and can change while a user remains signed in.

Therefore:

- JWT proves authenticated identity and assurance information;
- project authorization is resolved from current database membership/role-permission state;
- project roles are not treated as permanently trustworthy client JWT claims;
- role downgrade/revocation must take effect server-side without waiting for a long JWT lifetime;
- local cached permissions may drive temporary offline UX but never authorize a cloud operation.

Platform-level claims may be used later only through separate reviewed architecture; they must never bypass project isolation.

## 4. Permission catalog

Permission keys are stable security API, versioned in migrations and TypeScript contracts.

### Project/admin

- `project.read`
- `project.settings.update`
- `project.archive`
- `project.delete`
- `members.read`
- `members.invite`
- `members.manage_roles`
- `security.manage`
- `audit.read`

### Venues/vendors/access

- `venues.read`
- `venues.write`
- `vendors.read`
- `vendors.write`
- `access.read`
- `access.write`

### Guests/seating

- `guests.read`
- `guests.write`
- `guest_sensitive.read`
- `guest_sensitive.write`
- `seating.read`
- `seating.write`

### Work/planning

- `tasks.read`
- `tasks.write`
- `decisions.read`
- `decisions.write`
- `decisions.finalize`
- `planning.read`
- `planning.write`
- `timeline.read`
- `timeline.write`
- `inbox.read`
- `inbox.write`
- `search.use`

### Finance

- `finance.read`
- `finance.write`
- `payments.record`
- `payments.refund`

### Documents/media

- `documents.read`
- `documents.write`
- `sensitive_documents.read`
- `contract_review.read`
- `contract_review.write`
- `media.read`
- `media.write`

### Import/export/recovery

- `imports.preview`
- `imports.apply`
- `imports.rollback`
- `exports.standard`
- `exports.sensitive`
- `backup.full_export`
- `backup.restore`

The catalog may be extended only through migration/spec review. Reusing one key for a materially different permission is forbidden.

## 5. Built-in role templates

V1 production uses two `owner` members, but the authorization engine supports the following built-in templates from the start:

- `owner`
- `editor`
- `viewer`

The role name is only a bundle identifier. Exact rights are defined by `ROLE-PERMISSION-MATRIX.md`.

Future public releases may add reviewed role templates without rewriting domain services because services already request permissions rather than roles.

Custom per-project roles are **not required in V1** and must not be invented without scope/security review.

## 6. Relationship/attribute constraints

Permission alone is insufficient for some operations.

Examples:

- a member may write **their own** `member_rating`, not their partner's;
- a member may write **their own** personal preference row;
- a member may submit **their own** decision approval, not another member's;
- a task assignee/user reference must belong to the same project;
- every linked entity must belong to the same project;
- a retained fact resolution may require domain state/evidence rules in addition to `venues.write` or `vendors.write`;
- payment/refund transitions require valid finance state, not merely `finance.write`;
- invitation acceptance requires the authenticated verified identity to match the invitation;
- project deletion requires owner authority, strong/recent auth and protected command semantics.

These checks belong in authoritative database/domain command paths and direct tests.

## 7. Data sensitivity classification

Authorization decisions additionally consider data class:

1. **Project planning** — venues, tasks, ordinary planning metadata.
2. **Personal/PII** — guest names/contact/logistics, private project origins.
3. **Sensitive personal** — dietary/accessibility notes and equivalent restricted guest details.
4. **Financial** — budgets, payments, quotes and financial assumptions.
5. **Sensitive documents** — contracts, invoices, private backups and equivalent files.
6. **Security/admin** — membership, invitations, audit/security settings.

A future read-only collaborator must not automatically receive every sensitive class simply because they can view ordinary project planning data.

## 8. Deny by default

For every exposed resource/action:

- no matching explicit permission => deny;
- unknown role => deny;
- inactive/revoked membership => deny;
- unknown project => deny without leaking whether it exists;
- project mismatch => deny;
- failed security/assurance requirement => deny;
- unavailable authorization configuration => fail closed.

## 9. Protected operations and recent authentication

High-impact operations require a narrow protected command and recent/strong authentication as defined in `PRIVILEGED-OPERATIONS.md`.

Examples include:

- member role administration;
- project deletion;
- full sensitive backup export;
- backup restore;
- security configuration;
- other operations explicitly classified critical.

## 10. Field-level protection

RLS is row-level and does not by itself protect arbitrary columns.

System/security-sensitive fields such as:

- `project_id`;
- membership role/status;
- audit actor fields;
- server revision;
- invitation hashes;
- protected payment/system states;

must be protected with appropriate column grants, immutable semantics, triggers or narrow RPC/commands. Generic client update payloads must not be allowed to mutate them simply because row access exists.

## 11. Views/functions

Every exposed view/function is part of the authorization surface.

- Views must not accidentally bypass RLS.
- `SECURITY DEFINER` functions require fixed safe `search_path`, explicit auth/project/permission checks and narrow grants.
- Functions expose only the minimal fields/results required.
- Service-role credentials are never shipped to the browser.

## 12. Storage authorization

Storage access checks project membership/permission independently from database metadata.

Examples:

- `documents.read` / `sensitive_documents.read` for downloads;
- `documents.write` for uploads/deletes;
- `media.read` / `media.write` for media.

Knowing an object path or signed URL structure is never authority. Signed access is short-lived and cannot expand project permissions.

## 13. Realtime authorization

Receiving a Realtime event is data access.

Subscriptions are project-scoped and permission-aware. A user who loses membership/permission must not continue receiving authoritative project events. Realtime is never an authorization bypass or durability source.

## 14. Offline/local authorization

Local cached data can remain visible only according to session/offline policy. It is not evidence of current cloud authorization.

After role revocation/project removal:

- cloud operations fail immediately server-side;
- reconnect/revalidation updates effective permissions;
- explicit logout/safe purge removes private local project data;
- residual bytes on a stolen offline device are covered by the documented device-security residual risk.

## 15. Audit requirements

Security-relevant events are auditable without logging secrets:

- invitation created/revoked/accepted;
- member added/removed/revoked;
- role changed;
- project archived/deletion initiated;
- full sensitive export/backup generated;
- restore started/completed/failed;
- security/MFA settings changed where app-visible;
- privileged command denial/failure where useful and privacy-safe.

Raw invitation tokens, auth tokens and sensitive document content are never logged.

## 16. Testing requirements

Authorization tests include:

- allow and deny for every permission-relevant table/RPC/Storage action;
- cross-project guessed-ID access;
- role downgrade during active session;
- membership revocation during active session;
- stale cached UI permission cannot force cloud write;
- viewer/editor forbidden privileged commands;
- self-owned vs partner-owned rating/preference/approval rows;
- field-level protected-column mutation;
- direct REST/RPC/Storage calls without UI;
- Realtime project isolation;
- signed URL expiry/isolation;
- full backup/export restrictions;
- multi-project user switching without permission/cache bleed.

A missing deny test for a sensitive permission blocks release.

## 17. Future public SaaS

Public launch may add role templates or scoped collaboration, but must keep this core model:

`identity + membership + explicit permission + relationship/attribute + assurance + server enforcement`.

Public SaaS must not replace this with frontend-only role checks or a global `is_admin` shortcut.