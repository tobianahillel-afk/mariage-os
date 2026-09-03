# Mariage OS — Requirement / Feature Matrix

Status: **Normative V1 traceability reconciliation**

Purpose: map every frozen requirement family to one or more V1 Feature IDs or an explicit cross-cutting engineering control. This prevents P0/P1 requirements from remaining “paper requirements” without an implementation owner.

Feature definitions live in `FEATURE-LEDGER.md`. Requirement text remains authoritative in `REQUIREMENTS-CATALOG.md`.

`X-CUT` means the requirement is a cross-cutting control enforced across multiple features/lots rather than one user-visible feature. Cross-cutting requirements still require implementation/test evidence.

---

## PRD — Product/collaboration

| Requirement | Feature owner(s) / control |
|---|---|
| PRD-001 | FTR-003,004,009 + X-CUT responsive/project collaboration |
| PRD-002 | X-CUT public-repo privacy; FTR-099/100..104 cutover hygiene |
| PRD-003 | FTR-071,072,073,074 |
| PRD-004 | FTR-023,032,012 |
| PRD-005 | FTR-032,033 |
| PRD-006 | FTR-074 |
| PRD-007 | FTR-014,064 |
| PRD-008 | FTR-017,029,032,089,093 + cross-entity links |
| PRD-009 | FTR-044,094..097,104 |
| PRD-010 | FTR-098 + X-CUT free-tier policy |
| PRD-011 | FTR-034,035 |
| PRD-012 | FTR-078 |
| PRD-013 | FTR-075,076,077 |
| PRD-014 | FTR-060,061,062,063 |

---

## IAM — Identity/project isolation

| Requirement | Feature owner(s) / control |
|---|---|
| IAM-001 | FTR-003 + X-CUT route/backend authorization |
| IAM-002 | FTR-002..012 + X-CUT RLS for all project tables |
| IAM-003 | FTR-024,089,092 + X-CUT Storage RLS |
| IAM-004 | X-CUT RLS/same-project tests across all project Feature IDs |
| IAM-005 | FTR-001 + X-CUT build/secret policy |
| IAM-006 | FTR-004/005 + protected membership commands |
| IAM-007 | FTR-004 |
| IAM-008 | FTR-005 |
| IAM-009 | FTR-005,011,050,097 + protected actions |
| IAM-010 | FTR-001,099 + preview environment isolation |
| IAM-011 | FTR-002 + bootstrap lock |
| IAM-012 | FTR-004 |
| IAM-013 | FTR-011,083,088 |

---

## SYN — Local-first/synchronization

| Requirement | Feature owner(s) / control |
|---|---|
| SYN-001 | FTR-010,083 + all queueable user-edit features |
| SYN-002 | FTR-010,084 |
| SYN-003 | FTR-083,084,085,088 |
| SYN-004 | FTR-083 + server mutation receipts |
| SYN-005 | FTR-084 |
| SYN-006 | FTR-083,084 + merge-class logic |
| SYN-007 | FTR-083,086,092 |
| SYN-008 | FTR-088,011 |
| SYN-009 | FTR-086,087 |
| SYN-010 | FTR-083,085 |
| SYN-011 | FTR-085,088 + project/account cache isolation |

---

## PWA — Offline/PWA lifecycle

| Requirement | Feature owner(s) / control |
|---|---|
| PWA-001 | FTR-087 |
| PWA-002 | FTR-085,087 |
| PWA-003 | FTR-028,086 |
| PWA-004 | FTR-028,083,086 |
| PWA-005 | FTR-082,086 |
| PWA-006 | FTR-087 + feature-specific fallbacks |
| PWA-007 | FTR-085,087 |

---

## VEN — Venue management

| Requirement | Feature owner(s) |
|---|---|
| VEN-001 | FTR-013 |
| VEN-002 | FTR-013,015,016 |
| VEN-003 | FTR-018 |
| VEN-004 | FTR-018,021 |
| VEN-005 | FTR-019,021,022,027,080,081 |
| VEN-006 | FTR-014 |
| VEN-007 | FTR-022 |
| VEN-008 | FTR-025,049 |
| VEN-009 | FTR-025,007 |
| VEN-010 | FTR-027 |
| VEN-011 | FTR-021,027 |
| VEN-012 | FTR-013 |
| VEN-013 | FTR-024,028,092 |
| VEN-014 | FTR-017,009 |
| VEN-015 | FTR-012,016 |
| VEN-016 | FTR-008,080,081 |
| VEN-017 | FTR-023 |
| VEN-018 | FTR-007,025,049 |

---

## FAC — Facts/provenance/criteria

| Requirement | Feature owner(s) |
|---|---|
| FAC-001 | FTR-019,020 |
| FAC-002 | FTR-020 |
| FAC-003 | FTR-020 |
| FAC-004 | FTR-020,040 |
| FAC-005 | FTR-020,022 |
| FAC-006 | FTR-020,022,084 |
| FAC-007 | FTR-020,089..091 |
| FAC-008 | FTR-022,020 |
| FAC-009 | FTR-020,042 |
| FAC-010 | FTR-022,029 |
| FAC-011 | FTR-019,021 |
| FAC-012 | FTR-019,020,037 |
| FAC-013 | FTR-021,027 |

