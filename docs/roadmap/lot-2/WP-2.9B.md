# WP-2.9B — Generic project tags and Venue entity-tag links

## Identity

- Work Packet ID: `WP-2.9B`
- Lot: `2`
- Name: Generic project tags and Venue entity-tag links
- State: `PLANNED`
- Current pass: `PLAN / ACTIVATION SPECIFICATION FREEZE`
- Primary bounded context: Generic Tags — project tag dictionary and same-project Venue assignments
- Branch/PR: `lot-2/venues-core` / Lot-2 integration PR not opened yet

## Split context

The former monolithic WP-2.9 combined private document binary lifecycle with generic tagging. Activation revalidation scored that unsplit surface above the orchestration threshold and found no atomicity reason to keep the two together. WP-2.9B therefore owns only the independent FTR-093 tagging slice after WP-2.9A closes the document foundation.

Default sequencing is `WP-2.9A → WP-2.9B → WP-2.10`. WP-2.9B must not start while 2.9A is active.

## Assigned current-Lot responsibility

WP-2.9B owns the Lot-2 slice of:

- `FTR-093` — Generic tags/entity links;
- frozen `tags` and `entity_tags` persistence from `PHYSICAL-SCHEMA-V1.md`;
- the `DELETION-RETENTION.md` recoverable-tag rule where applicable;
- same-project polymorphic-link validation for the currently exposed Venue target;
- packet-applicable authorization/security controls.

FTR-093 spans later domains/lots. WP-2.9B accepts only project tag definitions plus Venue assignment persistence. Vendor/document/other target-type enablement remains with the later owning domain packet and does not need to be preimplemented here.

## User job

Authorized project owners can maintain a small reusable project tag dictionary and authorized Venue editors can attach/detach those existing tags to same-project Venues. Ordinary readers can read tags attached to Venues they are authorized to read. Tags remain stable project metadata rather than free-form duplicated strings on each Venue.

## Persisted model

### `tags`

WP-2.9B adds the frozen V1 project-owned tag table:

- `id uuid` primary key and unique `(project_id,id)` candidate key;
- `project_id uuid`;
- `key text` stable machine key;
- `label text` user-facing Unicode label;
- standard audit/revision fields;
- `deleted_at timestamptz null` for recoverable deletion.

Frozen key/label validation for this packet:

- `key` is trimmed lowercase ASCII slug, `1..64` chars, matching `^[a-z0-9][a-z0-9_-]{0,63}$`;
- `label` is trimmed Unicode text, `1..80` scalar values, with unsafe control characters rejected;
- active key uniqueness is case-stable through the canonical slug: unique active `(project_id,key)`;
- key is stable identity metadata after creation; ordinary rename changes `label`, not `key`;
- restoring a deleted tag must fail explicitly rather than merge if an active conflicting key now exists.

### `entity_tags`

WP-2.9B adds the generic relation with:

- stable UUID identity;
- `project_id`;
- `tag_id` same-project composite FK;
- `target_type`;
- `target_id`;
- creation metadata;
- unique `(project_id,tag_id,target_type,target_id)`.

The Lot-2 public boundary exposes exactly:

- `target_type = 'venue'`;
- target must be an existing same-project Venue;
- no cross-project UUID may be linked even if known.

Deleting a tag does not rewrite or retarget retained `entity_tags`; ordinary active queries exclude assignments whose tag is soft-deleted. Restoring the same tag reactivates the same retained logical assignments when uniqueness still permits restore.

## Authorization model

No new `tags.*` permission key is invented in WP-2.9B. The frozen V1 permission catalog is sufficient:

### Tag dictionary

- read tag definitions: live `project.read`;
- create/change label/soft-delete/restore tag definitions: live `project.settings.update`;
- therefore built-in owners can manage the project tag dictionary; generic editor/viewer roles cannot silently change project-wide taxonomy.

### Venue assignments

- read Venue tag assignments: live `venues.read` plus project/tag same-project validity;
- link/unlink an existing active tag to a Venue: live `venues.write`;
- editor may therefore tag a Venue with an existing project tag without gaining project-settings authority;
- viewer may read but not mutate Venue tag assignments.

The implementation must evaluate permissions from live membership, not cached role assumptions. Same-session downgrade/revocation must take effect immediately.

## Mutation architecture

Tags/entity tags are ordinary structured project metadata, not binary/recovery state. WP-2.9B should prefer the smallest safe DB/RLS boundary:

