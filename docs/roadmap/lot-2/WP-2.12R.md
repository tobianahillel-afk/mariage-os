# WP-2.12R — Replay-safe Venue fact-observation command

## Identity

- Work Packet ID: `WP-2.12R`
- Lot: 2 — Venues core
- Name: replay-safe Venue fact-observation command boundary
- State: `READY` candidate — activation exact-head CI pending
- Current pass: `PLAN` (next: `A-IMPLEMENT / RED first`)
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

## Pass A exit

- [ ] activation-governance HEAD 5/5 including clean checkout
- [ ] RED-only evidence failed for missing replay identity
- [ ] stable observation identity implemented application → adapter → RPC
- [ ] identical replay returns same row; semantic drift conflicts
- [ ] cross-project collision fails non-disclosing
- [ ] supersede replay is idempotent/fail-closed
- [ ] legacy authenticated signature unavailable
- [ ] full exact-head CI 5/5
- [ ] packet moves to `REVIEW_PENDING / B-ADVERSARIAL-REVIEW`

## Handoff

- Current state: READY candidate / activation CI pending
- Current/next pass: PLAN → A-IMPLEMENT / RED first
- Parent WP-2.12: BLOCKED with tranches 1–3 GREEN preserved
- Next permitted action: exact-head five-job activation CI including clean
  checkout; only then create RED-only evidence.
