# WP-2.3 — Fact definitions, typed retained facts and value validation

## Identity

- Work Packet ID: `WP-2.3`
- Lot: `2`
- Name: Fact definitions, typed retained facts and value validation
- State: `REVIEW_PENDING`
- Current pass: `B-ADVERSARIAL-REVIEW — fresh re-review next`
- Primary bounded context: `facts` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependencies: `WP-2.1 ACCEPTED`, `WP-2.2 ACCEPTED`
- Reviewed Pass-A implementation head: `e209d5d33ef2ec5c535121caf9e2e066012f4de8`
- Historical Pass-A CI: run `34062811901` — **5/5 SUCCESS**
- Remediated implementation head: `29d864586e791bd6d6b4e34747f9fe39f3e94848`
- Exact remediation CI: run `34067663400` — **5/5 SUCCESS**, including clean-checkout `npm run verify`

## Scope

### Primary Feature

- `FTR-019` — typed facts/criteria retained value.

### Current-lot responsibilities

- persist project-scoped `fact_definitions` with stable key/label, Venue entity type, declared value type, optional unit/options metadata, priority, weight, freshness policy, `system_defined`, `evaluation_rule_json` and standard audit/revision metadata;
- allow authorized creation/edit of custom Venue fact definitions while preventing ordinary client mutation from silently repurposing system-defined key/type/evaluation semantics;
- persist one active retained `fact` per project/Venue/definition with explicit state `known`, `unknown`, `not_applicable` or `conflict`;
- keep known `false`, `0` and valid empty values distinct from `unknown` according to the declared type;
- validate `facts.retained_value` against the referenced definition before canonical persistence for all frozen V1 value types: `boolean`, `number`, `money`, `text`, `date`, `time`, `rating`, `select`, `multiselect`, `duration`, `distance`, `url`;
- validate definition metadata needed by those types: numeric bounds/integer semantics, select/multiselect options, unit semantics where declared and exact supported JSON shapes;
- accept `evaluation_rule_json` only when null or structurally supported/compatible with the definition value type; actual criterion evaluation/scoring is not implemented here;
- enforce same-project and same-domain integrity for Venue target + definition;
- use `venues.read` / `venues.write` as the inherited authorization boundary for Venue facts and Venue fact definitions;
- provide domain/application/Supabase parser/adapter boundaries for later observations, criteria and UI without implementing downstream packets.

### State/value rule

WP-2.3 has no observation-resolution workflow yet:

- `state = known` requires a non-null retained value valid for the definition;
- `state = unknown`, `not_applicable` or `conflict` requires `retained_value = null`;
- provisional conflict retained values are deferred to WP-2.4;
- `false`, `0` and valid empty text remain legitimate `known` values, never unknown sentinels.

### Requirements / acceptance / security

- `VEN-005` factual-criterion foundation only;
- `FAC-001`, WP-2.3 portion of `FAC-003`, `FAC-011`, `FAC-012`;
- `ACC-021`, `ACC-024`;
- Domain invariants 21, 22, 27 and 29;
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- applicable `SEC-AUTHZ-*`, `SEC-VAL-*`, `SEC-INJ-*`, `SEC-SUP-*`, `SEC-VER-*` requirements identified by the packet;
- `RLS-MATRIX-V1` Facts/evidence rules and direct project-isolation matrix.

### Explicitly out of scope

- observations, sources, provenance, evidence classes, confidence/freshness and conflict-resolution workflow — WP-2.4;
- compatibility evaluation, blockers, weighted score, completeness, `evidenceReadiness`, explanation and missing-information read model — WP-2.5;
- complete default criteria seeding;
- Vendor facts or other target domains;
- UI, IndexedDB/offline queue, import/export and real wedding data.

## Frozen value-shape contract

WP-2.3 mirrors `docs/domain/FACT-VALUE-TYPES.md` at TypeScript and PostgreSQL mutation boundaries:

- boolean: JSON boolean;
- number: finite JSON number with optional min/max/integer metadata;
- rating: finite number on supported configured scale, default 0..10;
- money: `{minor: integer, currency: ISO-4217 uppercase}`;
- text: bounded JSON string;
- url: canonical conservative `http`/`https` external-host subset;
- date: canonical civil `YYYY-MM-DD`;
- time: `{time: "HH:MM", dayOffset: integer}` with bounded offset;
- duration: integer minutes;
- distance: integer meters;
- select: one declared option key;
- multiselect: unique declared option-key array sorted by stable key order.

