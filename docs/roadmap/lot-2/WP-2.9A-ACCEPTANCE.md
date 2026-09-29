# WP-2.9A — Pass C acceptance reconciliation

Status: **ACCEPTED / COMPLETE — Pass C gap ∅; exact-head acceptance record CI green**.

This is the separate `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation for
the bounded Lot-2 Venue-linked private PDF/document foundation. Entry state
was `ACCEPTANCE_PENDING` after the
[complete fresh Pass B](WP-2.9A-FRESH-PASS-B-2026-09-29.md) closed
`WP29A-AR-001..005` without unresolved BLOCKING, MAJOR or MINOR findings.
This record does not accept the entire FTR-089 feature, WP-2.9B or Lot 2.

## Entry gates and durable evidence

- Accepted trusted-ingest remediation WP-2.9C: acceptance-record
  `21accd7f9ab1b845275507b7941a782c5e816a56` /
  CI `36494697647` — **5/5 SUCCESS**, clean checkout included.
- A resumption `c8f3dfd441e7ad583613c8b94bd9197b19b829fb` /
  CI `36495622949` — **5/5 SUCCESS**, clean checkout included.
- A reintegration and normative Storage-RLS correction
  `19d26c825bba19f5a826a6b820b6d4b027e44399` /
  CI `36496447413` — **5/5 SUCCESS**, clean checkout included.
- A review entry `30922eb6f348369022edb2a8d1d4cb948757fe29` /
  CI `36497398006` — **5/5 SUCCESS**, clean checkout included.
- A fresh full Pass-B/status seal
  `2ed8191bf310fdc4ef395e1f294d54c543c02705` /
  CI `36498263015` — **5/5 SUCCESS**, clean checkout included; isolated
  provider jobs correctly skipped.
- This separate Pass-C acceptance record
  `656398bcd5520cfa56d782023d150eb64317161d` /
  CI `36542083037` — **5/5 SUCCESS**, clean checkout included; isolated
  provider jobs correctly skipped.
- FIR [#17](https://github.com/tobianahillel-afk/mariage-os/issues/17)
  records current FTR-089 identity, behavior, requirement/acceptance mapping,
  architecture, security, provider result, A/C review evidence and downstream
  feature work. Feature Ledger keeps FTR-089 `IN_PROGRESS`.

## Expected, implemented and verified

| Assigned A responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
| --- | --- | --- | --- | --- |
| Private Document identity and PDF validation | Lot-2 `FTR-089`, MED-001/002/003; private PDF metadata with exact file/type/size/name/hash rules, no active execution | Document-domain scalar/PDF validator; `documents` schema with private classification, canonical path, metadata and SHA-256 | Domain/service boundary tests, PostgreSQL constraints and C1/Unicode parity tests in exact-head CI | PASS |
| Actual-byte upload and committed truth | Pending reservation must not become ready from browser claims, mismatched bytes or partial upload; ACC-055 | Typed reserve → trusted staging/ingest → independently authorized finalize; C's accepted ingress checks stored bytes and service-only attestation; database ready trigger | Service/adapter/SQL denials for direct canonical INSERT, forged attestation, poisoned or substituted bytes; local promotion and isolated ten-distinct-PDF provider proof | PASS |
| Live private authorization | MED-010, ACC-058; current `documents.read/write`, opaque path, project isolation and non-disclosing foreign IDs | Protected RPC, live membership permission checks, RLS/grants, private bucket SELECT and service parser/download guards | Owner/editor/viewer/anon/outsider/project-B/revoked and direct API/Storage allow+deny suites, path and parser tests | PASS |
| Venue links and Source provenance | PRD-008 current-Lot slice, MED-008; one logical Document may link several same-project Venues without byte duplication | `document_links` Venue-only relation, composite project FKs, optional same-project `source_id`; typed link/unlink/read ports and adapters | SQL same-project/cross-project/link-replay cases, read/list/download adapter tests | PASS |
| Recovery, retention and immutability | Interrupted pending upload recoverable or cleanly abandoned; ready soft-delete/restore retains identity; immutable ready bytes | Trusted staging/canonical cleanup and absence proof with DB delete guard; serialized promotion/abandon; optimistic revision and replay receipts; no ordinary Storage UPDATE | Cleanup/race/restore/visibility SQL and runtime tests, accepted C control proof, full clean-checkout CI | PASS |
| Preserve Media and bounded scope | No regression to accepted private Media; no silent versions/readiness/Tags/UI/offline expansion | Three current `project-private` policies preserve Media; no direct Document INSERT or ready UPDATE; A adds no UI or generic Tags | Media regression gates, Storage policy pgTAP, source-delta review and matrix assignment of downstream responsibilities | PASS |

## Security, architecture, scope and handoff

- Historical A `AR-001..005` are **CLOSED / VERIFIED** in the complete fresh
  Pass B. Open A BLOCKING = **∅**; MAJOR = **∅**; MINOR = **∅**.
- Exact project/permission and path checks occur at database/Storage/trusted
  ingress boundaries, not only in UI. The admin secret stays on the private
  host. No production wedding data, PDF bytes or credential are stored in
  repository evidence.
- Static architecture, typecheck, security, coverage/unit, browser/mutation,
  local Supabase DB/RLS/promotion, privacy-safe build and full clean-checkout
  gates all passed on the Pass-B/status seal. A reintegration changed no
  production code or migration; it corrected obsolete Storage-RLS prose.
- The WP-2.9A user interface is explicitly assigned to WP-2.11. That later
  presentation work includes an exact-duplicate signal using the already
  project-scoped SHA-256 foundation, without cross-project disclosure or
  automatic merge. Document versions, contract readiness, non-Venue links,
  offline file queue, generic Tags and real data import remain with their
  assigned later packets/lots. FTR-089 therefore stays `IN_PROGRESS` even
  when this bounded Lot-2 packet becomes accepted.
- WP-2.9B remains `PLANNED / AFTER A`. After A acceptance, revalidate B's
  frozen tag/schema contract, then use a separate `PLANNED -> READY` commit
  and exact-head CI before its Pass A implementation.

```text
required WP-2.9A responsibilities
- implemented WP-2.9A and accepted-C control responsibilities
- verified WP-2.9A responsibilities
= ∅
```

**Pass C verdict: PASS; WP-2.9A `ACCEPTED / COMPLETE`.** The acceptance-record
HEAD `656398bcd5520cfa56d782023d150eb64317161d` passed all five
ordinary CI jobs, including full verification from a clean checkout. B may
now undergo separate activation revalidation and `PLANNED -> READY`
governance/CI before any B product code. No provider campaign rerun is needed
or authorized.
