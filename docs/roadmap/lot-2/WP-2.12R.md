# WP-2.12R — Replay-safe Venue fact-observation command

## Identity

- Work Packet ID: `WP-2.12R`
- Lot: 2 — Venues core
- Name: replay-safe Venue fact-observation command boundary
- State: `ACCEPTANCE_PENDING`
- Current pass: `C-ACCEPTANCE — PASS / gap ∅ / acceptance-record CI pending`
- Branch: `lot-2/venues-core`
- Parent packet: `WP-2.12` — BLOCKED until this support packet is ACCEPTED
- Discovery base: `8ffe905b026645affb6f218b65b601f565e80fe6`
- Discovery-base CI: `37288210671` — **5/5 SUCCESS**, including clean checkout
- Product Feature: no new Feature; bounded support for FTR-028 / FIR #42 structured reconnect safety

## Why this packet exists

WP-2.12 requires offline measurements/fact observations to replay safely after
restart and reconnect. Re-review found that the accepted Facts/Evidence append
boundary cannot satisfy that safety property:

- `public.fact_observations.id` defaults to `gen_random_uuid()`;
- the authenticated `append_venue_fact_observation` RPC accepts no client
  observation identity;
- the application/adapter input likewise carries no stable observation ID.

Therefore a successful insert whose network response is lost cannot be
distinguished from a not-yet-applied command. Retrying can create a duplicate
measurement.

The parent explicitly required re-review rather than silently adding a server
boundary. Adding one migration family (+1) and one changed RPC (+2) to the
already-9-point WP-2.12 would make it 12 points, which must split under
`AI-LOT-ORCHESTRATION.md`.

## Frozen responsibility

Make **append only** Venue fact observations retry-idempotent by stable
client-supplied observation identity.

The new command contract must:

1. accept a client-supplied `observationId` UUID;
2. preserve the existing project membership / `venues.write` authorization;
3. validate the same Fact/definition/value/evidence/confidence/timestamp/note
   rules as the accepted boundary;
4. insert with the supplied observation ID;
5. on first use, create and return the observation;
6. on replay of the same ID with the same normalized semantic intent, return
   the existing observation without creating another row;
7. on same-project reuse of the same ID with different intent, return a typed
   conflict;
8. on an ID collision owned by another project, fail without disclosing the
   foreign row;
9. preserve supersede semantics safely: exact replay of an already-applied
   supersede is idempotent; drift or inconsistent supersede state fails closed;
10. ensure the adapter validates the returned ID against the requested
    observation ID.

The doctrine follows the already-accepted replay identity behavior of
`append_venue_interaction` and remote-media creation.

## Bounded implementation surface

Expected changes only:

- one Supabase SQL migration replacing/hardening the authenticated
  `append_venue_fact_observation` signature;
- `AppendVenueFactObservationDraft/Input` adds stable `observationId`;
- application validation rejects malformed observation identity before
  persistence;
- Supabase adapter sends `target_observation_id`;
- response parsing requires the exact expected observation ID;
- direct unit/adapter/pgTAP/adversarial tests;
- required call-site/test fixture updates caused by the stronger command
  contract.

No new table, column family, RLS policy, permission key, external provider,
Storage path, UI route or offline queue implementation belongs here.

## Legacy command boundary

After GREEN:

- the new authenticated replay-safe signature is the only supported
  application append surface;
- the previous authenticated append signature without observation identity must
  not remain callable by clients;
- any internal helper retained by PostgreSQL must remain revoked from
  `public`, `anon` and `authenticated`.

## Complexity

| Complexity source | Points |
|---|---:|
| one migration/API hardening family | 1 |
| one meaningfully changed RPC command | 2 |
| new table/entity | 0 |
| RLS/permission change | 0 |
| UI/provider/offline workflow | 0 |
| **Total** | **3** |

Cohesion: **PASS**. One reusable command safety boundary, one migration family,
one independent review target.

## RED-first gate

After this activation-governance HEAD itself passes all five ordinary jobs
including clean checkout, create an isolated RED-only branch/PR proving the
current accepted boundary is missing replay identity.

Required RED evidence:

1. the new RPC signature
   `append_venue_fact_observation(uuid,uuid,uuid,jsonb,text,text,text,text,text,uuid)`
   is absent on the accepted base;
2. the current application input/adapter cannot supply/verify a client
   observation ID;
3. the existing command can create a second observation after an ambiguous
   response/retry because identity is server-generated.

The RED PR is closed unmerged after the intended failure is captured.

## Pass A GREEN evidence

At minimum:

- application service tests for valid/invalid `observationId`;
- adapter test proves `target_observation_id` is sent and substituted receipt
  IDs fail closed;
- pgTAP first insert succeeds with requested ID;
- exact same ID + normalized same intent is idempotent and row count remains 1;
- same ID + changed Fact/value/evidence/confidence/timestamp/note/supersedes
  intent is conflict;
- cross-project ID collision remains non-disclosing;
- exact replay of supersede does not create another observation or re-supersede
  inconsistently;
- old client-callable signature is unavailable;
- all existing Fact evidence/freshness/withdrawal behavior remains green;
- exact-head Core, DB/RLS, browser/mutation, preview and clean-checkout jobs pass.

## Out of scope

- WP-2.12 visit mutation queue/replay coordinator;
- visit notes/interactions;
- member ratings;
- local binary/media upload;
- new facts/product semantics;
- new source/provenance UI;
- new table, RLS, permission or provider integration;
- Lot 10 generic sync.

