# WP-2.10 — Fresh Pass B adversarial review after AR-001/002/003 remediation — 2026-10-01

## Review identity

- Packet: WP-2.10 — Venue local cache and pending mutations
- Review target: `b0658cd9a6e9a0ebeb957a1a3157193ab4e611ec`
- Exact-head CI: `36846712515` — **5/5 ordinary jobs SUCCESS**, including full verification from a clean checkout
- Pass-A implementation base: `eca752c145f9c59c1d0ca17d938569d8977fba92`
- Earlier failed Pass-B record: `WP-2.10-PASS-B-REVIEW-2026-09-30.md`
- FIR: #42 / FTR-028
- Review type: complete fresh independent adversarial Pass B after remediation
- Verdict: **PASS — no unresolved BLOCKING, MAJOR or MINOR finding**

## Independent contract reconstruction

This review did not inherit the prior Pass-A or remediation verdict. It re-read:

- `docs/roadmap/lot-2/WP-2.10.md`;
- `docs/architecture/SYNC.md`;
- `docs/architecture/OFFLINE.md`;
- `docs/architecture/LOCAL-DATA-SCHEMA.md`;
- `docs/domain/INVARIANTS.md`;
- `docs/ACCEPTANCE-SCENARIOS.md`;
- `docs/roadmap/LOT-ACCEPTANCE.md`;
- `docs/engineering/DEFINITION-OF-DONE.md`;
- the current LocalProjectStore/IndexedDB implementation;
- Venue local-sync coordinator/cache/replay code;
- Supabase Venue adapters and the frozen-schema receipt migrations;
- RED and remediation evidence for WP210-AR-001, AR-002 and AR-003.

The review specifically challenged crash/restart behavior, stale acknowledgements,
same-Venue overlapping mutations, refresh races, malformed/foreign local rows,
changed immutable intent, response-loss replay, scope isolation and live
server authorization.

## Exact-head verification evidence

CI `36846712515` on review target `b0658cd9...` reports:

- Core quality and security: **SUCCESS**;
- 208 unit/coverage files / **1,833 tests PASS**;
- statements / branches / functions / lines: **100% / 100% / 100% / 100%**;
- architecture dependency scan: no violations;
- secret/environment/negative controls: PASS;
- Local Supabase DB/RLS + Pages Function: **SUCCESS**, including Venue receipt pgTAP and promotion regression suite;
- Browser: **40/40 E2E PASS** across configured browser/mobile projects;
- mutation testing: **82.50%**;
- privacy-safe preview artifact: **SUCCESS**;
- Full verify from clean checkout: **SUCCESS**;
- AR-006/provider-only workflows: skipped, as required for WP-2.10.

No production/private wedding data or provider mutation was used.

## Review matrix

| Responsibility / attack | Fresh adversarial conclusion | Verdict |
| --- | --- | --- |
| Durable-before-network local edit | Pending mutation and working cache are inserted in one local transaction before any remote attempt. Local durability failure returns `durability_unavailable` and does not claim remote/shared success. | PASS |
| Server receipt / response-loss replay | Frozen-schema server-owned receipts retain operation/project/user/device/command/entity/result identity. Replays require current canonical Venue state to prove the same acknowledged result; live `venues.write` remains authoritative and expected-revision checks are not weakened. | PASS |
| Restart/session-gap replay | `operationId`, base revision, payload, device and scope survive local persistence. `pending`, `sending` and `failed_retryable` are replayable; `conflict` and `failed_permanent` are not blindly resent. Invalid persisted Venue intent fails permanent rather than being silently dropped. | PASS |
| Deterministic replay order | Local replay uses creation time only for deterministic attempt ordering with operation-ID tie-break; server revision/transaction state remains authoritative. No timestamp last-write-wins is introduced. | PASS |
| WP210-AR-001 — older ACK vs newer same-Venue intent | Settlement reads the target row and complete queue in one readwrite transaction. If another scoped unresolved mutation targets the same cached record, it deletes only the acknowledged operation and preserves the later working cache/marker. Malformed/foreign queue data fails closed. | **CLOSED / VERIFIED** |
| WP210-AR-002 — refresh TOCTOU | Cloud refresh now inspects current cache plus pending queue and conditionally writes the cloud record inside one IndexedDB transaction. A mutation becoming durable cannot race between a prior inspection and later cloud overwrite. Pending/conflict and malformed/foreign state are preserved/fail closed. | **CLOSED / VERIFIED** |
| WP210-AR-003 — stale ACK against changed immutable intent | Settlement receives the expected `PendingMutationEnvelope` and compares persisted scope, operation/target, mutation type, base revision, creation time, priority and payload before delete/cache write. Retry/status metadata remain mutable and are deliberately excluded. Changed intent rejects before destructive settlement. | **CLOSED / VERIFIED** |
| Same-operation concurrent outcomes | If one path settles first, a later retry/failure update sees the missing operation and cannot resurrect it; callers fall back to current durable state. Duplicate successful settlement also fails closed on the missing target rather than reapplying state. | PASS |
| Project/user/device isolation | Local database namespace/metadata plus parsed mutation scope reject cross-project, cross-user and cross-device rows. Queue-wide decisions parse and validate all examined rows instead of treating unknown rows as harmless. | PASS |
| Failure/conflict durability | Retryable failure and conflict status updates are persisted with cache decisions atomically where both are changed. Later same-target intent prevents an older failure/ack from overwriting the newer working cache. | PASS |
| Cloud-confirmed quick-add boundary | Quick-add creation remains online-confirmed; only a successfully returned canonical Venue is cached. A local cache write failure does not falsely convert cloud creation into failure or an offline-created canonical record. | PASS |
| Current-packet scope | No WP-2.11/2.12 production UI, generic cross-domain sync engine, provider mutation, private-file offline queue, service-worker lifecycle or real wedding data entered WP-2.10. | PASS |

## Finding disposition

| Finding | Fresh Pass-B disposition |
| --- | --- |
| WP210-AR-001 | **CLOSED / VERIFIED** — same-target later local intent survives older acknowledgement settlement atomically. |
| WP210-AR-002 | **CLOSED / VERIFIED** — refresh queue/cache decision is atomic; the reproduced TOCTOU is removed. |
| WP210-AR-003 | **CLOSED / VERIFIED** — settlement validates immutable mutation intent while allowing retry/status metadata to evolve. |

No new MINOR, MAJOR or BLOCKING finding was identified.

## Downstream boundaries rechecked

- FTR-028 remains **IN_PROGRESS** after WP-2.10 because WP-2.12 owns the mobile
  venue-visit/offline-package completion.
- WP-2.11 owns gallery/table/detail/compare/deep-link presentation and must not
  bypass the validated local-sync/application/domain boundaries.
- Reconnect UI/session orchestration and broad cross-domain PWA/sync hardening
  remain downstream responsibilities; WP-2.10 introduces no automatic
  background replay that would bypass live server authorization.
- No Cloudflare/provider campaign is needed or authorized for this packet.

## Verdict and transition

Fresh Pass B verdict: **PASS**.

```text
REVIEW_FAILED
-> ACCEPTANCE_PENDING / C-ACCEPTANCE
```

All three historical MAJOR findings are CLOSED / VERIFIED and the fresh review
found no new finding. Pass C must now independently reconcile every bounded
WP-2.10 responsibility as EXPECTED ↔ IMPLEMENTED ↔ VERIFIED and confirm gap ∅.
WP-2.11 remains blocked until the separate Pass-C acceptance record itself
passes exact-head ordinary CI including clean checkout.
