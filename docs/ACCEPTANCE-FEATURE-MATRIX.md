# Mariage OS — Acceptance Scenario / Feature Matrix

Status: **Normative V1 behavioral traceability reconciliation**

Purpose: connect every critical `ACC-xxx` scenario to the Feature IDs that must eventually provide implementation/test evidence.

Scenario text remains authoritative in `ACCEPTANCE-SCENARIOS.md`.

---

## Identity / local safety

| Acceptance | Feature IDs |
|---|---|
| ACC-001 | FTR-002 |
| ACC-002 | FTR-002, FTR-098 |
| ACC-003 | FTR-004 |
| ACC-004 | FTR-004 |
| ACC-005 | X-CUT all project features; foundation FTR-002..012; final FTR-099 |
| ACC-006 | X-CUT schema/RLS; affected relational Feature IDs |
| ACC-007 | FTR-023, FTR-032 |
| ACC-008 | FTR-088, FTR-083, FTR-011 |
| ACC-009 | FTR-011, FTR-083 |
| ACC-010 | FTR-085, FTR-088 |

## Local-first / sync / PWA

| Acceptance | Feature IDs |
|---|---|
| ACC-011 | FTR-010, FTR-083 |
| ACC-012 | FTR-083 |
| ACC-013 | FTR-023, FTR-024, FTR-083 |
| ACC-014 | FTR-084 |
| ACC-015 | FTR-020, FTR-084 |
| ACC-016 | FTR-085, FTR-087 |
| ACC-017 | FTR-082, FTR-086 |
| ACC-018 | FTR-051, FTR-053, FTR-083 |
| ACC-019 | FTR-032, FTR-083, FTR-084 |
| ACC-020 | FTR-036..043 |

## Venue / criteria / evidence / access

| Acceptance | Feature IDs |
|---|---|
| ACC-021 | FTR-013, FTR-019 |
| ACC-022 | FTR-021, FTR-027 |
| ACC-023 | FTR-019, FTR-021 |
| ACC-024 | FTR-019, FTR-020, FTR-037 |
| ACC-025 | FTR-020 |
| ACC-026 | FTR-020, FTR-040 |
| ACC-027 | FTR-020, FTR-022 |
| ACC-028 | FTR-019, FTR-021 |
| ACC-029 | FTR-023 |
| ACC-030 | FTR-008, FTR-080 |
| ACC-031 | FTR-007, FTR-025, FTR-049 |
| ACC-032 | FTR-014 |

## Import/export identity / mapping

| Acceptance | Feature IDs |
|---|---|
| ACC-033 | FTR-039, FTR-040, FTR-042 |
| ACC-034 | FTR-039 |
| ACC-035 | FTR-040, FTR-041, FTR-042 |
| ACC-036 | FTR-039, FTR-058 |
| ACC-037 | FTR-038 |
| ACC-038 | FTR-040, FTR-041, FTR-042 |
| ACC-039 | FTR-043 |
| ACC-040 | FTR-044 |

## Guests / seating

| Acceptance | Feature IDs |
|---|---|
| ACC-041 | FTR-055, FTR-056, FTR-057 |
| ACC-042 | FTR-055, FTR-056, FTR-057 |
| ACC-043 | FTR-061, FTR-084 |
| ACC-044 | FTR-061 + X-CUT same-project constraints |
| ACC-045 | FTR-060, FTR-061, FTR-062 |
| ACC-046 | FTR-056, FTR-061, FTR-062 |

## Budget / scenarios / payments

| Acceptance | Feature IDs |
|---|---|
| ACC-047 | FTR-049 |
| ACC-048 | FTR-049, FTR-050 |
| ACC-049 | FTR-025, FTR-047, FTR-049 |
| ACC-050 | FTR-048, FTR-049 |
| ACC-051 | FTR-052, FTR-053 |
| ACC-052 | FTR-045, FTR-051, FTR-052, FTR-053 |

## Documents / contracts / media

| Acceptance | Feature IDs |
|---|---|
| ACC-053 | FTR-090 |
| ACC-054 | FTR-091, FTR-029 |
| ACC-055 | FTR-089, FTR-092 |
| ACC-056 | FTR-024, FTR-092 |
| ACC-057 | FTR-024, FTR-082, FTR-092 |
| ACC-058 | FTR-089, FTR-092 + Storage security control |

## Planning / timeline / search / Inbox

| Acceptance | Feature IDs |
|---|---|
| ACC-059 | FTR-007, FTR-069, FTR-070 |
| ACC-060 | FTR-075, FTR-076 |
| ACC-061 | FTR-076 |
| ACC-062 | FTR-077 |
| ACC-063 | FTR-077 + export/privacy control |
| ACC-064 | FTR-034, FTR-035 |
| ACC-065 | FTR-078 |
| ACC-066 | FTR-078 + privacy control |

## Backup / security / operations

| Acceptance | Feature IDs |
|---|---|
| ACC-067 | FTR-094, FTR-096, FTR-097 |
| ACC-068 | FTR-095, FTR-096, FTR-097 |
| ACC-069 | FTR-096, FTR-097 |
| ACC-070 | FTR-086, FTR-094, FTR-096 |
| ACC-071 | FTR-086, FTR-092, FTR-098 |
| ACC-072 | FTR-005, FTR-097 + protected project-deletion control |
| ACC-073 | FTR-094, FTR-097 |
| ACC-074 | FTR-001, FTR-099, FTR-100..104 + X-CUT repo hygiene |

## Architecture / no-context / readiness

| Acceptance | Feature IDs / control |
|---|---|
| ACC-075 | X-CUT architecture review; offline features FTR-083..088 + local representations of queueable features |
| ACC-076 | X-CUT all relational project features; DB/RLS control |
| ACC-077 | all FTR-001..104 + route/lot matrices |
| ACC-078 | X-CUT documentation/onboarding governance |
| ACC-079 | X-CUT FINAL-DESIGN-REVIEW gate; no implementation feature |
| ACC-080 | FTR-100..104, FTR-094..099 + cutover governance |

---

# Reconciliation result

- All 80 acceptance scenarios have a Feature ID or explicit cross-cutting implementation/review control.
- No scenario is intentionally left ownerless.
- Scenarios that are architectural/repository governance checks (`ACC-075..079`) correctly map to cross-cutting controls rather than a fake user feature.

This matrix must be updated whenever an acceptance scenario or Feature ID changes.

During implementation, Feature Implementation Records and tests add evidence links; mapping alone is not proof of passing behavior.
