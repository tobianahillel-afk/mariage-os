# Mariage OS — Tenancy and Account Model

Status: **Normative V1 domain/security contract**

Mariage OS private V1 runs for one real couple, but the domain model is multi-tenant from the first migration.

This file defines tenant identity, memberships and the rules that prevent single-couple shortcuts.

---

## 1. Tenant definition

The primary data tenant is a **wedding project** (`projects.id`).

An Auth user is an identity, not a tenant.

A user may be a member of zero, one or multiple projects.

A project may have one or more members subject to product policy.

Private V1 product policy expects two active owners, but persistence and authorization do not encode “there can only ever be two people in the database”.

---

## 2. Relationship model

```text
auth.users
    |
    +---- profiles
    |
    +---- project_members ---- projects
                                |
                                +---- venues
                                +---- vendors
                                +---- guests/households
                                +---- budget
                                +---- tasks/decisions
                                +---- documents/media
                                +---- all other wedding state
```

Membership is the join between human identity and tenant.

No project-owned row derives ownership from `created_by`; project authorization comes from project membership + RLS.

---

## 3. Stable identifiers

- `user_id`: Supabase Auth user UUID.
- `project_id`: opaque project UUID.
- entity `id`: opaque UUID unique globally.
- human codes such as `S32`: scoped to project/domain and never security identifiers.
- external import IDs: scoped according to canonical identifier rules and project context.

Project IDs are not secrets. Knowledge of a UUID grants no access.

---

## 4. Membership roles

V1 domain supports:

- `owner`;
- `editor`;
- `viewer`.

Private couple policy normally uses two `owner` memberships.

Future public operation may expose editor/viewer roles selectively without schema redesign.

Role is project-specific. A user can be owner of project A and viewer of project B.

System/support privileges, if ever introduced, are **not** represented by granting ordinary owner membership to every project.

---

## 5. Multiple-project behavior

Even before public activation, implementation and tests must support the following synthetic state:

```text
User Alice
  owner -> Project A
  owner -> Project B

User Bob
  owner -> Project A

User Carol
  owner -> Project C
```

Expected behavior:

- Alice can switch A/B;
- Bob cannot read B merely because Alice is also in B;
- Carol cannot read A/B;
- cache/search/realtime remain project-scoped;
- deep links carry project context;
- personal preferences may differ by project;
- logout/account switch cannot expose another account/project cache.

Private UI may skip the chooser because the real user has one project; this does not remove multi-project support beneath it.

---

## 6. Tenant isolation layers

Isolation is defense in depth:

1. route/application `ProjectContext`;
2. repository/service project scoping;
3. relational same-project foreign keys/triggers;
4. PostgreSQL RLS membership checks;
5. Storage RLS/path ownership;
6. Realtime subscription filtering/authorization;
7. IndexedDB account+project partitioning;
8. import/export target-project validation;
9. backup/restore explicit project identity;
10. tests attacking every layer.

No one layer is allowed to substitute for RLS/same-project integrity.

---

## 7. Cross-project references

A project-owned entity may not normally reference a parent/entity from another project.

Ordinary relationships use composite same-project referential integrity where specified.

Polymorphic/indirect relationships use explicit database validation.

Cross-project copy is a deliberate **copy/import operation**, never a relational link into another tenant's private data.

---

## 8. Personal vs project data

### Identity-level

Examples:
- display name;
- account-level accessibility/theme preference where chosen;
- auth/security identity.

### Project-member-level

Examples:
- partner-specific venue rating;
- favorites;
- activity cursor;
- project-specific UI preferences;
- task ownership/decision approval.

### Project-shared

Examples:
- venue facts;
- budget;
- guest list;
- documents;
- tasks/decisions shared state.

Do not place project-specific personal state into a global profile merely because it belongs to one person.

---

## 9. Project creation vs membership invitation

These are different capabilities.

### Project creation
Creates a new tenant and initial owner relationship.

### Invitation
Grants/join membership to an existing tenant.

Private mode disables ordinary project creation after controlled bootstrap, but invitations for the intended project remain governed by policy.

Public mode may enable protected self-service project creation while keeping the exact same membership model.

---

## 10. Project lifecycle

Conceptual project states:

- planning;
- archived;
- deleting.

Future public account suspension/billing state must not be overloaded into wedding lifecycle. Entitlement/account restrictions belong to a separate policy layer.

A suspended account/project, if later needed, should block mutations through authorization/entitlement policy without rewriting wedding history as `deleted`.

---

## 11. Deletion/export

Project deletion applies only to the selected tenant.

Before destructive deletion:

- project identity is explicit;
- user has required privilege;
- portable export is offered/recommended;
- child rows/files are deleted according to retention policy;
- no other project belonging to the same user is affected.

Account deletion is separate:

- membership/ownership consequences must be resolved per project;
- last-owner invariant remains enforced;
- deleting one account never silently deletes unrelated projects owned with other members.

---

## 12. Public-ready invariants

1. Every wedding-domain table is either project-owned or explicitly documented as identity/global/reference data.
2. Project-owned queries never depend on “there is only one project”.
3. Authorization is based on membership for the requested project.
4. A user may belong to multiple projects.
5. Human project/entity labels are not authorization identifiers.
6. Project IDs may appear in URLs without weakening security.
7. Local state is partitioned by account/project.
8. Import/restore requires an explicit target project or creates a new tenant through a privileged/provisioning workflow.
9. Support/admin access is not ordinary project ownership.
10. Public self-service activation changes provisioning policy, not tenant semantics.
