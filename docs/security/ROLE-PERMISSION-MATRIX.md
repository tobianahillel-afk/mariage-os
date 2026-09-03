# Mariage OS — Built-in Role / Permission Matrix

Status: **Normative V1 + public-readiness authorization matrix**

V1 production uses two `owner` memberships, but authorization is implemented against permissions from the start so future public collaboration does not require rewriting feature logic.

Legend:
- `A` = allowed by built-in role subject to domain/relationship checks;
- `R` = read-only permission;
- `—` = denied by default;
- `STRONG` = allowed only through recent/strong-auth protected flow.

## 1. Project/security/admin

| Permission | owner | editor | viewer |
|---|:---:|:---:|:---:|
| `project.read` | A | A | A |
| `project.settings.update` | A | — | — |
| `project.archive` | STRONG | — | — |
| `project.delete` | STRONG | — | — |
| `members.read` | A | A | — |
| `members.invite` | STRONG | — | — |
| `members.manage_roles` | STRONG | — | — |
| `security.manage` | STRONG | — | — |
| `audit.read` | A | — | — |

## 2. Venues/vendors/access

| Permission | owner | editor | viewer |
|---|:---:|:---:|:---:|
| `venues.read` | A | A | R |
| `venues.write` | A | A | — |
| `vendors.read` | A | A | R |
| `vendors.write` | A | A | — |
| `access.read` | A | A | R |
| `access.write` | A | A | — |

## 3. Guests/seating

Viewer is deliberately conservative because guest data contains personal information.

| Permission | owner | editor | viewer |
|---|:---:|:---:|:---:|
| `guests.read` | A | A | — |
| `guests.write` | A | A | — |
| `guest_sensitive.read` | A | A* | — |
| `guest_sensitive.write` | A | A* | — |
| `seating.read` | A | A | — |
| `seating.write` | A | A | — |

`A*`: only where editor role is deliberately granted to a trusted project collaborator. V1 production uses owners only. A future public release may split editor templates rather than broadening viewer.

## 4. Tasks/decisions/planning

| Permission | owner | editor | viewer |
|---|:---:|:---:|:---:|
| `tasks.read` | A | A | R |
| `tasks.write` | A | A | — |
| `decisions.read` | A | A | R |
| `decisions.write` | A | A | — |
| `decisions.finalize` | A | — | — |
| `planning.read` | A | A | R |
| `planning.write` | A | A | — |
| `timeline.read` | A | A | R |
| `timeline.write` | A | A | — |
| `inbox.read` | A | A | — |
| `inbox.write` | A | A | — |
| `search.use` | A | A | A, limited to authorized readable domains |

Decision approvals remain self-owned relationship checks even for owners.

## 5. Finance

Financial data is not granted to the generic viewer template.

| Permission | owner | editor | viewer |
|---|:---:|:---:|:---:|
| `finance.read` | A | A | — |
| `finance.write` | A | A | — |
| `payments.record` | A | A | — |
| `payments.refund` | A | A | — |

A future “planner” or “finance viewer” role is a new reviewed role template, not a reason to widen generic viewer.

## 6. Documents/media/contract readiness

| Permission | owner | editor | viewer |
|---|:---:|:---:|:---:|
| `documents.read` | A | A | R, non-sensitive only |
| `documents.write` | A | A | — |
| `sensitive_documents.read` | A | A* | — |
| `contract_review.read` | A | A | — |
| `contract_review.write` | A | A | — |
| `media.read` | A | A | R |
| `media.write` | A | A | — |

Sensitive document classification overrides ordinary document read.

## 7. Import/export/backup

| Permission | owner | editor | viewer |
|---|:---:|:---:|:---:|
| `imports.preview` | A | A | — |
| `imports.apply` | A | A | — |
| `imports.rollback` | A | A | — |
| `exports.standard` | A | A | A only for domains user can read |
| `exports.sensitive` | A | — | — |
| `backup.full_export` | STRONG | — | — |
| `backup.restore` | STRONG | — | — |

## 8. Relationship rules override role grants

Even an owner cannot:

- create/update another member's personal rating as if authored by them;
- cast another member's decision approval;
- create cross-project relationships;
- alter protected system/audit fields through generic mutation;
- bypass required decision/payment/contract state transitions;
- access another project's data because a UUID/path is known.

## 9. Permission evaluation order

For an operation to succeed:

1. authenticated identity is valid;
2. membership is active for target project;
3. built-in role grants requested permission;
4. resource belongs to target project;
5. relationship/attribute rules pass;
6. domain-state invariants pass;
7. required auth assurance/recent-auth passes;
8. DB/Storage grants + RLS/RPC permit the operation.

Any failed step denies.

## 10. UI implications

The application may hide/disable actions based on effective permissions, but:

- hidden UI is convenience only;
- direct API calls must still deny;
- disabled actions should explain missing permission when useful without revealing private data;
- project navigation only shows modules the user can meaningfully access;
- Search/export only returns fields/domains permitted to the current user.

## 11. Future role evolution

Future public SaaS may add reviewed templates such as a limited wedding planner or family viewer. New roles must be expressed as permission bundles plus relationship/attribute rules.

Do not add ad-hoc role branches inside features.