# WP-2.3 — Fact definitions, typed retained facts and value validation

## Identity

- Work Packet ID: `WP-2.3`
- Lot: `2`
- Name: Fact definitions, typed retained facts and value validation
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: `facts` for Venue targets
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Dependencies: `WP-2.1 ACCEPTED`, `WP-2.2 ACCEPTED`
- WP-2.2 governance gate: run `34048565452` on `480b0bcc168d7789bf2bee07a75c8f04200f5cb7` — **5/5 SUCCESS**, clean-checkout `npm run verify` PASS

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

## Evaluation-rule storage boundary

`fact_definitions.evaluation_rule_json` is part of the frozen physical schema. WP-2.3 validates storage shape for supported V1 rule types from `CRITERIA-EVALUATION.md` and rejects unsupported/incompatible rules. It does **not** execute those rules.

Supported storage shapes include boolean equality, numeric min/max/range, rating minimum, select in/not-in, time at-or-after/before, money max, project target guest count and custom manual assessment. WP-2.5 owns actual deterministic evaluation and the still-recorded `evidenceReadiness` stop-condition.

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

Implementation evidence: **not started at packet opening**.

### Pass A exit gate

- [ ] intended vertical slice exists
- [ ] all 12 value types have positive and adversarial validation evidence
- [ ] unknown/false/not-applicable/conflict distinctions directly tested
- [ ] same-project/RLS/direct-RPC matrix green
- [ ] system-defined semantic repurpose is denied
- [ ] provider parsers fail closed
- [ ] exact-head CI is 5/5 green including clean-checkout `npm run verify`
- [ ] no WP-2.4/WP-2.5 behavior leaked into packet
- [ ] packet moved to fresh Pass B

## Pass B — ADVERSARIAL REVIEW

Not started. Fresh review after Pass-A exact-head verification will attack at least:

- malformed JSON and wrong value type;
- `unknown` disguised as null/false/string sentinel;
- non-finite/out-of-bound/integer violations;
- money float/lowercase/bad currency/unsafe integer;
- date/time/day-offset invalid calendar/clock values;
- unsafe URL schemes;
- select unknown option and multiselect duplicates/order instability;
- definition metadata/rule mismatch;
- system-defined key/type/rule repurpose;
- stale retained-fact/definition overwrite;
- project-B Venue/definition injection;
- viewer/outsider/revoked/anon mutation/read leakage;
- client audit/revision/project identity spoofing;
- premature observation/evidence/scoring behavior.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started. Entry requires fresh Pass B PASS with no unresolved BLOCKING/MAJOR finding.

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| definitions | project-scoped typed Venue definition metadata and protected system semantics | pending | pending | pending |
| retained states | explicit known/unknown/not_applicable/conflict with no sentinel collapse | pending | pending | pending |
| typed values | all frozen V1 value shapes/bounds validated before persistence | pending | pending | pending |
| same-project/authz | Venue target+definition integrity and inherited venue permissions | pending | pending | pending |
| architecture | domain/application/provider boundaries with fail-closed parsing | pending | pending | pending |

Final packet decision: `IN_PROGRESS`.

## Handoff

- Current state: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Accepted prerequisites: `WP-2.1`, `WP-2.2`
- WP-2.2 governance CI: `34048565452` — 5/5 SUCCESS
- Open WP-2.3 BLOCKING/MAJOR findings: none yet; Pass B not started
- Next permitted action: implement WP-2.3 only; do not start WP-2.4 concurrently
