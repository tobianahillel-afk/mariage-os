# V1 RLS and Authorization Matrix

Status: **Normative V1 authorization contract**

This matrix turns the general RLS policy into implementable expectations. V1 production is optimized for two active `owner` members. `editor`/`viewer` are reserved roles and must not accidentally gain broader rights merely because their labels exist.

## Identities used in tests

Every table/policy suite uses at least:

- `anon` — no authenticated session;
- `owner_a` — active owner of project A;
- `owner_b` — second active owner of project A;
- `outsider` — authenticated user with no membership in project A;
- `owner_other` — active owner of project B;
- `revoked_member` — membership in A with status revoked.

For every project-scoped policy, test both allowed and denied direct API access.

## Global rules

1. Anonymous users have no project-data CRUD rights.
2. Active owners can ordinarily read/write rows in their project unless the action is protected/append-only.
3. Outsiders, other-project members and revoked members cannot read/write project A rows.
4. A client cannot change `project_id`, system audit fields, membership privilege or server revision through ordinary generic updates.
5. Same-project relational integrity is additionally enforced by DB constraints/triggers; RLS alone is not sufficient.
6. Critical transitions use narrow RPC/DB commands with explicit authorization rather than generic table updates.
7. Soft-delete behavior follows domain policy; ordinary hard DELETE can be denied where purge is privileged.

---

## Identity/project administration

| Table | owner SELECT | owner INSERT | owner UPDATE | owner DELETE | Special rule |
|---|---:|---:|---:|---:|---|
| `profiles` | own/member-visible profile metadata as required | own bootstrap/provider flow | own allowed profile fields | no ordinary hard delete | never use profile access as project authorization |
| `projects` | yes own project | only through initial bootstrap command | ordinary non-security project settings only | no direct | project destruction via MFA/recent-auth privileged command |
| `project_members` | yes own project | no generic owner insert | limited privileged membership command | no generic | last owner protected; role escalation command only |
| `project_invitations` | yes owner | via invitation command | revoke via command | no direct | token hash not selectable if client does not need it; raw token never stored |
| `user_project_preferences` | only own row | own | own | own/soft | owner B cannot read A member's personal UI preferences unless explicitly shared |
| `project_reference_origins` | yes | yes | yes | soft/delete own project | private address data never public |
| `wedding_date_options` | yes | yes | yes ordinary candidate metadata | soft | selecting date via protected atomic command |

## Venue/vendor research

| Table/group | Owners A | Outsider/other project | Protected behavior |
|---|---|---|---|
| `venues` | SELECT/INSERT/UPDATE/soft-delete | deny all | contractually critical transitions may use domain commands |
| `venue_spaces` | CRUD own project | deny all | composite FK enforces same venue project |
| `venue_offers` | CRUD own project | deny all | accepted/contract truth not silently rewritten by import |
| `vendor_offers` | CRUD own project | deny all | same |
| `offer_components` | CRUD own project | deny all | owner target validated same project |
| `venue_availabilities` | CRUD observations own project | deny all | historical observations retained |
| `venue_access_routes` | CRUD observations own project | deny all | origin/venue/source same-project |
| `vendors` | CRUD own project | deny all | same-project links only |
| `contacts` | CRUD own project | deny all | parent same-project |
| `interactions` | CRUD/append own project | deny all | authorship/audit protected |

## Facts/evidence

| Table | Owner rights | Special rule |
|---|---|---|
| `fact_definitions` | read + create custom + edit permitted custom metadata | system-defined key/type cannot be silently repurposed/deleted |
| `facts` | read + domain-command update of retained state/value | target and definition same-project; resolution audit protected |
| `fact_observations` | read + append | historical observation mutation/delete restricted; correction uses supersession rather than silent rewrite |
| `sources` | CRUD/soft-delete | source project-scoped |
| `observation_sources` | add/remove links where allowed | both ends same-project |

Direct UPDATE/DELETE tests must prove append-oriented evidence cannot be rewritten into false history through the REST API.

## Guests/seating

| Table | Owner rights | Special rule |
|---|---|---|
| `guest_categories` | CRUD own project | stable keys/soft archive |
| `households` | CRUD own project | PII private |
| `guests` | CRUD own project | PII private; same-project household/parent |
| `seating_sections` | CRUD | operational labels only |
| `seating_tables` | CRUD | same project |
| `seating_assignments` | CRUD via domain validation | one active assignment per guest; same-project guest/table; finalization checks capacity |

No guest/contact information is accessible anonymously, through public preview environments or another project.

