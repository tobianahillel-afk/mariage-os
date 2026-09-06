# Mariage OS — V1 Feature Ledger

Status: **Normative implementation tracking index — all features initially SPECIFIED**

Purpose: provide one exhaustive implementation checklist at user-capability level so features cannot disappear between product documentation, lots, code and testing.

This is not a backlog of individual engineering tasks. Each row is a meaningful user/system capability that must eventually have a Feature Implementation Record under `engineering/IMPLEMENTATION-PLAYBOOK.md`.

Allowed status values:
`SPECIFIED`, `READY`, `IN_PROGRESS`, `IMPLEMENTED`, `VERIFIED`, `INTEGRATED`, `ACCEPTED`, `BLOCKED`.

Before implementation gate opens, every V1 row remains `SPECIFIED`.

---

## Platform / identity / collaboration

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-001 | Reproducible repository/tooling/quality bootstrap | 0 | LOT-ACCEPTANCE, QUALITY-GATES | SPECIFIED |
| FTR-002 | Controlled first-owner production bootstrap | 1 | AUTH-ONBOARDING, BOOTSTRAP-INVITATIONS | SPECIFIED |
| FTR-003 | Verified user sign-in/session/recovery | 1 | AUTHENTICATION | SPECIFIED |
| FTR-004 | Partner one-time invitation and acceptance | 1 | BOOTSTRAP-INVITATIONS, RLS | SPECIFIED |
| FTR-005 | TOTP MFA and recent-auth protected operations | 1/11 | AUTHENTICATION | SPECIFIED |
| FTR-006 | Project settings locale/timezone/currency | 1 | SCREEN-CONTRACTS, DATES-TIME, MONEY | SPECIFIED |
| FTR-007 | Candidate wedding dates and atomic selected date | 1 | DATES-TIME, PHYSICAL-SCHEMA | SPECIFIED |
| FTR-008 | Reference origins for access comparison | 1/9 | MAP, DEPENDENCY-GRAPH | SPECIFIED |
| FTR-009 | Responsive application shell/navigation/deep links | 1 | NAVIGATION, SCREEN-CONTRACTS | SPECIFIED |
| FTR-010 | Global sync status and local durability indicator | 1 | LOCAL-FIRST, SYNC | SPECIFIED |
| FTR-011 | Safe logout with pending-work resolution and local purge | 1/10 | AUTHENTICATION, OFFLINE | SPECIFIED |
| FTR-012 | Personal cross-device UI preferences | 1/2 | PHYSICAL-SCHEMA, RLS | IN_PROGRESS |

## Venue research / comparison

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-013 | Minimal/quick venue creation with duplicate guard | 2 | VENUES, USER-FLOWS | IN_PROGRESS |
| FTR-014 | Venue lifecycle shortlist/reject/restore/history | 2 | VENUES, STATE-MACHINES | IN_PROGRESS |
| FTR-015 | Venue gallery browsing | 2 | VENUES, UX | SPECIFIED |
| FTR-016 | Venue analytical table with controlled columns | 2 | VENUES, UX | SPECIFIED |
| FTR-017 | Venue detail summary-first workspace | 2 | SCREEN-CONTRACTS, VENUES | SPECIFIED |
| FTR-018 | Venue spaces/dimensions/capacity/configuration | 2 | VENUES, PHYSICAL-SCHEMA | IN_PROGRESS |
| FTR-019 | Typed facts/criteria retained value | 2 | FACTS-SOURCES, FACT-VALUE-TYPES | SPECIFIED |
| FTR-020 | Multi-source observations/provenance/conflict | 2 | FACTS-SOURCES, CONFIDENCE-FRESHNESS | SPECIFIED |
| FTR-021 | Deterministic criterion evaluation / blockers / score explanation | 2 | CRITERIA-EVALUATION | SPECIFIED |
| FTR-022 | Missing/stale/conflicting information guidance | 2/3 | VENUES, TASKS | SPECIFIED |
| FTR-023 | Individual partner favorites/ratings/preferences | 2 | RLS, PHYSICAL-SCHEMA | IN_PROGRESS |
| FTR-024 | Venue photos remote references/private archive/gallery | 2 | STORAGE, DOCUMENTS-MEDIA | SPECIFIED |
| FTR-025 | Venue offers/date pricing/availability context | 2/5 | VENUES, BUDGET | SPECIFIED |
| FTR-026 | Venue contacts/interactions/quote follow-up | 2/3 | VENUES, TASKS | SPECIFIED |
| FTR-027 | Venue comparison 2–5 candidates/differences | 2 | VENUES, UX | SPECIFIED |
| FTR-028 | Mobile venue visit/offline package | 2/10 | OFFLINE, USER-FLOWS | SPECIFIED |

