# Physical Schema V1 — Authorization Addendum

Status: **Normative addendum to `PHYSICAL-SCHEMA-V1.md`**

Purpose: make the permission architecture implementable without hard-coded feature role checks and without a future public-SaaS authorization rewrite.

## 1. `app_permissions`

Stable permission catalog managed by migrations, not ordinary client CRUD.

| Column | Type / constraints |
|---|---|
| `permission_key` | text PK, stable dotted key |
| `description` | text not null |
| `sensitivity` | `ordinary`,`personal`,`financial`,`sensitive_document`,`security_admin` |
| `created_at` | timestamptz not null default now() |

Examples: `venues.read`, `venues.write`, `finance.read`, `members.manage_roles`, `backup.full_export`.

Permission keys are security API. Renaming/removing one requires migration/spec review.

## 2. `app_roles`

Built-in role templates managed by migrations.

| Column | Type / constraints |
|---|---|
| `role_key` | text PK (`owner`,`editor`,`viewer` initially) |
| `display_name` | text not null |
| `is_assignable` | boolean not null default true |
| `created_at` | timestamptz not null default now() |

V1 does not require project-custom role authoring.

## 3. `app_role_permissions`

| Column | Type / constraints |
|---|---|
| `role_key` | text FK `app_roles(role_key)` |
| `permission_key` | text FK `app_permissions(permission_key)` |
| PK | (`role_key`,`permission_key`) |

Rows are migration-controlled/security metadata, not project-user writable content.

## 4. `project_members` adjustment

`project_members.role` / `role_key` references the built-in role catalog rather than being interpreted ad hoc by feature code.

Membership remains unique `(project_id,user_id)` and remains the canonical relationship.

Changing `role_key` is not generic client CRUD; it uses the protected membership command.

## 5. Authorization helper

Normative conceptual signature:

```sql
has_project_permission(target_project_id uuid, requested_permission text)
returns boolean
```

Behavior:

1. obtain `auth.uid()`;
2. require active membership for `target_project_id`;
3. resolve current membership role;
4. require matching active role-permission mapping;
5. return false on missing/invalid state.

Implementation may optimize query shape while preserving semantics.

The helper is `stable` where valid, uses safe search path if security-definer is required, and never trusts project role supplied by client.

## 6. Relationship/attribute authorization

`has_project_permission` does not replace domain-specific checks.

Policies/commands additionally validate:

- row `project_id` equals target/current authorized project;
- author-owned rows (`member_ratings`, personal preferences, decision approvals) use `auth.uid()` ownership;
- same-project FKs/targets;
- allowed lifecycle transition;
- strong-auth requirement for privileged command.

## 7. RLS pattern

Conceptual example:

```sql
using (
  project_id = :target_project
  and has_project_permission(project_id, 'venues.read')
)
```

For insert/update, `WITH CHECK` also prevents cross-project placement/change.

Exact migration SQL must avoid client-controllable pseudo-variables and use row values + `auth.uid()`/helper semantics safely.

## 8. Field-level protection

Sensitive columns are not made writable merely because role has table write permission.

Use column grants or protected commands for fields such as:

- membership role/status;
- `project_id` after creation;
- invitation token hash;
- audit actor fields;
- revision;
- protected payment/system transitions.

## 9. Public-readiness

Future role templates can be introduced by migrations adding role-permission rows without rewriting `VenueService`, `BudgetService`, etc., because application/domain code already asks for permissions.

Custom project-defined roles remain post-V1 and require separate product/security review.

## 10. Test fixtures

Authorization tests seed:

- owner/editor/viewer role mappings;
- at least projects A/B/C;
- multi-project user;
- outsider;
- revoked member.

Tests validate the matrix in `security/ROLE-PERMISSION-MATRIX.md` and direct RLS/RPC/Storage behavior.