- project-scoped tables with RLS enabled;
- direct grants only for columns/actions that the RLS and protected-column rules can safely enforce;
- same-project target validation in the database for the polymorphic Venue target;
- immutable project/creator identity from the client perspective;
- no generic `target_type` escape hatch beyond the packet allowlist.

A privileged RPC is **not required merely for CRUD**. If implementation evidence shows a cross-row restore/link transition cannot be enforced safely with ordinary RLS/constraints/triggers, the packet must stop and rescore before adding a public command rather than silently expanding scope.

## Lifecycle

Tag definition lifecycle:

```text
active (`deleted_at is null`)
  ↔ soft-deleted (`deleted_at is not null`)
```

- ordinary queries list active tags only;
- soft-delete is recoverable and retains identity/history/assignments;
- restore returns the same tag UUID/key/assignments if no active-key conflict exists;
- hard purge, Empty-trash UI and 30-day maintenance are downstream;
- deleting a Venue-tag assignment itself is ordinary unlink semantics, not tag soft-delete.

No silent merge occurs on create/restore conflict. Similar labels do not imply identity equality; canonical key controls active uniqueness.

## Security / integrity controls

At minimum WP-2.9B directly proves applicable forms of:

- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- `SEC-AUTH-012`, `SEC-AUTH-013`;
- applicable `SEC-AUTHZ-001..009`;
- `SEC-VAL-001..004`, `SEC-VAL-008` for tag key/label/UUID/target boundaries;
- `SEC-INJ-001`, `SEC-INJ-002`;
- `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006`.

Direct DB tests must cover owner/editor/viewer where applicable, anon, outsider, project-B, revoked/downgraded identities, project-ID substitution, cross-project tag injection and cross-project Venue target injection.

## Explicitly out of scope

- private document binary/metadata lifecycle — WP-2.9A;
- new tag-specific permission keys/role templates;
- tagging Vendor/Budget/Task/Decision/Document/Media targets — later owning packets may extend the allowlist;
- tag color/icon/group hierarchies or nested taxonomy;
- synonym/AI tag suggestion/full-text search;
- bulk import tag creation (`IMP-008`) — Import lot;
- user-facing tag manager/filter UI — later presentation packet as applicable;
- permanent purge/background scheduler;
- offline/local tagging queue — WP-2.10/Lot 10;
- real wedding/private candidate data import — Lot 12.

## Sizing / cohesion review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| Generic Tags bounded responsibility | 1 | 3 | 3 |
| new persistent tables (`tags`, `entity_tags`) | 2 | 1 | 2 |
| forward-only tag migration family | 1 | 1 | 1 |
| new/changed RLS authorization boundary | 1 | 2 | 2 |
| **Total** |  |  | **8** |

Target size is met. **Cohesion: PASS.** Tag dictionary and entity assignments share one generic project taxonomy boundary and one migration/RLS family. No binary/storage/offline/UI subsystem is included.

## Expected vertical slice

- UI/routes: none.
- domain: tag key/label/lifecycle and Venue assignment invariants.
- application: typed Tag service/port or tightly scoped existing generic-link boundary; no god service.
- infrastructure: Supabase tags/entity-tags adapter with fail-closed row parsing.
- cloud: forward-only `tags`/`entity_tags` migration, same-project target validation, RLS/grants/indexes.
- local/offline: none.

## Verification plan

- create/read/rename label/soft-delete/restore project tag;
- key validation and active uniqueness;
- restore conflict is explicit and non-merging;
- create/read/delete Venue tag assignment using the same tag identity;
- deleted tag disappears from active tag/assignment reads while retained link survives for restore;
- cross-project tag and Venue target injection rejected by DB, not just application;
- tag definition write requires live `project.settings.update`;
- assignment mutation requires live `venues.write`;
- viewer read-only behavior and editor existing-tag assignment behavior;
- anon/outsider/project-B/revoked/downgraded denial;
- direct project/audit identity mutation denial;
- provider malformed/substituted project/tag/target rows fail closed;
- accepted Venue and document/media packets remain green.

## Activation gate

WP-2.9B remains `PLANNED` after this specification freeze.

It cannot transition to READY until:

1. the split/freeze commit is exact-head **5/5 SUCCESS**;
2. WP-2.9A is **ACCEPTED / COMPLETE**;
3. the B contract is revalidated against any accepted A schema changes;
4. a separate `PLANNED → READY` governance commit passes exact-head 5/5.

No WP-2.9B product implementation is authorized before those gates.