---

## VND — Vendors/caterers

| Requirement | Feature owner(s) |
|---|---|
| VND-001 | FTR-064 |
| VND-002 | FTR-064,065,066,089 |
| VND-003 | FTR-065,030 |
| VND-004 | FTR-066,067,046 |
| VND-005 | FTR-068 |
| VND-006 | FTR-065,030 |
| VND-007 | FTR-066,067 |
| VND-008 | FTR-064/023-style member opinion support where enabled |

---

## GST — Guests/households/seating

| Requirement | Feature owner(s) |
|---|---|
| GST-001 | FTR-054 |
| GST-002 | FTR-054,056 |
| GST-003 | FTR-055,056 |
| GST-004 | FTR-056,057 |
| GST-005 | FTR-057 |
| GST-006 | FTR-056 |
| GST-007 | FTR-054,055 |
| GST-008 | FTR-059 |
| GST-009 | FTR-054..059 + X-CUT privacy/log/export controls |
| GST-010 | FTR-058,037..044,101 |
| GST-011 | FTR-039,058 |
| GST-012 | FTR-060,061,062,063 |
| GST-013 | FTR-061 + X-CUT same-project DB/RLS rules |

---

## TSK — Tasks

| Requirement | Feature owner(s) |
|---|---|
| TSK-001 | FTR-029 |
| TSK-002 | FTR-030,031 |
| TSK-003 | FTR-031 |
| TSK-004 | FTR-071,029..031 |
| TSK-005 | FTR-029 + retention/history controls |

## DEC — Decisions

| Requirement | Feature owner(s) |
|---|---|
| DEC-001 | FTR-032 |
| DEC-002 | FTR-032 |
| DEC-003 | FTR-032,033 |
| DEC-004 | FTR-032,033 |
| DEC-005 | FTR-033 |

---

## FIN — Budget/payments

| Requirement | Feature owner(s) |
|---|---|
| FIN-001 | FTR-045,046,051,052,053 |
| FIN-002 | FTR-047,051,052 |
| FIN-003 | FTR-046 |
| FIN-004 | FTR-052,053 |
| FIN-005 | FTR-049,046,025 |
| FIN-006 | FTR-051,053 |
| FIN-007 | FTR-051,052,053 |
| FIN-008 | FTR-051,052 + DB/domain invariants |
| FIN-009 | FTR-049,053 |
| FIN-010 | FTR-053 |
| FIN-011 | FTR-049,050 |
| FIN-012 | FTR-048 |
| FIN-013 | FTR-051,052 |

---

## PLN — Planning/timeline

| Requirement | Feature owner(s) |
|---|---|
| PLN-001 | FTR-069,073 |
| PLN-002 | FTR-069,070 |
| PLN-003 | FTR-069,007 |
| PLN-004 | FTR-075,076 |
| PLN-005 | FTR-075,076 |
| PLN-006 | FTR-077 |

---

## MED — Documents/media/contracts

| Requirement | Feature owner(s) |
|---|---|
| MED-001 | FTR-089,092 |
| MED-002 | FTR-036,037,089 + X-CUT file security |
| MED-003 | FTR-089,092 + file security control |
| MED-004 | FTR-024,092 |
| MED-005 | FTR-024,092 |
| MED-006 | FTR-092 |
| MED-007 | FTR-024,092 |
| MED-008 | FTR-024,089,092 |
| MED-009 | FTR-092 |
| MED-010 | FTR-089,092 + Storage RLS |
| MED-011 | FTR-090 |
| MED-012 | FTR-091 |
| MED-013 | FTR-024,092,082 + privacy controls |

---

## CAP — Inbox/search

| Requirement | Feature owner(s) |
|---|---|
| CAP-001 | FTR-034 |
| CAP-002 | FTR-035 |
| CAP-003 | FTR-078,086 |
| CAP-004 | FTR-078 + X-CUT privacy/URL rules |

---

## IMP — Import/export

| Requirement | Feature owner(s) |
|---|---|
| IMP-001 | FTR-041 |
| IMP-002 | FTR-040,041,042 |
| IMP-003 | FTR-039,040,042 |
| IMP-004 | FTR-036,037 |
| IMP-005 | FTR-037,044 |
| IMP-006 | FTR-039 |
| IMP-007 | FTR-038 |
| IMP-008 | FTR-038,042,093 |
| IMP-009 | FTR-039,041 |
| IMP-010 | FTR-040,041 |
| IMP-011 | FTR-042 |
| IMP-012 | FTR-042,043 |
| IMP-013 | FTR-036,037 |
| IMP-014 | FTR-036,037 + file-security control |
| IMP-015 | FTR-044 |
| IMP-016 | FTR-044 |
| IMP-017 | FTR-044 |
| IMP-018 | FTR-036..041 |
| IMP-019 | FTR-039 |
| IMP-020 | FTR-038 |

---

## BAK — Backup/migration/recovery