Invalid shape/type/bounds/options are rejected before becoming canonical retained truth.

Currency note: this packet enforces the frozen uppercase three-letter representation but does not invent an ISO-4217 registry or currency conversion.

## Evaluation-rule storage boundary

`fact_definitions.evaluation_rule_json` is structurally validated for the V1 rule shapes frozen in `CRITERIA-EVALUATION.md`; WP-2.3 does not execute rules. `custom_manual_assessment` remains structural only. Before WP-2.5 executes or seeds that rule, its acceptable-value representation remains an explicit specification stop-condition.

## System/default criteria boundary

`DEFAULT-CRITERIA.md` remains normative, but WP-2.3 does not bulk-seed it. Ordinary client commands cannot create `system_defined` definitions or repurpose protected system semantics.

## Sizing review

| Complexity source | Points |
|---|---:|
| new Facts bounded domain/value algebra | 3 |
| two persistent table families (`fact_definitions`, `facts`) | 2 |
| polymorphic Venue-target + same-project integrity/RLS | 1 |
| typed retained-value + evaluation-rule validation boundary | 2 |
| **Total** | **8** |

Observation/provenance and criteria evaluation remain separate packets.

## Pass A — IMPLEMENT

### Implementation evidence

Domain/application:

- `src/domain/facts/fact-types.ts`, `fact-options.ts`, `fact-definition.ts`, `fact-evaluation-rule.ts`, `fact-value.ts`, `retained-fact.ts` plus tests;
- `src/application/facts/venue-fact-service.ts` plus tests.

Infrastructure:

- `src/infrastructure/supabase/supabase-venue-fact-adapter.ts` plus tests;
- `src/infrastructure/supabase/parse-venue-fact-row.ts` plus tests;
- provider definition identity hardening at `2ce0ef5ba578a14da461d8f8b7490599bc03eda8`.

Persistence/security:

- `20260906183000_create_venue_fact_foundation.sql`;
- `20260906194500_harden_venue_fact_rule_numeric_bounds.sql`;
- `20260906201500_harden_venue_fact_canonical_parity.sql`;
- explicit schema qualification, safe `search_path`, revoked default function execution and narrow authenticated grants.

Historical reviewed-head evidence, run `34062811901` on `e209d5d33ef2ec5c535121caf9e2e066012f4de8`:

- Core: **57 files / 669 tests PASS**, 100% measured coverage;
- DB/RLS: **25 files / 553 pgTAP tests PASS**;
- Browser: **40/40 Playwright PASS**;
- mutation, preview and clean-checkout verify: PASS.

Pass A exit was green, then fresh Pass B correctly found defects and moved the packet to `REVIEW_FAILED`.

## Pass B — ADVERSARIAL REVIEW

The first fresh adversarial review reconstructed the packet from Facts, security, repository/service and error contracts and returned **FAIL** because unresolved MAJOR findings existed.

### Original findings and remediation state

| Severity | Finding | Remediation | State |
|---|---|---|---|
| MAJOR `WP2.3-B-001` | Numeric metadata could be contradictory or define an interval with no representable canonical value. | Type-aware satisfiability checks added in TypeScript and PostgreSQL; contradictory integer semantics and impossible bounds rejected. | **RESOLVED** |
| MAJOR `WP2.3-B-002` | Multiselect canonical ordering depended on mutable definition option order. | Canonical retained values now sort by stable option key in TS/PostgreSQL, independent of display/definition order. | **RESOLVED** |
| MAJOR `WP2.3-B-003` | TS UTF-16 `.length` diverged from PostgreSQL character semantics. | Shared code-point length rule added in TS to match PostgreSQL `char_length`, with exact-limit regressions. | **RESOLVED** |
| MAJOR `WP2.3-B-004` | SQL URL regex could admit values rejected by the TS standards parser. | Conservative canonical URL grammar frozen and implemented in both TS and SQL, including host/label/port/control-character checks. | **RESOLVED** |
| MAJOR `WP2.3-B-005` | Persistence failures collapsed to generic `persistence_failed`. | Scoped typed Facts persistence errors and safe SQLSTATE/PostgREST mapping distinguish conflict, auth/policy, backend, integrity and malformed provider responses without leaking raw details. | **RESOLVED** |
| MINOR `WP2.3-B-006` | Concurrent first retained-fact creates could surface raw uniqueness behavior. | `23505` normalized to the same scoped `conflict` category as stale/revision conflict. | **RESOLVED** |
| MINOR `WP2.3-B-007` | Nested canonical JSON retained mutable source references. | Normalized options and evaluation rules are detached and deeply frozen; mutation-after-normalization regressions added. | **RESOLVED** |

