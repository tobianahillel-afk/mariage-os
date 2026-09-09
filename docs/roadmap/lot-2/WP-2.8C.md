# WP-2.8C — Recoverable Venue remote-media metadata lifecycle

## Identity

- Work Packet ID: `WP-2.8C`
- Lot: `2`
- Name: Recoverable Venue remote-media metadata lifecycle
- State: `PLANNED`
- Current pass: `PLAN`
- Primary bounded context: Documents/Media remote-reference metadata trash lifecycle
- Branch/PR: `lot-2/venues-core` / PR not opened yet

## Why this packet exists

`DELETION-RETENTION.md` freezes recoverable soft deletion for media/document metadata, while the original WP-2.8 decomposition assigned remote create/list to A and private binary lifecycle to B but did not assign remote-media soft-delete/restore. Adding that lifecycle to WP-2.8A would push an already 10-point packet beyond the mandatory split threshold.

WP-2.8C therefore closes that responsibility gap without changing product scope.

## Scope

### Primary features / current-lot responsibility

- remaining recoverable-metadata slice of `FTR-024` after WP-2.8A;
- Lot-2 metadata-retention responsibility of `FTR-092` where it applies to Venue remote image references;
- `DELETION-RETENTION.md` media-metadata soft-delete/restore rule;
- `MED-007`, `MED-010`, `MED-013` insofar as remote references remain private metadata and are not turned into binary operations by deletion.

### Exact WP-2.8C responsibility

- add/use `media.deleted_at timestamptz null` under the standard audit conventions for A-created remote Venue image references;
- active remote-media reads exclude soft-deleted rows;
- soft-delete preserves media identity, URLs/provenance/caption/category and the existing same-project Venue `media_links` relationship;
- restore clears `deleted_at` and returns the same logical media/link identity;
- delete-already-deleted and restore-already-active are idempotent successful lifecycle replays rather than duplicate mutations;
- one protected lifecycle transition command may serve application-level delete and restore operations;
- live `media.write` authorization, project isolation, RLS, non-disclosing foreign-project identity handling and safe typed provider receipts;
- direct allow/deny and same-session downgrade/revocation evidence;
- ordinary list/provider behavior that cannot accidentally surface deleted media as active.

### Explicitly out of scope

- remote-media creation/replay/list foundation — WP-2.8A;
- private Storage upload, hash, derivative or orphan recovery — WP-2.8B;
- deleting or modifying any remote third-party bytes;
- deleting a separate private archived media row merely because a remote reference is deleted;
- global trash UI;
- 30-day Empty-trash/physical purge scheduler or project purge workflow;
- gallery/detail presentation — WP-2.11;
- offline/local media lifecycle — WP-2.12/Lot 10;
- import/export/backup binary lifecycle.

## Dependencies / sequencing

- WP-2.8A must be **ACCEPTED / COMPLETE** before WP-2.8C activation because C hardens and transitions A's persisted remote-media metadata.
- Default orchestration order is WP-2.8A → WP-2.8B → WP-2.8C → WP-2.9. B is not a semantic dependency of C; the ordering keeps one media packet active at a time and preserves the already published A/B sequence.
- `MEDIA-LIFECYCLE-ADDENDUM.md`, `DELETION-RETENTION.md`, `PHYSICAL-SCHEMA-V1.md` and `LOT-2-COVERAGE-MATRIX-ADDENDUM.md` are mandatory inputs.
- Only one packet may be IN_PROGRESS.

## Activation freeze

Before READY, revalidate the accepted A implementation and freeze any remaining optimistic-concurrency detail without changing these already normative semantics:

1. `deleted_at` is the remote-media soft-delete marker;
2. active reads exclude deleted rows;
3. Venue `media_links` remain retained across soft-delete/restore;
4. delete/restore do not mutate caller-owned remote-media semantic payload;
5. same-state delete/restore are idempotent;
6. remote and private archived media identities remain independent;
7. physical purge/30-day cleanup remains outside this packet;
8. one protected lifecycle transition command must perform live authorization and generic foreign-project denial.

If concrete revision/receipt requirements discovered from the accepted A adapter make the packet exceed 10 points, split before product code rather than weakening these rules.

## Sizing review

Provisional estimate:

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/meaningfully changed bounded domain | 1 | 3 | 3 |
| new persistent entity/table | 0 | 1 | 0 |
| new migration family / lifecycle hardening | 1 | 1 | 1 |
| new RPC/public endpoint/capability command | 1 | 2 | 2 |
| new/changed RLS or privileged authorization boundary | 1 | 2 | 2 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **8** |

This estimate assumes reuse of A's `media`, `media_links`, MediaService/ports/adapters and permission catalog. No new entity/table is introduced.

## Expected vertical slice

- UI/route: none.
- domain/application: remote-media lifecycle transition semantics under the existing Documents/Media context.
- infrastructure: reuse/harden A's Supabase media adapter; fail-closed lifecycle receipt parsing.
- cloud persistence: forward-only `deleted_at`/protected lifecycle transition hardening as needed; existing same-project relations and media RLS reused.
- local/offline: none.

## Verification plan

### Domain/application/provider

- active → deleted sets lifecycle state without changing remote payload/link identity;
- deleted → active restores identical media/link identity;
- repeated delete and repeated restore are idempotent;
- active list excludes deleted rows;
- malformed/substituted/wrong-project lifecycle receipts fail closed;
- no lifecycle operation fetches or mutates remote bytes.

### Database / RLS / adversarial

- `deleted_at` follows standard audit/revision mutation conventions frozen at activation;
- retained same-project `media_links` survives soft deletion and restore;
- owner/editor write according to `media.write`; viewer read only; viewer cannot lifecycle-transition;
- anon/outsider/project-B/revoked denied;
- foreign-project known UUID is non-disclosing;
- same-session permission downgrade/revocation prevents mutation;
- client cannot use lifecycle command to rewrite project ID, URLs, category, caption, link target or private-upload fields;
- ordinary active query excludes deleted rows while authorized future trash-specific reads remain possible.

### Acceptance responsibility

- Create a synthetic remote Venue image through the accepted A command, soft-delete it, prove it disappears from active results while metadata/link identity remains recoverable, restore it, and prove the same identity reappears.
- Prove deleting the remote reference does not touch any independently represented private archive object.
- Do not claim global trash UI or physical purge acceptance.

## Pass A — IMPLEMENT

Not started. Activation is prohibited until the preceding active packet is accepted, this packet is revalidated/sized, then separate READY and IN_PROGRESS exact-head gates pass.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.
