# WP-2.9C — Architecture blocker record

State: `RESOLVED`

Resolved by: `ADR 0010 — Private-document promotion ingress termination boundary` / accepted 2026-09-15

Packet transition after resolution: `BLOCKED → IN_PROGRESS / A-IMPLEMENT — RED FIRST`

Date opened: 2026-09-15

Date resolved: 2026-09-15

Branch: `lot-2/venues-core`

Related packet: `WP-2.9C`

Related FIR: `#17 / FTR-089`

## Why the packet was blocked

WP-2.9C had implemented the ADR-0009 staging/promotion flow and closed the previously identified recovery/MIME/CORS defects in real runtime evidence. The remaining `WP29C-AR-001` requirement could not be satisfied inside the Supabase Edge handler because both the direct local Edge Runtime and the public local Supabase gateway waited for an intentionally open-ended framed request to reach sender EOF before application code could terminate it.

This was a genuine design/security dependency under the Work Packet state machine:

```text
ANY NON-TERMINAL STATE
→ BLOCKED
```

No test was weakened and no upstream/backend component was introduced before an explicit architecture decision.

## Evidence that caused the blocker

Implementation/refactor HEAD before the blocker:

`a8ee1db32bfa41b40d4fcd5dd841146f97676881`

CI `34975265838`:

- Core quality/security: PASS;
- Browser/mutation: PASS;
- Privacy-safe preview: PASS;
- DB/RLS: PASS, 80 files / 1382 tests;
- staging RLS/canonical bypass: PASS;
- malformed JWT denial: PASS;
- bodyless promotion/retry/recovery/ready-state denial: PASS;
- finalization reauthorization: PASS;
- poisoned canonical recovery: PASS / fail-closed;
- exact 25,000,000-byte staging and promotion: PASS;
- AR-004 CORS remediation: PASS;
- AR-002 bounded recovery remediation: PASS;
- AR-003 authoritative MIME remediation: PASS;
- AR-001: FAIL — `Public promotion endpoint waited for sender EOF on a framed body.`

Direct-runtime evidence on CI `34973827681` and public-gateway evidence on `34974264827` reproduced the same boundary limitation.

Blocked-state documentation head `52572b24bba83a2aadb22c80f2764c92875219f1` / CI `34975858942` again reproduced the same single Edge security RED while Core/browser/preview/DB remained green.

## Resolution decision

ADR 0010 is accepted.

The trusted promotion compute/HTTP boundary moves from Supabase Edge Functions to one narrow same-origin Cloudflare Pages Function:

```text
POST /api/private-document-promote
```

The Pages Function **replaces** the old Supabase `private-document-ingest` Edge Function; it is not a proxy in front of it. The old Supabase function must be removed from deployable code/configuration so there is no direct-origin bypass.

ADR 0009 remains authoritative for bounded staging, exact-byte proof, trusted canonical recovery, attestation, cleanup and independent finalization.

ADR 0001 is amended narrowly to allow this one Pages Function security boundary while continuing to reject a general custom Cloudflare backend.

## Why this resolves the design dependency

The packet now has an explicitly accepted layer that can be tested for the missing ingress property before the trusted promotion work executes. The design requires a real Workers/Pages runtime RED/GREEN proving that an intentionally open-ended framed sender is rejected without sender EOF.

The architecture decision itself resolves the **design blocker**, not the security finding. `WP29C-AR-001` remains MAJOR / OPEN until implementation and real-runtime evidence make that RED green.

## Findings already implementation-green before unblock

- `WP29C-AR-002` — bounded canonical recovery remediation implemented/runtime-green; formal closure waits for later fresh Pass B.
- `WP29C-AR-003` — authoritative stored MIME remediation implemented/runtime-green; formal closure waits for later fresh Pass B.
- `WP29C-AR-004` — explicit/minimal CORS remediation implemented/runtime-green; formal closure waits for later fresh Pass B.

## Current next action

WP-2.9C may resume as:

```text
IN_PROGRESS / A-IMPLEMENT — RED FIRST
```

Required sequence:

1. add/retarget focused RED-first evidence for the accepted Cloudflare Pages Function boundary, including open-ended sender rejection and old-Supabase-route absence;
2. keep the RED isolated before production migration;
3. implement the Pages Function and remove the Supabase promotion Edge Function;
4. port all existing trusted-promotion security scenarios without weakening them;
5. prove exact 25,000,000-byte feasibility on the intended free runtime;
6. exact-head CI/full verification;
7. complete fresh independent Pass B;
8. only clean Pass B may advance to Pass C.

If the Pages/Workers Free runtime cannot safely satisfy the exact 25 MB proof, WP-2.9C must become `BLOCKED` again rather than enabling paid infrastructure or reducing the file contract silently.
