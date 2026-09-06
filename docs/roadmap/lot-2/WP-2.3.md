# WP-2.3 — Fact definitions, typed retained facts and value validation

## Identity

- Work Packet ID: `WP-2.3`
- Lot: `2`
- Name: Fact definitions, typed retained facts and value validation
- State: `REVIEW_FAILED`
- Current pass: `B-ADVERSARIAL-REVIEW — FAILED; remediation next`
- Primary bounded context: `facts` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependencies: `WP-2.1 ACCEPTED`, `WP-2.2 ACCEPTED`
- WP-2.2 governance gate: run `34048565452` on `480b0bcc168d7789bf2bee07a75c8f04200f5cb7` — **5/5 SUCCESS**, clean-checkout `npm run verify` PASS
- Reviewed Pass-A implementation head: `e209d5d33ef2ec5c535121caf9e2e066012f4de8`
- Exact Pass-A CI: run `34062811901` — **5/5 SUCCESS**, including clean-checkout `npm run verify`

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
- enforce same-project and same-domain integrity for Venue target + definition; a project-A fact cannot reference a project-B Venue/definition;
- use `venues.read` / `venues.write` as the inherited authorization boundary for Venue facts and Venue fact definitions in this packet;
- provide domain/application/Supabase parser/adapter boundaries for later observations, criteria and UI without implementing those downstream layers.

### State/value rule for this packet

WP-2.3 has no observation-resolution workflow yet. Therefore:

- `state = known` requires a non-null retained value valid for the definition;
- `state = unknown`, `not_applicable` or `conflict` requires `retained_value = null` in WP-2.3;
- the documented exceptional conflict workflow that may retain a provisional value is deliberately deferred to WP-2.4, where observation/provenance/resolution history exists;
- `false` and `0` remain valid `known` values and are never unknown sentinels.

### Requirements / acceptance / security

- `VEN-005` factual-criterion foundation only;
- `FAC-001`, WP-2.3 portion of `FAC-003`, `FAC-011`, `FAC-012`;
- `ACC-021` unknown-vs-false foundation and `ACC-024` malformed canonical value rejection;
- Domain invariants 21, 22, 27 and 29;
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- applicable security baseline: `SEC-AUTHZ-001..005`, `SEC-AUTHZ-007..009`, `SEC-VAL-001..009` as applicable to the Facts boundary, `SEC-INJ-001..003`, `SEC-SUP-002`, `SEC-SUP-003`, `SEC-VER-001`, `SEC-VER-005`, `SEC-VER-006`;
- `RLS-MATRIX-V1` Facts/evidence rules and direct project isolation matrix.

### Explicitly out of scope

- `fact_observations`, `sources`, `observation_sources`, evidence classes, confidence/freshness calculation, source health or provenance history — WP-2.4;
- automatic conflict detection/resolution from competing observations or stronger/weaker evidence — WP-2.4;
- compatibility evaluation, blockers, weighted score, completeness, `evidenceReadiness`, explanation engine or missing-information read model — WP-2.5;
- seeding the complete default Venue criteria registry for compatibility use — deferred to the criteria packet so no incomplete scoring configuration is silently activated here;
- Vendor facts or other target domains; schema may remain extensible, but WP-2.3 exposed commands accept Venue targets only;
- UI, IndexedDB/offline queue, import/export and real wedding data.

## Frozen value-shape contract

WP-2.3 implementation must mirror `docs/domain/FACT-VALUE-TYPES.md` at both TypeScript and PostgreSQL mutation boundaries:

- boolean: JSON boolean;
- number: finite JSON number with optional definition min/max/integer metadata;
- rating: finite number on supported configured scale, default system scale 0..10;
- money: `{minor: integer, currency: ISO-4217 uppercase}` with no float/implicit conversion;
- text: JSON string with bounded length;
- url: validated `http`/`https` URL only;
- date: canonical civil `YYYY-MM-DD`;
- time: `{time: "HH:MM", dayOffset: integer}` with bounded day offset;
- duration: integer minutes;
- distance: integer meters;
- select: one declared option key;
- multiselect: unique declared option-key array with canonical stable ordering.

Invalid shape/type/bounds/options are rejected before becoming canonical retained truth.

Currency-boundary note for this packet: the already accepted Lot-1 `project_currency` boundary and the current Facts boundary both enforce the canonical uppercase three-letter currency-code representation. The frozen repository does not contain an embedded ISO-4217 registry, and WP-2.3 does not invent one or perform currency conversion. A stricter registry, if ever required, needs an explicit normative source/change rather than an implementation-local allowlist.

