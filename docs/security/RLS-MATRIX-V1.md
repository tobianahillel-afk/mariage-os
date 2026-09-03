# V1 RLS and Authorization Matrix

Status: **Normative V1 authorization contract**

V1 is optimized for two active owners. Reserved `editor`/`viewer` labels do not automatically grant rights; rights must be explicit.

## Test identities

At minimum:

- `anon`;
- `owner_a` and `owner_b` of project A;
- `outsider` authenticated but no A membership;
- `owner_other` of project B;
- `revoked_member` formerly in A.

Every project-scoped table/function/bucket gets direct allow and deny tests.

## Global rules

1. Anonymous has no private project CRUD.
2. Active owners ordinarily read/write their project except protected/append-only commands.
3. Outsider/project-B/revoked users cannot read/write project A.
4. Client cannot arbitrarily change `project_id`, audit identity, membership privilege or server revision.
5. Same-project relational integrity uses composite FKs/validated polymorphic links; RLS alone is insufficient.
6. Critical cross-row/security transitions use narrow commands/RPC with explicit authorization.
7. Ordinary hard DELETE is denied where soft-delete/privileged purge semantics apply.
8. A cached local row or known UUID never proves current cloud authorization.

---

## Identity/project/configuration

| Table | Owner read | Ordinary owner write | Protected behavior |
|---|---:|---:|---|
| `profiles` | own/member-visible metadata as required | own permitted profile fields | not project authorization |
| `projects` | yes own | ordinary settings | initial creation/purge through protected commands |
| `project_members` | yes own project | no arbitrary privilege write | last-owner/role/revoke via protected command |
| `project_invitations` | owner-safe metadata | create/revoke command | token hash hidden when not required; acceptance protected |
| `user_project_preferences` | own preference row | own | other member cannot impersonate user ID |
| `project_reference_origins` | yes | CRUD own project | private address data; one default invariant |
| `wedding_date_options` | yes | candidate metadata | selecting canonical date is atomic protected transition |

Controlled initial bootstrap also enforces deployment-level rule: unrelated users cannot self-create arbitrary production projects.

---

## Venue/vendor/access

Owners can CRUD appropriate own-project rows; all outsiders denied.

Tables/groups:

- `venues`;
- `venue_spaces`;
- `venue_offers`;
- `vendor_offers`;
- `offer_components`;
- `venue_availabilities`;
- `venue_access_routes`;
- `vendors`;
- `contacts`;
- `interactions`.

Every child relationship uses same-project integrity. Historical/contractually protected transitions follow domain commands/import protections rather than arbitrary overwrite.

---

## Facts/evidence

| Table | Owner rights | Protected behavior |
|---|---|---|
| `fact_definitions` | read/custom create/edit | system key/type/evaluation semantics cannot be silently repurposed |
| `facts` | read; retained state/value through domain rules | target/definition same-project; type validation; resolution history |
| `fact_observations` | read + append | arbitrary rewrite/delete restricted; correction via new/superseding observation policy |
| `sources` | CRUD/soft archive | optional linked document same-project |
| `observation_sources` | manage links | observation/source both same-project |

Direct API tests prove append-oriented evidence/history cannot be forged or cross-linked.

---

## Personal opinions/activity

| Table/field | Read | Write |
|---|---|---|
| `member_entity_preferences` | by owning member by default; safe partner aggregate/view only if product requires | only own user ID |
| `member_ratings` | active owners may read partner ratings where product displays them | only author's rows |
| `project_members.last_seen_activity_at` | own/project-safe as needed | member may update own cursor through narrow semantics |

A user cannot submit another member's `user_id` to create their rating/approval/preference.

---

## Guests/seating

Tables:

- `guest_categories`;
- `households`;
- `guests`;
- `seating_sections`;
- `seating_tables`;
- `seating_assignments`.

Owners have own-project CRUD subject to guest/seating invariants. All guest/contact PII is denied to anon/outsider/other project.

Seating assignments require same-project guest/table and one-active-assignment rules. Bulk moves/finalization use domain validation so partial/cross-project state cannot bypass integrity.

---

## Tasks/decisions/Inbox

| Table | Owner rights | Protected behavior |
|---|---|---|
| `tasks` | CRUD own | assigned user must be eligible same-project member |
| `task_dependencies` | link CRUD | same-project/no self/cycle |
| `task_links` | link CRUD | target same-project |
| `decisions` | CRUD while editable | finalize/lock/reopen validated as required |
| `decision_options` | CRUD while editable | same project/decision |
| `decision_approvals` | own approval row only | cannot write partner approval |
| `decision_links` | CRUD | same-project target |
| `inbox_items` | CRUD own project | creator attribution protected; conversion idempotent |