## Tasks / decisions / quick capture

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-029 | Task creation/ownership/status/due/priority | 3 | TASKS-DECISIONS | SPECIFIED |
| FTR-030 | Waiting externally / follow-up workflow | 3 | TASKS, DASHBOARD | SPECIFIED |
| FTR-031 | Task dependencies/blockers/cycle protection | 3 | INVARIANTS, STATE-MACHINES | SPECIFIED |
| FTR-032 | Joint decisions/options/approvals/rationale | 3 | DECISIONS | SPECIFIED |
| FTR-033 | Discuss-together queue and locked/reopen history | 3 | DECISIONS | SPECIFIED |
| FTR-034 | Global Inbox quick capture text/URL/hints | 3 | INBOX | SPECIFIED |
| FTR-035 | Idempotent Inbox conversion into domain records | 3/4 | INBOX, DEDUPLICATION | SPECIFIED |

## Import / export / portability

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-036 | Import file/type/domain detection | 4 | IMPORT-EXPORT, FORMATS | SPECIFIED |
| FTR-037 | CSV/XLSX/clipboard/JSON parsing and normalization | 4 | FORMATS, MAPPING | SPECIFIED |
| FTR-038 | Mapping preview and saved mapping profiles | 4 | MAPPING | SPECIFIED |
| FTR-039 | Duplicate detection / external identity / parent scope | 4 | DEDUPLICATION, IDENTIFIERS | SPECIFIED |
| FTR-040 | Evidence-aware merge plan / protected truth | 4 | MERGE | SPECIFIED |
| FTR-041 | Preview-before-commit and stale-preview revalidation | 4 | IMPORT-EXPORT | SPECIFIED |
| FTR-042 | Transactional apply / provenance / import history | 4 | IMPORT-EXPORT, PHYSICAL-SCHEMA | SPECIFIED |
| FTR-043 | Intelligent rollback without overwriting later edits | 4 | ROLLBACK | SPECIFIED |
| FTR-044 | Module exports and research-missing-data round trip | 4 | CANONICAL-JSON, IMPORT-EXPORT | SPECIFIED |

## Budget / finance

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-045 | Budget categories/items and exact money values | 5 | BUDGET, MONEY | SPECIFIED |
| FTR-046 | Fixed/per-guest/per-table/per-hour/quantity calculations | 5 | BUDGET-PAYMENTS | SPECIFIED |
| FTR-047 | Quote/approved/contracted amount distinctions | 5 | BUDGET-PAYMENTS | SPECIFIED |
| FTR-048 | Tax included/excluded/unknown/not-applicable semantics | 5 | MONEY, BUDGET | SPECIFIED |
| FTR-049 | Named budget scenarios date/venue/guest assumptions | 5 | BUDGET, DEPENDENCY-GRAPH | SPECIFIED |
| FTR-050 | Atomic active operational scenario | 5 | STATE-MACHINES, RLS | SPECIFIED |
| FTR-051 | Payment schedule/installments/final balance | 5 | BUDGET-PAYMENTS | SPECIFIED |
| FTR-052 | Refundable deposits/refunds/credits/returns | 5 | BUDGET-PAYMENTS | SPECIFIED |
| FTR-053 | Cash-flow/committed/paid/remaining summaries | 5/8 | BUDGET, DASHBOARD | SPECIFIED |