## Evaluation-rule storage boundary

`fact_definitions.evaluation_rule_json` is part of the frozen physical schema. WP-2.3 validates storage shape for supported V1 rule types from `CRITERIA-EVALUATION.md` and rejects unsupported/incompatible rules. It does **not** execute those rules.

Supported storage shapes include boolean equality, numeric min/max/range, rating minimum, select in/not-in, time at-or-after/before, money max, project target guest count and custom manual assessment. WP-2.5 owns actual deterministic evaluation and the still-recorded `evidenceReadiness` stop-condition.

`custom_manual_assessment` remains structural only in WP-2.3: no default registry is seeded and no PASS/FAIL evaluation is executed here. `CRITERIA-EVALUATION.md` says execution expects a configured acceptable value but does not freeze its exact representation for boolean/select/rating. That exact execution/configuration representation is therefore a recorded stop-condition before WP-2.5 may execute or seed this rule; WP-2.3 must not invent it prematurely.

## System/default criteria boundary

`DEFAULT-CRITERIA.md` remains the normative registry, but WP-2.3 does not bulk-seed it. This packet proves the safe schema/commands that later system seeds will use. Any later system seed must carry a stable key, compatible type/options and explicit evaluation rule where compatibility requires one; ordinary client commands cannot set or repurpose `system_defined` definitions.

## Sizing review

| Complexity source | Points |
|---|---:|
| new Facts bounded domain/value algebra | 3 |
| two persistent table families (`fact_definitions`, `facts`) | 2 |
| polymorphic Venue-target + same-project integrity/RLS | 1 |
| typed retained-value + evaluation-rule validation boundary | 2 |
| **Total** | **8** |

Within normal packet target. Observation/provenance and criteria evaluation remain separate packets specifically to avoid exceeding this scope.

## Expected vertical slice

- domain: fact states, definition/value types, options metadata, retained-value normalizer/validator, evaluation-rule storage validator;
- application: Venue fact-definition and retained-fact ports/services with optimistic revision semantics;
- infrastructure: strict Supabase adapters/parsers; no provider types leaking inward;
- cloud persistence: `fact_definitions` + `facts`, same-project target/definition validation, RLS/grants, narrow mutation RPCs protecting system/audit/revision columns;
- security: direct owner/editor/viewer/anon/outsider/project-B/revoked/cross-project target+definition tests;
- quality: exhaustive value-type valid/invalid tests, property tests where useful, malformed provider response tests and exact-head CI;
- UI/local/offline/import: none in this packet.

## Pass A — IMPLEMENT

### Implementation evidence

Domain/application:

- `src/domain/facts/fact-types.ts`, `fact-options.ts`, `fact-definition.ts`, `fact-evaluation-rule.ts`, `fact-value.ts`, `retained-fact.ts` + tests — frozen value algebra, metadata/options/rule validation, retained states and canonical values;
- `src/application/facts/venue-fact-service.ts` + tests — definition and retained-fact application boundaries with optimistic revision inputs and no observations/scoring behavior.

Infrastructure:

- `src/infrastructure/supabase/supabase-venue-fact-adapter.ts` + tests — project-scoped definition read and narrow mutation RPCs;
- `src/infrastructure/supabase/parse-venue-fact-row.ts` + tests — strict response revalidation for project/Venue/definition/value/revision boundaries;
- provider definition identity was hardened at commit `2ce0ef5ba578a14da461d8f8b7490599bc03eda8`, so a same-project response carrying the wrong requested definition ID fails closed.

Migrations/schema/security:

- `20260906183000_create_venue_fact_foundation.sql` — `fact_definitions` + `facts`, validation helpers/triggers, same-project FKs, RLS/grants and narrow `SECURITY DEFINER` mutation RPCs;
- `20260906194500_harden_venue_fact_rule_numeric_bounds.sql` — canonical numeric envelope hardening for rule thresholds;
- `20260906201500_harden_venue_fact_canonical_parity.sql` — TypeScript/PostgreSQL canonical parity hardening;
- helper/RPC functions use explicit schema qualification, safe `search_path`, revoked default execution and narrow authenticated grants where exposed.

Quality corrections made before the reviewed head:

- commit `3cc09fbd9702bd81b4f8cafe91f6d2f8bcc97a7c` removed an unused public export detected by Knip without changing numeric behavior;
- commit `e209d5d33ef2ec5c535121caf9e2e066012f4de8` removed unreachable validation fallbacks so measured branch coverage represents executable behavior rather than impossible defensive branches.