---

## Finance

| Table | Owner rights | Protected behavior |
|---|---|---|
| `budget_categories` | CRUD | stable key/archive semantics |
| `budget_scenarios` | CRUD | active-scenario selection atomic |
| `budget_items` | CRUD | contracted/import-protected truth follows finance rules |
| `budget_scenario_items` | CRUD | scenario/item same-project |
| `payments` | domain-rule create/update/read | paid/refund/deposit state validates; import cannot silently mark paid |
| `budget_links` | CRUD | target same-project |

Sensitive full backup/export requires appropriate recent strong-auth at application/command boundary.

---

## Planning/milestones/event timeline

| Table | Owner rights | Protected behavior |
|---|---|---|
| `milestones` | CRUD | system keys/completion rules protected from silent repurpose |
| `milestone_dependencies` | CRUD | same-project/no self/cycle |
| `milestone_links` | CRUD | target same-project |
| `event_timeline_items` | CRUD | venue/space/source/responsible user same-project |
| `event_timeline_dependencies` | CRUD | same-project/no self/cycle |
| `event_timeline_vendor_links` | CRUD | timeline/vendor/contact same-project |

Frozen exported timeline artifacts are generated/exported data, not writable live timeline rows.

---

## Documents/media/contract review/tags

| Table | Owner rights | Protected behavior |
|---|---|---|
| `documents` | CRUD metadata | Storage separately authorized; supersession same-project/acyclic |
| `document_review_items` | CRUD through review rules | document/fact/source/task links same-project; reviewer identity protected |
| `media` | CRUD metadata | derivative/original same-project |
| `document_links`,`media_links` | CRUD | both ends same-project |
| `tags`,`entity_tags` | CRUD | tag/target same-project |

Document version/review state cannot be forged across project or silently inherited from a superseded version.

Storage object access remains a separate authorization check.

---

## Import/history/sync

| Table | Client rights | Protected behavior |
|---|---|---|
| `import_mapping_profiles` | owning user/project read/write per sharing policy | cannot impersonate other member |
| `imports` | owner read; controlled creation/update | actor/project protected |
| `import_changes` | owner read; append via apply/rollback mechanism | arbitrary rewrite/delete denied while history needed |
| `external_identifiers` | read as needed; controlled writes | target/parent same-project and parent-aware uniqueness |
| `activity_log` | owners read safe activity | arbitrary client falsification denied where possible |
| `sync_mutation_receipts` | operation-specific result; not broad arbitrary mutation | acknowledgement generated by server path |

---

## Storage policy

Private object namespace includes project ID but path is not authorization.

Each upload/read/delete:

- validates project namespace;
- requires active membership/role;
- cannot cross project even with exact path known;
- uses opaque application object IDs rather than private filenames where practical;
- signed access remains time-limited/authorized;
- purge cannot cross project.

---

## Privileged commands/RPC

At minimum review/implement narrow commands for:

- controlled `create_initial_project`;
- invitation create/revoke/accept;
- select canonical wedding date;
- activate budget scenario;
- final owner/member administration;
- finalize/lock/reopen high-integrity joint decision;
- retained-fact resolution where cross-row update is needed;
- import transactional apply/rollback;
- backup restore into controlled target;
- permanent project purge;
- any seating bulk command whose partial success could violate assignment invariants.

Each privileged function:

1. validates `auth.uid()`/assurance as required;
2. checks membership/role explicitly;
3. validates input/same-project relationships;
4. uses safe fixed `search_path` if `SECURITY DEFINER`;
5. exposes no secret material;
6. has direct allow/deny tests;
7. is idempotent where retries are plausible.

---

## Direct test matrix

For **every project-scoped table**:

- owner A own-project SELECT allowed when role permits;
- anon denied;
- outsider denied;
- project-B owner denied;
- revoked member denied;
- permitted own insert/update allowed;
- insertion with project-B ID denied;
- changing `project_id` denied;
- protected-column update denied;
- cross-project child/reference injection denied.

Add domain-specific denial cases for append-only evidence, partner-owned ratings/approvals, financial transitions, invitation tokens, document review/versioning, seating and timeline links.

Missing required deny tests block the relevant lot and V1 release.