### Remediation implementation evidence

- canonicality hardening migration: `20260906223000_harden_venue_fact_adversarial_canonicality.sql`;
- shared TS canonical helpers for numeric satisfiability, Unicode length and URLs;
- stable multiselect key sorting in TypeScript and PostgreSQL;
- `src/application/facts/venue-fact-persistence-error.ts` with safe typed failure codes;
- adapter mapping for `40001`/`23505`, `42501`, bounded PostgREST backend codes, integrity SQLSTATE families and malformed provider responses;
- `fact-immutability.test.ts` proves canonical options/rules are detached from mutable source objects and frozen.

### Exact remediation verification

GitHub Actions run `34067663400` on `29d864586e791bd6d6b4e34747f9fe39f3e94848`: **5/5 SUCCESS**.

- **Core quality and security: SUCCESS**
  - **59 test files / 705 tests PASS**;
  - **100% statements / branches / functions / lines**;
  - typecheck, format, lint, architecture, Knip, debt-marker, quality/security negative controls, dependency gate and build PASS.
- **Local Supabase DB and RLS: SUCCESS**
  - **26 files / 575 pgTAP tests PASS** after full reset/migration application;
  - Facts canonicality, parity, value types, RLS/RPC, same-project, system-defined and stale-write tests PASS.
- **Browser and mutation harnesses: SUCCESS**
  - **40/40 Playwright E2E PASS** across Chromium, Firefox, WebKit and mobile Chromium;
  - mutation harness PASS, score **82.50%**, above configured break threshold.
- **Privacy-safe preview artifact: SUCCESS**.
- **Full verify from clean checkout: SUCCESS** with `npm run verify`.

Dependency audit continues to report only the previously reviewed two Moderate transitive development-tool advisories; no accepted-known Critical/High vulnerability is introduced by the remediation.

### Remediation exit gate

- [x] all original `WP2.3-B-001..007` findings have scoped fixes and regression evidence;
- [x] all affected TypeScript/PostgreSQL/provider/security verification rerun;
- [x] exact remediated implementation head is 5/5 green including clean-checkout `npm run verify`;
- [x] no WP-2.4/WP-2.5 behavior added;
- [x] packet transitions from remediation to `REVIEW_PENDING`.

### Fresh re-review entry

A new independent Pass B must now judge the remediated implementation from the normative contracts rather than accepting these remediation conclusions. No Pass B PASS is claimed by this transition commit.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires the new independent Pass B to PASS with no unresolved BLOCKING/MAJOR finding.

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| definitions | project-scoped typed Venue metadata + protected system semantics | domain + RPC/schema + remediation hardening | unit/provider + pgTAP + exact-head CI | awaiting fresh Pass B |
| retained states | known/unknown/not_applicable/conflict with no sentinel collapse | retained-fact domain/service + DB command | unit + pgTAP | awaiting fresh Pass B |
| typed values | all 12 V1 canonical shapes/bounds | TS normalizers + PostgreSQL validators | unit/parity/value-type pgTAP | awaiting fresh Pass B |
| same-project/authz | Venue target+definition integrity + venue permissions | FK/RLS/RPC | direct security matrix | awaiting fresh Pass B |
| architecture/errors | layered provider boundary, fail-closed parser and typed safe failures | service/adapter/parser/error contract | static + malformed/error mapping tests | awaiting fresh Pass B |

Final packet decision: `REVIEW_PENDING`.

## Handoff

- Current state: `REVIEW_PENDING`
- Current/next pass: **fresh independent `B-ADVERSARIAL-REVIEW` only**
- Accepted prerequisites: `WP-2.1`, `WP-2.2`
- Historical Pass-A head/run: `e209d5d33ef2ec5c535121caf9e2e066012f4de8` / `34062811901`
- Remediated implementation head/run: `29d864586e791bd6d6b4e34747f9fe39f3e94848` / `34067663400` — **5/5 SUCCESS**
- Original open findings `WP2.3-B-001..007`: **all RESOLVED pending independent re-review**
- Open WP-2.3 BLOCKING/MAJOR findings at remediation handoff: **none recorded**
- Recorded downstream stop-condition: before WP-2.5 executes/seeds `custom_manual_assessment`, freeze its configured acceptable-value representation
- Next permitted action: **fresh Pass B on WP-2.3 only; do not start WP-2.4**
