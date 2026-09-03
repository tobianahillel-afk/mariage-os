# Mariage OS — Guest Communications Traceability Matrix

Status: **NORMATIVE V1 TRACEABILITY ADDENDUM**

Purpose: ensure the new V1 scope is not an isolated document island. Every new requirement maps to Feature IDs, acceptance scenarios, owning lots and primary contracts.

## RSVP requirements

| Requirement | Feature IDs | Acceptance | Lots | Primary contracts |
|---|---|---|---|---|
| RSVP-001..005 | FTR-105,106,109 | GC-001..006, GC-053 | 6 | GUEST-RSVP-PORTAL, security, schema |
| RSVP-006..010 | FTR-107,108,110 | GC-007..012 | 6 | GUESTS, GUEST-RSVP-PORTAL |
| RSVP-011 | FTR-109 | GC-013..015 | 6 | dependency addendum |
| RSVP-012..015 | FTR-105,106,109,111 | GC-016..020 | 6 | RSVP portal, UX blueprints |

## Communication requirements

| Requirement | Feature IDs | Acceptance | Lots | Primary contracts |
|---|---|---|---|---|
| COM-001..003 | FTR-112..116 | GC-029, GC-039, GC-045 | 6/11 | COMMUNICATIONS, provider ports, security |
| COM-004..006 | FTR-112,118 | GC-021..030 | 6 | campaign UX/preflight |
| COM-007..010 | FTR-112,116,117 | GC-031..037 | 6/11 | idempotency/webhook contracts |
| COM-011 | FTR-113 | GC-041,042,057 | 11 | operations/security |
| COM-012 | FTR-114 | GC-043,044,057 | 6/11 | communications/operations |
| COM-013..014 | FTR-115 | GC-045,046,057 | 6/11 | communications/operations |
| COM-015 | FTR-120 | GC-028,052 | 11 | operations/public-readiness |
| COM-016..018 | FTR-112,117,110 | GC-021..040, GC-050 | 6 | campaign/household UX |
| COM-019 | FTR-113..115 | GC-037,038 | 6/11 | privacy/security |
| COM-020 | FTR-111 | GC-029,048,058 | 6 | RSVP portal/UX |
| COM-021..024 | FTR-112,117,118 | GC-022,027,030,032 | 6 | communications/domain |

## QIF requirements

| Requirement | Feature IDs | Acceptance | Lots | Primary contracts |
|---|---|---|---|---|
| QIF-001..003 | FTR-119 | GC-047,048 | 1/6 | AUTH-ONBOARDING, blueprints |
| QIF-004..006 | FTR-112,119 | GC-024,049,050,055 | 6 | route/UX blueprints |
| QIF-007..009 | FTR-106,112 | GC-019,020,050,056 | 6 | guest/campaign UX |
| QIF-010 | FTR-106,112,119 | GC-055,056 + checkpoint evidence | 6/7/12 | lot/checkpoint addenda |

## Operations requirements

| Requirement | Feature IDs | Acceptance | Lots | Primary contracts |
|---|---|---|---|---|
| COMMOPS-001..002 | FTR-120 | GC-028,029,052 | 11 | V1 scope, provider operations |
| COMMOPS-003 | FTR-116,120 | GC-033..039,059,060 | 11 | diagnostics/security |
| COMMOPS-004 | FTR-120 | GC-051,052 | 11/public launch | public-readiness |
| COMMOPS-005 | FTR-112..116 | contract tests | 6/11 | provider ports |

## Existing requirements impacted

The scope change also requires re-verification of existing requirements covering:

- guest privacy;
- RLS/authorization;
- multi-tenant public readiness;
- input validation/XSS;
- secret management;
- external provider/webhook trust boundaries;
- import/export/backup privacy;
- offline/PWA semantics;
- accessibility/mobile UX;
- zero-cost/free-tier behavior;
- release/update/migration compatibility.

Those existing Requirement IDs remain in their original catalogs; do not duplicate/renumber them here. FIRs for FTR-105..120 must reference both the new IDs and all applicable existing IDs.

## Feature status source

During implementation:
- FTR-001..104 status: `FEATURE-LEDGER.md`
- FTR-105..120 status: `FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`

`roadmap/IMPLEMENTATION-STATUS.md` must summarize both sets. Counts/percentages using only 104 features are obsolete after this scope change.

## Acceptance count

The global historical suite contains 80 scenarios. This addendum contributes GC-001..060. They are one combined acceptance corpus; tooling/review must not imply the V1 has only 80 total scenarios after this scope change.