### Exact reviewed-head evidence

GitHub Actions run `34062811901` on `e209d5d33ef2ec5c535121caf9e2e066012f4de8`:

- **Core quality and security: SUCCESS**
  - **57 test files / 669 tests PASS**;
  - measured in-scope coverage **100% statements / branches / functions / lines**;
  - typecheck, static/architecture/Knip, quality/security negative controls, dependency gate and build PASS;
- **Local Supabase DB and RLS: SUCCESS**
  - **25 files / 553 pgTAP tests PASS** after full reset/migration application;
  - direct Facts RLS/RPC/same-project/system-defined/stale-write/value-shape evidence PASS;
- **Browser and mutation harnesses: SUCCESS**
  - **40/40 Playwright E2E PASS** across Chromium, Firefox, WebKit and mobile Chromium;
  - mutation harness PASS under the repository's configured threshold/scope;
- **Privacy-safe preview artifact: SUCCESS**;
- **Full verify from clean checkout: SUCCESS** with `npm run verify`.

Dependency audit still reports the previously reviewed two Moderate transitive development-tool advisories; no accepted-known Critical/High vulnerability is introduced by WP-2.3.

### Pass A exit gate

- [x] intended vertical slice exists
- [x] all 12 value types have positive and adversarial validation evidence
- [x] unknown/false/not-applicable/conflict distinctions directly tested
- [x] same-project/RLS/direct-RPC matrix green
- [x] system-defined semantic repurpose is denied
- [x] provider parsers fail closed against the Pass-A cases
- [x] exact-head CI is 5/5 green including clean-checkout `npm run verify`
- [x] no WP-2.4/WP-2.5 behavior leaked into packet
- [x] packet moved to `REVIEW_PENDING` for fresh Pass B

## Pass B — ADVERSARIAL REVIEW

Fresh adversarial review reconstructed the packet from the normative Facts, security, repository/service and error contracts rather than relying on Pass A conclusions.

### Findings

| Severity | Finding | Required remediation | State |
|---|---|---|---|
| MAJOR `WP2.3-B-001` | Numeric definition metadata can contradict the canonical value domain. `duration`/`distance` accept `integer:false` even though their retained representation is always an integer; integer-constrained number/rating/duration/distance definitions can also accept bounds whose interval contains no canonical safe integer, and default rating/non-negative quantity bounds can be made internally unsatisfiable. Such a definition can be accepted while no `known` retained value can ever satisfy it. | Make metadata validation type-aware in TypeScript and PostgreSQL; reject contradictory integer flags and bound sets that have no representable canonical value. Add parity/regression tests. | **OPEN** |
| MAJOR `WP2.3-B-002` | Multiselect canonical ordering is currently definition-order based while custom definition option order is mutable. Reordering otherwise identical options can therefore change the canonical order contract without re-canonicalizing existing retained facts, leaving stored canonical truth dependent on historical option order. | Move canonical multiselect retained values to stable key ordering independent of mutable display/definition order, with matching TS/PostgreSQL canonicalization and regression tests covering option reorder. | **OPEN** |
| MAJOR `WP2.3-B-003` | Bounded string validation is not fully parity-safe for Unicode: TypeScript `.length` counts UTF-16 code units while PostgreSQL `char_length` counts characters. Direct DB/RPC mutation can therefore accept a label/text/URL/metadata string that the TypeScript/provider boundary rejects later. | Use one explicit Unicode-code-point length rule in TypeScript matching PostgreSQL character semantics for all WP-2.3 bounded human/URL strings; add boundary tests at the exact limits. | **OPEN** |
| MAJOR `WP2.3-B-004` | PostgreSQL URL validation is regex-only and is not a guaranteed subset of the standards parser used by TypeScript. Concrete strings such as numeric-TLD/invalid-IDNA host forms can pass the SQL host regex while `new URL(...)` rejects them, allowing direct RPC persistence of a URL the provider parser cannot subsequently accept. | Freeze a conservative canonical external-host grammar that is demonstrably accepted by the standards parser, implement the same subset in SQL and TS, reject control-character ambiguity, and add exact regression/parity cases. | **OPEN** |
| MAJOR `WP2.3-B-005` | Application/provider failures collapse to generic `persistence_failed`; stale revision (`40001`), authorization/policy denial (`42501`), validation/integrity failures and network/backend failure are not distinguishable at the Facts service boundary despite the normative repository/error contract. DB safety prevents overwrite, but conflict/retry/auth handling cannot be correct above the adapter. | Introduce a scoped typed Facts persistence error taxonomy and safe provider-code mapping; preserve domain validation errors while distinguishing at least conflict, authorization/policy, backend-unavailable and data-integrity/provider-response failure. Add adapter/service tests without exposing raw backend errors. | **OPEN** |
| MINOR `WP2.3-B-006` | Two simultaneous first creates of the same retained Venue fact can race to the uniqueness constraint; the loser can surface as a constraint conflict rather than the same stale-revision path used after a row exists. The race is non-destructive and cannot overwrite newer truth. | Normalize the uniqueness result to the scoped conflict category while remediating B-005; no schema redesign required. | **OPEN** |
| MINOR `WP2.3-B-007` | Some normalized nested JSON values/rules retain mutable nested references. PostgreSQL revalidation prevents this from bypassing canonical cloud persistence in WP-2.3, and local/offline persistence is out of scope, but the normalized domain object is not deeply immutable at runtime. | Either copy/freeze nested canonical JSON in the scoped remediation or explicitly carry this into WP-2.10 local/offline hardening if no current mutation path remains. | **OPEN** |

