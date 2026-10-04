# WP-2.11 — Fresh Pass B adversarial review — 2026-10-04

Status: **FAIL — REVIEW_FAILED / REMEDIATION**

## Review identity

- Packet: `WP-2.11` — Venue Gallery / Table / Detail / Compare / deep-link workspace
- Reviewed merged head: `b249e87804ba7a6a546ea2f3db3195a0d2c4d0a1`
- Merged implementation: PR #68
- Reviewed exact-head ordinary CI: `37231659301` — SUCCESS
- Independent RED-only review PR: #70
- RED head: `416e1f33e192726d0e53c4236ccfba2efe0fde69`
- RED CI: `37232085163`
- RED result: Core unit suite **5 failed / 1,904 passed**; DB/RLS and browser/mutation jobs SUCCESS; provider-only jobs not involved.

## Findings

### WP211-AR-001 — MAJOR / OPEN — selected-date commercial applicability

Commercial summary currently considers offers that are outside the selected event date's inclusive `validFrom` / `validTo` range or restricted to another weekday. The frozen schema defines weekday 0..6 and explicitly maps 6 to Saturday.

### WP211-AR-002 — MAJOR / OPEN — project-wide Supabase reads can truncate

The WP-2.11 batch path reads all project offers, selected-date availability and access routes with one PostgREST result page. These reads need deterministic explicit pagination and fail-closed page validation.

### WP211-AR-003 — MAJOR / OPEN — missing-critical semantics

`missingCriticalCriteria` counts UNKNOWN `important` evaluations as critical even though `unknownImportantCriteria` is a separate accepted aggregate.

### WP211-AR-004 — MAJOR / OPEN — absent context invents quote action

Absent commercial decision context currently behaves like an explicit missing quote and can produce “Obtenir ou compléter le devis”. Unknown/provider-failure state must not invent commercial truth.

### WP211-AR-005 — MINOR / OPEN — Compare base-amount label

The numeric value is derived from `baseAmountMinor` but Compare labels it generic “Prix”, which overstates it as total/scenario cost.

## Required remediation

- AR-001: filter commercial offers against the selected event date using inclusive validity bounds and the frozen weekday convention; fail soft when applicability cannot be established.
- AR-002: add one shared bounded pagination helper, stable ordering/tie-breakers, multi-page tests and fail-closed malformed/error handling.
- AR-003: count only UNKNOWN blocking/critical evaluations as `missingCriticalCriteria`.
- AR-004: suggest quote completion only for explicit `none` or `draft`; absent context remains unknown.
- AR-005: relabel Compare to “Montant de base”; do not invent a total-cost engine.

## Verdict and next gate

**FAIL.** Four MAJOR findings and one MINOR finding remain open. WP-2.11 is `REVIEW_FAILED / REMEDIATION`.

No schema/RLS/provider campaign is needed or authorized. WP-2.12 remains gated.

Required sequence:

1. exact-head ordinary CI + clean checkout for this review-failure governance state;
2. bounded remediation of WP211-AR-001..005 with direct regression coverage;
3. five exact-head ordinary CI jobs including clean checkout;
4. a new complete fresh independent Pass B;
5. only a clean Pass B may enter `ACCEPTANCE_PENDING`;
6. separate Pass C before `ACCEPTED`;
7. only then may WP-2.12 activation begin.