| Requirement | Feature owner(s) |
|---|---|
| BAK-001 | FTR-094,097 |
| BAK-002 | FTR-094 |
| BAK-003 | FTR-094,095,096 |
| BAK-004 | FTR-094,096,097 |
| BAK-005 | FTR-097,100..104 |
| BAK-006 | FTR-096,097 |
| BAK-007 | FTR-098 + backup settings surface |
| BAK-008 | FTR-043,097 + migration/recovery controls |
| BAK-009 | FTR-097 |
| BAK-010 | FTR-044,094..097 + adapter architecture |
| BAK-011 | FTR-095 |
| BAK-012 | FTR-095,096,097 |

---

## SEC — Security/privacy

These are cross-cutting security controls; the listed Feature IDs are primary implementation/evidence owners, not the only affected features.

| Requirement | Primary owner(s) / control |
|---|---|
| SEC-001 | FTR-099 + ASVS evidence process |
| SEC-002 | FTR-001,099 + release quality gate |
| SEC-003 | X-CUT all project features; FTR-002..012 foundation; FTR-099 final evidence |
| SEC-004 | X-CUT all user/import rendering; FTR-036..044 import security |
| SEC-005 | FTR-001,099 |
| SEC-006 | X-CUT product/privacy; diagnostics only FTR-098 |
| SEC-007 | FTR-098 + X-CUT logging policy |
| SEC-008 | FTR-001,099 |
| SEC-009 | FTR-001,099,100..104 + repo hygiene |
| SEC-010 | FTR-044,094..096 + export profiles |
| SEC-011 | X-CUT DB schema/RLS; every relational Feature ID |
| SEC-012 | FTR-004,007,050,097,042/043 + protected DB commands |

---

## QLT — Quality/testing

These are cross-cutting engineering controls.

| Requirement | Primary owner(s) / control |
|---|---|
| QLT-001 | FTR-001 + all implementation PRs |
| QLT-002 | FTR-001 + all in-scope business code |
| QLT-003 | FTR-001 + critical engine Feature IDs (021,046,057,071,040, etc.) |
| QLT-004 | FTR-001 + every RLS-backed feature |
| QLT-005 | FTR-001 + acceptance-critical user Feature IDs |
| QLT-006 | FTR-083..088 + offline-capable features |
| QLT-007 | FTR-094..104 |
| QLT-008 | FTR-001,103 + UI features |
| QLT-009 | X-CUT UX features + checkpoint UX review |
| QLT-010 | X-CUT reference-data performance + Feature-specific budgets |
| QLT-011 | pre-code FINAL-DESIGN-REVIEW governance, no implementation Feature owner |

---

## UX — UX/accessibility

UX requirements are cross-cutting but map to user-facing Feature IDs and the UX architecture/review system.

| Requirement | Feature owner(s) / control |
|---|---|
| UX-001 | all user-facing Feature IDs; especially FTR-017,073,045/053 |
| UX-002 | FTR-013,064,054,029 + quick-add patterns |
| UX-003 | all primary-route Feature IDs + UX review checklist |
| UX-004 | all status-rendering user-facing features |
| UX-005 | all mobile user-facing features; FTR-028 especially |
| UX-006 | FTR-011,043,050,097 + destructive/protected actions |
| UX-007 | FTR-014,029,034/035,061 etc. where reversible |
| UX-008 | all form/external-navigation features |
| UX-009 | all user-facing error paths |
| UX-010 | all desktop core workflows |
| UX-011 | FTR-060..063,075..077 + non-pointer fallbacks |

Additional frozen UX architecture rules are enforced through `UX-ARCHITECTURE.md`, `SCREEN-BLUEPRINTS.md` and `UX-REVIEW-CHECKLIST.md`, even where the original requirement catalog uses broader IDs.

---

## OPS — Free tier / operations

| Requirement | Feature owner(s) / control |
|---|---|
| OPS-001 | FTR-098 + X-CUT deployment configuration |
| OPS-002 | FTR-098,086,092 |
| OPS-003 | FTR-086,092,098 |
| OPS-004 | FTR-098 |
| OPS-005 | FTR-099 + incident response process |
| OPS-006 | FTR-083..088 + cached feature behavior |
| OPS-007 | X-CUT deletion/retention; relevant entity features |
| OPS-008 | FTR-002 + bootstrap lock / FTR-098 monitoring |

---

# Reconciliation findings

## Requirement without implementation owner

Current result: **none intentionally identified**. Every catalog requirement above has at least one Feature ID or explicit cross-cutting control.

This must be rechecked if `REQUIREMENTS-CATALOG.md` changes.

## Feature without requirement owner

Feature Ledger contains some engineering/platform capabilities such as FTR-001 whose justification is primarily QLT/SEC/OPS requirements rather than one product requirement; this is intentional.

No user-facing Feature ID should exist without a mapped product/domain/UX requirement and flow/acceptance evidence.

## Verification rule

During implementation, this matrix gains evidence through FIR/PR/test links; it is not considered runtime proof merely because mapping exists.

At each checkpoint, compare this matrix to:
- current Requirements Catalog;
- Feature Ledger statuses;
- tests/evidence;
- implementation code/schema;
- final checkpoint findings.

Any new unmapped P0/P1 requirement is a MAJOR documentation/implementation finding.