### Review checks already completed

- [x] all 12 value types attacked beyond happy paths
- [x] explicit state/sentinel behavior reviewed
- [x] definition options and evaluation-rule structure attacked
- [x] stale revision and first-create concurrency semantics reviewed
- [x] cross-project/RLS/direct-RPC/grant/`SECURITY DEFINER` boundaries reviewed
- [x] system-defined repurpose boundary reviewed
- [x] provider identity/shape revalidation reviewed
- [x] TypeScript/PostgreSQL canonical parity attacked rather than inferred from coverage
- [x] error/retry/conflict contract reviewed
- [x] WP-2.4/WP-2.5 leakage reviewed

Pass B decision: **FAIL — unresolved MAJOR findings exist.** Per `AI-LOT-ORCHESTRATION.md`, packet state is `REVIEW_FAILED`; remediation is the only permitted next action. Any affected verification must be rerun before a new fresh Pass B.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires a later fresh Pass B PASS with no unresolved BLOCKING/MAJOR finding.

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| definitions | project-scoped typed Venue definition metadata and protected system semantics | Pass-A implementation above | exact-head CI + unit/provider + pgTAP | **REVIEW FAILED — B-001** |
| retained states | explicit known/unknown/not_applicable/conflict with no sentinel collapse | retained-fact domain/service + DB command | unit + pgTAP state/value tests | pending remediation/re-review |
| typed values | all frozen V1 value shapes/bounds validated before persistence | TS normalizers + PostgreSQL validators | Pass-A unit/pgTAP | **REVIEW FAILED — B-002/B-003/B-004** |
| same-project/authz | Venue target+definition integrity and inherited venue permissions | same-project FK/RLS/RPC | direct security matrix | PASS in reviewed scope; reverify after remediation |
| architecture | domain/application/provider boundaries with fail-closed parsing | ports/services/adapters/parsers | static gates + malformed provider tests | **REVIEW FAILED — B-005** |

Final packet decision: `REVIEW_FAILED`.

## Handoff

- Current state: `REVIEW_FAILED`
- Current/next pass: **remediation of `WP2.3-B-001..005` MAJOR findings plus scoped MINOR fixes**
- Accepted prerequisites: `WP-2.1`, `WP-2.2`
- Reviewed Pass-A implementation head: `e209d5d33ef2ec5c535121caf9e2e066012f4de8`
- Pass-A verification invalidated for acceptance by fresh Pass-B findings; historical run `34062811901` remains recorded as the pre-review 5/5 baseline
- Open WP-2.3 BLOCKING/MAJOR findings: `WP2.3-B-001`, `WP2.3-B-002`, `WP2.3-B-003`, `WP2.3-B-004`, `WP2.3-B-005`
- Open MINOR findings: `WP2.3-B-006`, `WP2.3-B-007`
- Recorded downstream spec stop-condition: before WP-2.5 executes/seeds `custom_manual_assessment`, freeze its configured acceptable-value representation; do not invent it in WP-2.3
- Next permitted action: **transition to `IN_PROGRESS` when remediation begins, fix WP-2.3 findings only, rerun exact-head verification, then perform a new fresh Pass B; do not start WP-2.4**
