# WP-2.8B — Private Venue image archive lifecycle

## Identity

- Work Packet ID: `WP-2.8B`
- Lot: `2`
- Name: Private Venue image archive lifecycle
- State: `PLANNED`
- Current pass: `PLAN`
- Primary bounded context: Documents/Media private image archive, immutable originals, derivatives and recovery
- Branch/PR: `lot-2/venues-core` / PR not opened yet

## Scope

### Primary features / current-lot responsibility

- remaining private-archive slice of `FTR-024` after WP-2.8A;
- Lot-2 foundation slice of `FTR-092` — original/derivative/orphan lifecycle;
- `VEN-013` — archived/private visit media distinguished from remote refs;
- `MED-004` — archived original photo bytes preserved;
- `MED-005` — thumbnail/preview are distinct derivatives;
- `MED-006` — exact duplicate binary detectable by hash;
- `MED-009` — interrupted/orphan uploads recoverable/cleanable and not presented committed;
- `MED-010` — private file access cannot rely on obscurity;
- `ACC-055`, `ACC-056`, `ACC-058` where owned by the private-media foundation.

### Exact WP-2.8B responsibility

Subject to the activation stop-condition below:

- private Venue image archive workflow over the already accepted `project-private/<project>/media/<media_uuid>/<variant>` Storage namespace;
- supported-image file intent/size/MIME/magic-byte validation boundary from `FILE-SECURITY.md`;
- immutable archived original semantics;
- explicit derivative records/parent relationship for thumbnail/preview foundation;
- SHA-256 exact-byte duplicate detection scoped to the project without cross-project information leakage;
- interrupted/storage-success-metadata-failure recovery/cleanup semantics;
- committed/ready visibility rule: incomplete private media cannot masquerade as ready media;
- metadata↔Storage authorization coordination using existing `media.read` / `media.write` Storage RLS;
- safe typed provider/storage failures and direct allow/deny tests.

### Explicitly out of scope

- remote-reference metadata foundation already owned by WP-2.8A;
- Venue gallery/detail UI, ordering/main-photo UX — WP-2.11;
- local/offline image queue and own-visit capture semantics — WP-2.12/Lot 10;
- document uploads/versioning — WP-2.9 and later document work;
- server image proxy or arbitrary image transformation service;
- generic background scheduler assumed to clean orphans;
- paid storage/automatic overage behavior;
- backup/import/export binary packaging.

## Dependencies / sequencing

- WP-2.8A must be **ACCEPTED / COMPLETE** before WP-2.8B activation.
- Lot-1 WP-1.9 private Storage authorization foundation remains authoritative and must be reused, not replaced.
- Restored `docs/security/STORAGE-RLS.md` is a required normative input.
- Only one packet may be IN_PROGRESS; WP-2.9 remains prohibited concurrently.

## Mandatory pre-READY stop-condition

The frozen V1 docs define the required behavior but do not yet define enough exact state-machine detail to implement the private binary lifecycle without guessing. Before WP-2.8B can become READY, a docs-only exact-head-green repair must freeze:

1. exact private `media.upload_status` values;
2. legal transitions and which states are visible as committed media;
3. upload/verify/metadata/link commit ordering and retry identity;
4. recovery behavior when Storage succeeds but metadata/link commit fails;
5. cleanup/retry behavior without assuming a background scheduler;
6. exact immutable-original and derivative parent/type/version rules;
7. exact project-scoped SHA-256 dedup behavior and non-disclosure;
8. exact allowed image formats/20 MB boundary and MIME/signature validation ownership;
9. any protected metadata command(s), idempotence and authorization requirements;
10. Storage adapter receipts and fail-closed semantics needed to prove `ACC-055` / `ACC-056`.

`MEDIA-LIFECYCLE-ADDENDUM.md` intentionally does not invent these private states yet. The stop-condition is therefore **OPEN** until WP-2.8A is accepted and B activation revalidates the then-current implementation/contracts.

## Sizing review

Provisional activation estimate after the state freeze:

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

The estimate assumes reuse of the already accepted Storage RLS and `media`/`media_links` foundation from WP-2.8A. Activation must recalculate after the lifecycle stop-condition closes; if the concrete command/storage boundary exceeds 10, split again before production code.

## Expected vertical slice

- UI/route: none.
- domain/application: private archive state machine, file-validation plan, immutable-original/derivative/hash/recovery semantics under `domain/documents/` / `application/documents/`.
- infrastructure: private Supabase Storage adapter + metadata adapter coordination through explicit ports.
- cloud persistence: forward-only hardening of `media` lifecycle constraints/commands as required; existing Storage RLS reused.
- local/offline: none; only explicit online archive command and recoverable failure receipts.

## Verification plan

To be finalized after stop-condition closure, but must include:

- unsupported/active content and >20 MB rejection;
- extension/MIME/magic-byte disagreement failure;
- private original path contains opaque IDs, not private filename;
- original bytes/object identity cannot be silently replaced by derivative;
- derivative references same-project original and cannot become its own ancestor/source;
- project-scoped hash duplicate handling without foreign-project disclosure;
- interrupted upload never appears committed (`ACC-055`);
- Storage success + metadata/link failure remains explicitly recoverable/cleanable;
- owner/editor permitted, viewer/anon/outsider/project-B/revoked denied according to live `media.*` rights;
- cross-project Storage path/media parent/link injection denied;
- derivative regeneration changes derivative record/object only, not original (`ACC-056`);
- clean-checkout integration exercises real local Supabase Storage/RLS rather than only fake ports.

## Pass A — IMPLEMENT

Not started. Prohibited until WP-2.8A acceptance and the B stop-condition are exact-head green, followed by READY and IN_PROGRESS governance gates.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.
