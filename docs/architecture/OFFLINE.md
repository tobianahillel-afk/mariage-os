# Offline Behavior and Capability Matrix

Status: **Normative V1 offline contract**

Mariage OS is cloud-backed but local-first for eligible work. Offline behavior must distinguish **readable locally**, **editable/queueable locally**, and **server-required finalization**.

A locally accepted mutation is visibly `pending`; it is not represented as remotely confirmed until server acknowledgement.

## Global rules

- Pending edits survive restart where platform persistence permits.
- Unsynchronized work is not ordinary cache and is not silently evicted.
- Offline writes use operation IDs/base revisions and may later conflict.
- Security/admin operations are never faked offline.
- A workflow that requires a fresh global invariant can collect a draft offline but finalizes only online.
- UI labels partial/cached state instead of pretending full freshness.

---

## Capability matrix

| Domain/action | Offline read if cached | Offline mutation | Server required before final truth |
|---|---|---|---|
| Venue summary/facts/spaces | Yes | Yes, queue ordinary edits/observations | Cloud confirmation for shared truth |
| Personal venue rating/favorite | Yes | Yes | Sync acknowledgement |
| Venue visit notes/measurements | Yes if pinned/cached | Yes | Sync acknowledgement |
| Venue offer/availability note | Yes | Yes for ordinary draft/edit | Contractual/locked transitions may require fresh state |
| Access route observations | Yes | Yes if manually recorded | External route calculation itself needs provider/network |
| Tasks | Yes | Yes for ordinary create/edit/status | Any conflict resolved after refresh |
| Task dependency graph | Yes | Queue simple changes | Server/domain validation confirms no conflicting graph revision |
| Decision comment/option draft | Yes | Yes | Sync acknowledgement |
| Decision approval/vote | Yes | May queue as pending approval | Final shared approval state is server-confirmed |
| Finalize/lock/reopen joint decision | Read yes | No authoritative finalization offline | **Online required** to verify approvals/revision/invariants |
| Inbox capture | Yes | Yes | Conversion target confirmation after sync |
| Inbox conversion | Cached target context yes | May queue only for simple create commands | Existing-target merge/conflict may require refresh |
| Vendor/contact/interaction | Yes | Yes | Sync acknowledgement |
| Contract readiness answers | Yes | Yes | Readiness summary becomes shared after sync |
| Guest/household/RSVP/probability | Yes | Yes | Sync acknowledgement/conflict handling |
| Seating assignment | Yes | Yes, queue moves/assignments | Server confirms concurrent capacity/assignment integrity |
| Budget planning item/scenario | Yes | Yes | Shared scenario truth after sync |
| Record payment/refund/deposit movement | Yes | Yes as **pending financial mutation** | Not shown as cloud-confirmed financial truth until server validates revision/invariants |
| Milestones/planning | Yes | Yes | Sync acknowledgement |
| Event timeline | Yes | Yes | Server validates shared dependency/revision conflicts |
| Frozen timeline export | If all source data cached and clearly labeled | Local file generation possible | “Current authoritative export” requires known synchronized source state |
| Documents/media metadata | Yes | Metadata draft/queue possible | Committed file state requires storage/database success |
| Capture new photo/file | Browser permitting | Local pending blob allowed | Upload/commit online |
| Remote image/source page | Cached thumbnail maybe | No remote fetch | Network required |
| Search | Local cached subset | N/A | Complete project-wide search requires cloud/current cache |
| Map pins from cached coords | Fallback/list yes | N/A | Tile/provider rendering/routing normally online |
| Import parse/map/preview | Yes if file/local tools available | Local working session only | **Commit online required** for DB transaction/RLS/current duplicate state |
| Import rollback | Report may be cached | No authoritative rollback offline | **Online required** |
| Full `.mariage` authoritative backup | Cached partial data can support a clearly labeled recovery export | Local archive generation only when completeness known | Full current project backup requires synchronized/complete source set |
| Restore `.mariage` | File can be inspected/validated locally | No production mutation offline | **Online required** for restore target/transaction/RLS |
| First login/new device | No | No | **Online required** |
| Create/bootstrap project | No | No | **Online required** |
| Invite/accept/revoke member | Cached status maybe | No | **Online required** |
| MFA/session recovery | No | No | **Online required** |
| Permanent purge/project deletion | Cached preview maybe | No | **Online + recent strong auth required** |

---

## Venue offline pinning

`Available offline` prepares at least:

- venue identity/location/status;
- critical facts/criteria and retained values;
- relevant sources summary;
- spaces/capacities;
- visit checklist/questions;
- selected photo thumbnails/previews;
- contact/access summary;
- relevant tasks/decision context.

Original high-resolution remote/private media is not automatically cached unless explicitly chosen and storage policy permits.

## Financial pending semantics

An offline payment/refund edit is allowed only as a durable **pending mutation**. Until cloud acknowledgement:

- UI labels it pending;
- shared/confirmed totals should distinguish confirmed cloud movements from local pending projection;
- another device may have changed the same schedule;
- reconnect may produce conflict/revalidation.

Never tell the user a payment is fully recorded/shared merely because it exists locally.

## Decision finalization semantics

Offline approval can be queued because it represents that member's intent. Finalizing a require-both decision is online-only because the application must verify current approvals, decision revision and authorization atomically.

## Import semantics

Parsing/mapping/validation/preview can operate locally. Bulk canonical commit and rollback are online because they require current canonical state, duplicate/evidence rules, transactions and RLS. An offline import preview must prominently say the project has not changed.

## Backup semantics

A complete authoritative backup must know it contains the intended complete current project graph. If cloud freshness/completeness cannot be established, the app can generate only a clearly labeled **local recovery export** containing available cached/pending data; it must not call that a verified full project backup.

## Storage pressure priority

1. pending mutations/unsynced original files;
2. project identity and required structured state;
3. active/upcoming workflows;
4. explicit offline pins;
5. thumbnails/previews;
6. disposable cached originals.

Unsynchronized work is never evicted as normal cache.

## Session expiry offline

Cached data may remain readable according to local privacy policy. Pending work remains retained. Sync waits for reauthentication. A revoked/removed member cannot regain cloud access merely because a local queue exists.

## Reconnect process

1. reauthenticate if needed;
2. validate active membership/project namespace;
3. refresh relevant remote revisions;
4. merge nonconflicting remote state;
5. send/rebase eligible queued mutations;
6. isolate semantic conflicts;
7. update local cache/sync status.

## User-visible states

Examples:

- `Online · Synced`
- `Synchronizing…`
- `Offline · 4 changes pending`
- `Cloud unavailable · cached data`
- `Payment saved locally · waiting to sync`
- `Approval saved locally · not finalized yet`
- `Import ready · connect to apply`
- `Sync conflict · local work preserved`

## Required tests

- reload/restart offline with pending mutations;
- venue visit pinned data;
- offline RSVP/task/budget/seating/timeline mutations;
- pending financial mutation is not mislabeled confirmed;
- offline approval cannot bypass joint finalization invariant;
- import commit/rollback unavailable offline;
- authoritative backup refuses to claim completeness when cache is incomplete;
- reconnect after remote concurrent edit;
- storage pressure preserves pending work;
- PWA update preserves queue;
- session expiry/re-auth;
- project/account switch isolation.