## Personal opinions

| Table | Read | Write |
|---|---|---|
| `member_entity_preferences` | by the owning member by default; shared aggregate/read can be exposed through a safe view if product requires showing each partner's preference | only `user_id = auth.uid()` |
| `member_ratings` | shared partner ratings may be read by active project owners if product explicitly displays them | only rating author's rows |

A user cannot impersonate the partner by supplying their `user_id`.

## Work management

| Table | Owner rights | Special rule |
|---|---|---|
| `tasks` | CRUD own project | owner_user_id must be same-project member |
| `task_dependencies` | CRUD links | same-project tasks; no self/cycles domain validation |
| `task_links` | CRUD links | same-project target |
| `decisions` | CRUD until protected states | final/locked transition through validated domain command where required |
| `decision_options` | CRUD while decision editable | same decision/project |
| `decision_approvals` | active owner may upsert **their own** approval row only | cannot set another owner's approval |
| `decision_links` | CRUD | same-project target |
| `inbox_items` | CRUD own project | creator attribution immutable; conversion command idempotent |

## Finance

| Table | Owner rights | Protected behavior |
|---|---|---|
| `budget_categories` | CRUD own project | stable key/archive semantics |
| `budget_scenarios` | CRUD drafts/archive | activating scenario is atomic protected transition |
| `budget_items` | CRUD | contracted/import-protected financial truth follows domain rules |
| `budget_scenario_items` | CRUD | scenario+item same project |
| `payments` | create/read/update through finance domain rules | paid/refund state transitions validated; imports cannot silently mark paid |
| `budget_links` | CRUD | target same-project |

All finance tables are denied to anonymous/outsider. Sensitive full-project backup/export also requires recent strong authentication at application/command layer.

## Planning

| Table | Owner rights | Special rule |
|---|---|---|
| `milestones` | CRUD | system seed keys not silently repurposed |
| `milestone_dependencies` | CRUD | same-project/no self/cycle validation |
| `milestone_links` | CRUD | same-project target |

## Files/media/tags

| Table | Owner rights | Special rule |
|---|---|---|
| `documents` | CRUD metadata own project | Storage object access separately authorized |
| `media` | CRUD metadata own project | derivatives same project |
| `document_links`,`media_links` | CRUD | both ends same project |
| `tags`,`entity_tags` | CRUD | tag/target same project |

## Import/history/sync

| Table | Client rights | Special rule |
|---|---|---|
| `import_mapping_profiles` | owning user read/write own profile | other owner need not read private mapping profile unless deliberately shared |
| `imports` | owner read; creation/update through Import service/allowed fields | actor/project immutable |
| `import_changes` | owner read; application/DB command append | arbitrary client rewrite/delete denied while rollback history required |
| `external_identifiers` | read as needed; writes through import service/command | target+parent validated; uniqueness parent-aware |
| `activity_log` | owners read safe project activity; writes through controlled path | arbitrary client falsification denied where possible |
| `sync_mutation_receipts` | client normally need not list arbitrary receipts; operation-specific command may return receipt result | insert/update controlled by server command; cannot forge acknowledgement |

## Storage policy

Private bucket path begins with project identifier, but path text alone is never authorization.

For every object operation:

- parse/validate project namespace;
- require active project membership;
- write roles as applicable;
- signed/download access remains project-authorized;
- outsider cannot fetch object even if exact storage path is known;
- deletion/purge paths cannot cross project.

## Privileged commands/RPCs

At minimum:

- `create_initial_project`;
- create/revoke/accept invitation;
- select wedding date;
- activate budget scenario;
- final owner/member administration;
- lock/finalize high-integrity decision where cross-row validation is needed;
- project permanent purge;
- import transactional apply/rollback where direct client multi-row writes would weaken invariants.

Every privileged function:

1. authenticates `auth.uid()`;
2. checks project membership/role explicitly;
3. validates input and same-project relations;
4. uses a fixed safe `search_path` if `SECURITY DEFINER`;
5. exposes no secret/service-role material;
6. has direct allow/deny tests.

## Required direct test matrix

For **every project-scoped table** at minimum:

- owner A own project SELECT allowed;
- outsider SELECT denied;
- project-B owner SELECT denied;
- revoked member SELECT denied;
- owner A permitted insert/update allowed;
- insertion with project-B ID denied;
- changing `project_id` denied;
- disallowed protected-column update denied;
- anonymous denied.

For table-specific protected operations, add the cases described above. Missing deny tests block Lot 1/V1 release.