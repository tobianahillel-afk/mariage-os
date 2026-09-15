# WP-2.9C — Architecture blocker record

State: `BLOCKED`

Current/next pass: `ARCHITECTURE-DECISION`

Date: 2026-09-15

Branch: `lot-2/venues-core`

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

Current architecture: ADR 0009 — bounded private-document staging

Proposed architecture review: ADR 0010 — private-document promotion ingress termination boundary

## Why the packet is blocked

WP-2.9C has implemented the ADR-0009 staging/promotion flow and closed the previously identified recovery/MIME/CORS defects in real runtime evidence. The remaining `WP29C-AR-001` requirement cannot be satisfied inside the current Supabase Edge handler because both the direct local Edge Runtime and the public local Supabase gateway wait for an intentionally open-ended framed request to reach sender EOF before application code can terminate it.

This is a genuine design/security dependency under the Work Packet state machine:

```text
ANY NON-TERMINAL STATE
→ BLOCKED
```

No test is weakened and no new upstream/backend component is introduced silently.

## Implemented ADR-0009 controls

The current implementation provides:

- private `document-ingest-staging` bucket;
- exact `25,000,000` byte Storage limit;
- `application/pdf` staging MIME restriction;
- narrow authenticated staging INSERT only for exact pending project/document paths;
- no ordinary staging SELECT/UPDATE/DELETE;
- no authenticated canonical Document INSERT;
- unchanged accepted Media Storage behavior;
- browser staging with `upsert:false`;
- bodyless promotion application contract;
- valid JWT/current-user resolution;
- live `documents.write` checks before reservation use and immediately before privileged canonical mutation;
- authoritative reservation/path derivation;
- authoritative staging metadata checks before object materialization;
- actual staged-byte PDF signature, size and SHA-256 proof;
- privileged staging-to-canonical copy without overwrite;
- fail-closed canonical retry/recovery proof;
- service-only ingest attestation;
- independent finalization authorization;
- server-side staging cleanup after trusted promotion;
- explicit/minimal CORS;
- no application request-body read in the promotion handler.

## Exact-head evidence before blocker transition

Implementation/refactor HEAD before this blocker record:

`a8ee1db32bfa41b40d4fcd5dd841146f97676881`

CI `34975265838`:

- Core quality and security: **PASS**;
- Browser and mutation harnesses: **PASS**;
- Privacy-safe preview artifact: **PASS**;
- DB/RLS: **PASS**, `80` files / `1382` tests;
- Edge staging RLS/canonical bypass: **PASS**;
- malformed JWT denial: **PASS**;
- bodyless promotion, retry/recovery and ready-state denial: **PASS**;
- finalization reauthorization after authority changes: **PASS**;
- poisoned canonical recovery: **PASS / fail-closed**;
- exact `25,000,000`-byte staging and promotion: **PASS**;
- `WP29C-AR-004` CORS remediation: **PASS**;
- `WP29C-AR-002` source/live resource-bound recovery remediation: **PASS**;
- `WP29C-AR-003` source/live authoritative MIME remediation: **PASS**;
- `WP29C-AR-001`: **FAIL / MAJOR / OPEN** — `Public promotion endpoint waited for sender EOF on a framed body.`

Earlier direct-runtime proof on CI `34973827681` fails the same requirement before the public gateway test was introduced.

Public-gateway proof on CI `34974264827` also fails the same requirement.

## Platform evidence

As checked on 2026-09-15, current Supabase Edge Function documentation publishes runtime limits including a 150-second request idle timeout, but no maximum inbound request-body size that can serve as the required EOF-independent ingress boundary:

- <https://supabase.com/docs/guides/functions/limits>
- <https://supabase.com/docs/guides/functions>

The timeout does not satisfy the frozen requirement because resource/ingress work can still depend on an attacker keeping the sender open until the platform timeout.

## Blocked finding

### WP29C-AR-001 — MAJOR / OPEN / ARCHITECTURE BLOCKER

The promotion route is logically bodyless, and the handler rejects body-framing headers before any application body read. However, the current Supabase request pipeline does not dispatch the request to that handler early enough to return the rejection while the sender remains open.

Therefore the required ingress termination must exist at a layer earlier than the current user Edge handler, or the promotion trigger must be redesigned so that no browser-reachable arbitrary HTTP body exists at that boundary.

## Findings closed by the current remediation

- `WP29C-AR-002` — **CLOSED BY IMPLEMENTATION / runtime-green**, pending packet acceptance and later fresh Pass B confirmation.
- `WP29C-AR-003` — **CLOSED BY IMPLEMENTATION / runtime-green**, pending packet acceptance and later fresh Pass B confirmation.
- `WP29C-AR-004` — **CLOSED BY IMPLEMENTATION / runtime-green**, pending packet acceptance and later fresh Pass B confirmation.

These do not permit packet acceptance while AR-001 remains open.

## Next permitted action

Only architecture review of ADR 0010 is permitted.

Do not:

- weaken/delete the open-ended sender test;
- treat the 150-second provider timeout as closure;
- add a Cloudflare Worker/Pages Function or other backend silently;
- resume WP-2.9A;
- activate WP-2.9B;
- advance WP-2.9C to fresh Pass B or Pass C.

After an ingress architecture is explicitly accepted, transition WP-2.9C from `BLOCKED` back to `IN_PROGRESS`, implement that accepted boundary, require exact-head CI, then perform a complete fresh Pass B before Pass C.