## Guests / households / seating

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-054 | Household/person creation and relationships | 6 | GUESTS | SPECIFIED |
| FTR-055 | Guest categories/priorities/probability | 6 | GUESTS, INVARIANTS | SPECIFIED |
| FTR-056 | RSVP lifecycle and confirmed/expected attendance | 6 | GUESTS, STATE-MACHINES | SPECIFIED |
| FTR-057 | Cumulative priority/statistics views | 6 | GUESTS | SPECIFIED |
| FTR-058 | Guest bulk actions/import/export | 6 | GUESTS, IMPORT-EXPORT | SPECIFIED |
| FTR-059 | Guest logistics/dietary/transport/accommodation notes | 6 | GUESTS, PRIVACY | SPECIFIED |
| FTR-060 | Seating sections/tables/capacities | 6 | SEATING | SPECIFIED |
| FTR-061 | Assign/move/unassign guests with one-active-assignment rule | 6 | SEATING, INVARIANTS | SPECIFIED |
| FTR-062 | Seating readiness/warnings/RSVP invalidation | 6/8 | SEATING, DEPENDENCY-GRAPH | SPECIFIED |
| FTR-063 | Seating print/export by table/section/alphabetical | 6 | SEATING | SPECIFIED |

## Vendors / commercial follow-up

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-064 | Vendor creation/types/lifecycle | 7 | VENDORS | SPECIFIED |
| FTR-065 | Vendor contacts/interactions/follow-up | 7 | VENDORS, TASKS | SPECIFIED |
| FTR-066 | Vendor offers/packages/inclusions/extras | 7 | VENDORS, BUDGET | SPECIFIED |
| FTR-067 | Caterer-specific pricing/inclusions/criteria | 7 | VENDORS, DEFAULT-CRITERIA | SPECIFIED |
| FTR-068 | Venue↔vendor compatibility/linking | 7 | VENDORS, VENUES | SPECIFIED |

## Product control / planning / day-of data

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-069 | Planning phases/weighted milestones | 8 | PLANNING | SPECIFIED |
| FTR-070 | Milestone dependencies/completion readiness | 8 | PLANNING, INVARIANTS | SPECIFIED |
| FTR-071 | Explainable next-action prioritization | 8 | DASHBOARD, TASKS | SPECIFIED |
| FTR-072 | Dashboard blockers/waiting/joint decisions | 8 | DASHBOARD | SPECIFIED |
| FTR-073 | Dashboard budget/deadline/progress summaries | 8 | DASHBOARD | SPECIFIED |
| FTR-074 | Meaningful partner changes since last visit | 8 | DASHBOARD, ACTIVITY | SPECIFIED |
| FTR-075 | Wedding event timeline structured items | 8 | EVENT-TIMELINE | SPECIFIED |
| FTR-076 | Timeline dependencies/vendor/location/time validation | 8 | EVENT-TIMELINE, DATES-TIME | SPECIFIED |
| FTR-077 | Timeline final snapshot/print/vendor-filtered export | 8 | EVENT-TIMELINE | SPECIFIED |
| FTR-078 | Global Search project-scoped results/deep links | 8 | GLOBAL-SEARCH | SPECIFIED |

## Map / travel access

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-079 | Venue map pins/status filters/selected venue | 9 | MAP | SPECIFIED |
| FTR-080 | Contextual access routes by origin/mode | 9 | MAP, PHYSICAL-SCHEMA | SPECIFIED |
| FTR-081 | TGV/transfer/public transport/shuttle facts | 9 | MAP, DEFAULT-CRITERIA | SPECIFIED |
| FTR-082 | Safe external directions and map-failure fallback | 9 | MAP, OFFLINE | SPECIFIED |