## Pass A implementation and remediation evidence

- Activation governance: `cc12be09d1569a739c11943e5283146d02de950f` / CI `37289339246` — **5/5 SUCCESS**, including clean checkout.
- RED #81 / `8d30a16ea8f234c8cee712eed66dc4e1fb64764b` — closed unmerged after proving the accepted append boundary lacked stable client replay identity.
- GREEN PR #82 exact reviewed head `78c1d83e45357b653486ceb53dec64a9afdfec51` / CI `37295580568` — **5/5 SUCCESS**; stable client observation ID is implemented application → adapter → RPC, exact replay is idempotent, semantic drift conflicts, cross-project collision is non-disclosing, supersede replay is guarded, and the legacy authenticated signature is removed.
- PR #82 merged as `5389bb31f2b57c1b02a011dbd6fd775a9c048570`; canonical CI `37296758669` — **5/5 SUCCESS**, clean checkout included.
- Post-merge fresh Codex review opened two findings:
  - `WP212R-AR-001` **P2 / OPEN** — NULL `target_evidence_level` or `target_confidence` can evade validation/comparison because SQL three-valued predicates evaluate to NULL.
  - `WP212R-AR-002` **P1 / OPEN** — durable packet/status/matrix handoff still described the pre-implementation READY state.
- Targeted RED #83 / `b4909ef100f1ea40d73e1490bfa19258b0820eec` / CI `37300726435` — 21 pgTAP replay assertions executed; **exactly tests 7–8 failed** for NULL evidence/confidence; Core, browser/mutation and preview stayed green; PR closed unmerged.
- Remediation is forward-only: migration `20261005111500_reject_null_venue_fact_replay_metadata.sql` explicitly rejects NULL evidence/confidence and uses NULL-safe replay comparisons; the RED assertions are retained as regression tests.
- Remediation PR #84 exact head `bb856ab835a48ddc7bcc6b6278f5f83bc815d991` / CI `37301743650` passed **5/5 SUCCESS**; fresh Codex review found no major issue and left zero unresolved threads.
- PR #84 merged as `e6c46b0e6b0879aa48ce29fd58c80f91b6900cb7`; canonical CI `37309288791` passed **5/5 SUCCESS**, including clean checkout.
- `WP212R-AR-001` and `WP212R-AR-002` are **CLOSED / VERIFIED**.

## Pass A exit

- [x] activation-governance HEAD 5/5 including clean checkout
- [x] RED-only evidence failed for missing replay identity
- [x] stable observation identity implemented application → adapter → RPC
- [x] identical replay returns same row; semantic drift conflicts
- [x] cross-project collision fails non-disclosing
- [x] supersede replay is idempotent/fail-closed
- [x] legacy authenticated signature unavailable
- [x] WP212R-AR-001/002 remediation exact-head CI 5/5
- [x] fresh remediation review closes WP212R-AR-001/002
- [x] packet moves to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`

## Fresh Pass B v2

- Canonical review target: `9e9851d29830decd1dd927496b7aaa473445ca51` / CI `37316129635` — **5/5 SUCCESS**, including clean checkout.
- Review-only PR #87 final head `bd17217f6d2ecb2ffc20ef7dd1c9017713737019` / CI `37327242771` — **PASS**.
- Review-only #88 / `55f0fc8b54554d1f108098d12fa6b718e2288115` / CI `37322464350` disproved the multiselect-order hypothesis.
- Review-only #89 / `8bb749810082332efb9de43fb9a61f101e8f39c9` / CI `37329487914` disproved the definition-constraint-drift hypothesis.
- Final fresh Codex review on exact head `bd17217f...` returned **“Didn't find any major issues”** with zero unresolved review threads.
- `WP212R-AR-001/002` remain **CLOSED / VERIFIED**; no new implementation finding remains.
- Canonical review record: `docs/roadmap/lot-2/WP-2.12R-FRESH-PASS-B-POST-AUTHZ-2026-10-05.md`.

## Pass C result — 2026-10-05

Separate acceptance reconciliation is recorded in
`docs/roadmap/lot-2/WP-2.12R-ACCEPTANCE.md`.

Verdict: **PASS; EXPECTED ↔ IMPLEMENTED ↔ VERIFIED gap ∅**. The packet remains
`ACCEPTANCE_PENDING` until the acceptance-record HEAD itself passes all five
ordinary CI jobs including full verification from a clean checkout. Parent
WP-2.12 remains BLOCKED until the support packet is sealed ACCEPTED.

## Handoff

- Current state: **ACCEPTANCE_PENDING / C-ACCEPTANCE**
- Current/next pass: Pass C complete; exact-head acceptance-record CI pending
- Fresh Pass-B/status seal: `091d5f00e5e07afcefaafd8e89d4bb477a55dd10` / CI `37333914603` — **5/5 SUCCESS**
- Pass C record: `docs/roadmap/lot-2/WP-2.12R-ACCEPTANCE.md` — **PASS / gap ∅**
- Parent WP-2.12: **BLOCKED** with tranches 1–3 GREEN preserved
- Open findings: ∅
- Closed findings: `WP212R-AR-001/002` — CLOSED / VERIFIED
- Next permitted action: exact-head CI on this acceptance record. Only after green CI + final support-packet seal may parent WP-2.12 receive a separate resumption seal.
