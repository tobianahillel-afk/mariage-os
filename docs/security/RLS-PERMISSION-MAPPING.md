# Mariage OS — RLS / Resource Permission Mapping

Status: **Normative authorization mapping**

Purpose: ensure every database/storage resource uses the same permission vocabulary and no policy invents ad-hoc role logic.

This document complements `RLS-MATRIX-V1.md` and `ROLE-PERMISSION-MATRIX.md`.

## Project/configuration

| Resource | Read permission | Write/command permission |
|---|---|---|
| `projects` | `project.read` | `project.settings.update`; archive/delete protected commands |
| `project_members` | `members.read` | `members.manage_roles` / protected commands |
| `project_invitations` | `members.read` | `members.invite` / protected commands |
| `project_reference_origins` | `access.read` | `access.write` |
| `wedding_date_options` | `project.read` | `project.settings.update` / canonical select protected command |
| `user_project_preferences` | own row via relationship check | own row via relationship check |

## Venues/vendors/access

| Resource | Read | Write |
|---|---|---|
| venues/spaces/offers/availability | `venues.read` | `venues.write` |
| access-route observations | `access.read` | `access.write` |
| vendors/contacts/interactions/vendor offers | `vendors.read` | `vendors.write` |

## Facts/evidence

Fact permissions follow the owning domain wherever practical:

- venue facts → `venues.read` / `venues.write`;
- vendor facts → `vendors.read` / `vendors.write`;
- project/setup facts → `project.read` / `project.settings.update`;
- guest-sensitive facts, if ever supported, additionally require guest-sensitive permission.

Generic fact APIs must resolve target entity/project/domain before authorizing; they cannot use a broad universal `facts.write` bypass.

Sources/evidence linked to a domain follow the target domain read/write permission plus same-project constraints.

## Personal member state

| Resource | Read | Write |
|---|---|---|
| personal preferences | authenticated project member as product permits | own user row only |
| member ratings | relevant project member read according to product | own author row only |
| decision approvals | `decisions.read` | own approval row + `decisions.write` relationship rule |

No role may impersonate another author's personal row through ordinary API.

## Guests/seating

| Resource | Read | Write |
|---|---|---|
| guest categories/households/guests ordinary fields | `guests.read` | `guests.write` |
| sensitive guest fields | `guest_sensitive.read` | `guest_sensitive.write` |
| seating sections/tables/assignments | `seating.read` | `seating.write` |

Sensitive fields may require a dedicated view/command/column strategy because row-level permission alone does not hide columns.

## Tasks/decisions/Inbox

| Resource | Read | Write |
|---|---|---|
| tasks/dependencies/links | `tasks.read` | `tasks.write` |
| decisions/options/links | `decisions.read` | `decisions.write` |
| finalization/lock/reopen | `decisions.read` | `decisions.finalize` + protected command |
| inbox | `inbox.read` | `inbox.write` |

## Finance

| Resource | Read | Write |
|---|---|---|
| budget categories/scenarios/items/links | `finance.read` | `finance.write` |
| payments ordinary record/update | `finance.read` | `payments.record` |
| refunds/credits where protected | `finance.read` | `payments.refund` + state validation |

Financial export may additionally require `exports.sensitive`.

## Planning/timeline

| Resource | Read | Write |
|---|---|---|
| milestones/dependencies/links | `planning.read` | `planning.write` |
| timeline items/dependencies/vendor links | `timeline.read` | `timeline.write` |

## Documents/media/contracts

| Resource | Read | Write |
|---|---|---|
| ordinary document metadata/files | `documents.read` | `documents.write` |
| sensitive document payload | `sensitive_documents.read` | `documents.write` plus sensitive classification checks |
| contract review | `contract_review.read` | `contract_review.write` |
| media | `media.read` | `media.write` |
| tags | inherited from target domain; tag definitions project-write controlled | inherited from target domain/project settings as specified |

A link table never grants access to a target the user could not otherwise read.

## Import/export/history

| Resource/action | Permission |
|---|---|
| inspect/preview import | `imports.preview` |
| apply import | `imports.apply` |
| rollback import | `imports.rollback` |
| ordinary scoped module export | `exports.standard` plus domain read permission |
| sensitive export | `exports.sensitive` plus sensitive domain permission |
| full backup export | `backup.full_export` + recent strong auth |
| restore | `backup.restore` + recent strong auth |
| activity/audit read | `audit.read` |

Import history/change rows are not generic editor-writable historical truth.

## Search

Search requires `search.use`, then filters each domain by the corresponding read permission. Search is never a way to bypass guest/finance/document sensitivity.

## Storage

Storage policies map file classification to permissions:

- venue/public-reference archived media → `media.read/write`;
- private project media → `media.read/write`;
- ordinary documents → `documents.read/write`;
- sensitive contract/invoice/backup files → `sensitive_documents.read` or `backup.full_export`/restore path as applicable.

Exact path knowledge does not satisfy permission.

## New tables/features rule

A new exposed table, view, bucket or RPC cannot be merged until it declares:

1. target project ownership model;
2. read permission;
3. write/command permission;
4. relationship/attribute constraints;
5. sensitive-field behavior;
6. direct allow/deny tests.

If none of the existing permissions fits, the feature must propose a new stable permission key through spec/migration review rather than borrowing an unrelated permission.