## Offline / PWA hardening

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-083 | Durable pending mutation queue/retry/idempotence | 10 | SYNC, LOCAL-DATA-SCHEMA | SPECIFIED |
| FTR-084 | Explicit sync conflict persistence/resolution | 10 | SYNC | SPECIFIED |
| FTR-085 | Local schema migrations preserving unsynced work | 10 | LOCAL-DATA-SCHEMA, MIGRATIONS | SPECIFIED |
| FTR-086 | Offline pin/cache retention and storage-pressure behavior | 10 | OFFLINE, STORAGE | SPECIFIED |
| FTR-087 | Service-worker install/update/schema compatibility | 10 | PWA-LIFECYCLE | SPECIFIED |
| FTR-088 | Session expiry/reauth/revoked membership reconnect behavior | 10 | AUTHENTICATION, SYNC | SPECIFIED |

## Documents / contracts / media lifecycle

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-089 | Private document upload/download/link/provenance | 2/7/11 | DOCUMENTS, STORAGE | SPECIFIED |
| FTR-090 | Document version/supersession history | 7/11 | CONTRACT-READINESS, SCHEMA ADDENDUM | SPECIFIED |
| FTR-091 | Quote/contract readiness checklist and follow-up | 7/8 | CONTRACT-READINESS | SPECIFIED |
| FTR-092 | Original media/derivative/orphan lifecycle | 2/10/11 | STORAGE | SPECIFIED |
| FTR-093 | Generic tags/entity links | 2/7 | PHYSICAL-SCHEMA | SPECIFIED |

## Recovery / production / migration

| ID | Capability | Lot | Primary contracts | Status |
|---|---|---:|---|---|
| FTR-094 | Plain `.mariage` backup manifest/archive/checksums | 11 | BACKUP-FORMAT, BACKUPS | SPECIFIED |
| FTR-095 | Password-protected encrypted backup | 11 | BACKUP-FORMAT | SPECIFIED |
| FTR-096 | Backup inspect/verify/compatibility without mutation | 11 | BACKUP-FORMAT | SPECIFIED |
| FTR-097 | Controlled restore/recovery workflow | 11 | DISASTER-RECOVERY | SPECIFIED |
| FTR-098 | Production quota protection/diagnostics | 11 | FREE-TIER, DIAGNOSTICS | SPECIFIED |
| FTR-099 | Production security headers/scanning/release evidence | 11 | SECURITY, QUALITY-GATES | SPECIFIED |
| FTR-100 | Existing venue research migration/reconciliation | 12 | INITIAL-DATA-MIGRATION | SPECIFIED |
| FTR-101 | Existing guest spreadsheet migration/reconciliation | 12 | INITIAL-DATA-MIGRATION | SPECIFIED |
| FTR-102 | Existing vendor research migration/reconciliation | 12 | INITIAL-DATA-MIGRATION | SPECIFIED |
| FTR-103 | Real-device partner acceptance | 12 | CUTOVER, BROWSER-SUPPORT | SPECIFIED |
| FTR-104 | Formal source-of-truth cutover/recovery export | 12 | CUTOVER, V1-SCOPE | SPECIFIED |

---

# Ledger maintenance rules

1. A Feature ID is never silently deleted after implementation begins. If removed from V1, keep the row and mark the scope-change reference.
2. One feature may span lots only when there is a deliberate foundation→hardening sequence; the FIR identifies exactly what each lot owns.
3. Every P0/P1 requirement must map to one or more Feature IDs or a purely cross-cutting engineering control.
4. Every Feature ID must map to at least one acceptance test or lower-level evidence before `VERIFIED`.
5. Checkpoint reports reconcile every Feature ID whose lot has elapsed.
6. A lot cannot be accepted while a required Feature ID assigned to it remains unexplained `SPECIFIED`, `READY`, `IN_PROGRESS`, `IMPLEMENTED` or `BLOCKED`.
7. Post-V1 features do not enter this ledger unless formally promoted into V1 through specification/ADR change.
8. Implementation status is repository truth; chat messages do not update feature status.
