# Data Dictionary Rules

Status: **Normative V1 field-semantics convention**

The physical schema is implemented through migrations, but every field/DTO/import property follows these conventions unless a more specific normative contract deliberately overrides it.

## Every field specification defines as applicable

- stable technical name;
- localized user label;
- owning entity/domain;
- data type/value shape;
- semantic meaning;
- unit/format;
- required/nullable/missing behavior;
- default only when semantically safe;
- validation constraints;
- source classification: user-entered/imported/observed/derived/system;
- confidentiality class;
- freshness/evidence policy;
- import/export mapping;
- index/query needs;
- lifecycle/invariant/authorization constraints.

## Missing, null, unknown and empty are distinct

Do **not** use a global rule `null = unknown`.

### Canonical/import object property missing
Means the producer supplied **no opinion/change** for that property. Ordinary merge leaves existing value unchanged.

### `null`
Means explicit absence **only when that field's schema defines nullable absence semantics**. It does not universally mean unknown, delete or reset.

### Fact `unknown`
A known criterion/fact exists but its current value is unknown. Represent through fact state, not an arbitrary `null` convention.

### Empty string/array
A valid empty value only where field semantics allow it. Never silently substitute for unknown/deleted state.

### `false` / `0`
Real known values, never unknown sentinels.

These rules must align with canonical JSON import semantics and forms.

## Enumerations/codes

Stored codes are centrally defined/versioned/documented. Localized labels may change without changing machine value.

No new semantic status is invented from UI wording alone.

## Text

Text fields define reasonable lengths at DB/schema/form boundaries. Long notes are separated from labels/IDs where useful.

User-controlled text is data, never executable HTML. Normalization must not silently destroy meaningful names/accents.

## Numbers

Every number defines unit/domain constraints, e.g.:

- area: decimal m² >= 0 or >0 according to field;
- capacity: integer >=0;
- probability: decimal [0,1];
- rating: defined range, e.g. [0,10];
- day offset: bounded integer;
- quantity: exact decimal where fractional unit is meaningful.

Do not attach one ambiguous raw numeric field to values with different units.

## Money

V1 authoritative money is **integer minor units (`bigint`/safe exact integer abstraction) + explicit ISO currency** as frozen in `MONEY.md` and physical schema.

JavaScript binary floating-point decimal currency is never authoritative. Display decimal strings are formatting only.

## Taxes

Commercial amounts that require tax semantics distinguish `included`, `excluded`, `unknown`, `not_applicable`. Unknown tax treatment is not guessed.

## Dates/times

Date-only, local time, local time + day offset and absolute timestamp are different semantic types. See `DATES-TIME.md`.

Weekday integer V1 mapping is 0=Sunday ... 6=Saturday.

## IDs

- internal entity ID = stable UUID;
- human code such as `S32` = user-facing identifier, not PK;
- import external ID = source-namespace identity governed by `IDENTIFIERS.md`/canonical contract;
- nested external IDs can be parent-scoped;
- hashes identify content/inputs, not user/domain identity unless explicitly specified.

## Project ownership metadata

Project-owned relational rows contain/validate `project_id` according to physical schema. Parent-child project ownership cannot be inferred solely from client payload.

Collaborative rows generally expose:

- ID/project ID;
- created/updated timestamp/actor;
- revision/concurrency token;
- soft-delete metadata where applicable.

System-managed fields are protected from arbitrary client update.

## Confidentiality classes

Use privacy/security classes such as:

- `PUBLIC_REFERENCE`;
- `PRIVATE_PROJECT`;
- `PERSONAL`;
- `FINANCIAL`;
- `SENSITIVE_DOCUMENT`.

Examples:

- official venue URL = public reference;
- couple rating/note = private project;
- guest phone/address = personal;
- payment amount = financial;
- signed contract = sensitive document.

Classification affects export/log/cache/external-request behavior, not only visual labeling.

## Source vs derived

A derived value specifies inputs/recalculation/invalidation and is not independently editable truth.

Examples:

- remaining contractual balance;
- expected guest attendance;
- compatibility output;
- milestone progress;
- seating readiness;
- next action.

If cached, dependency/version metadata must allow safe invalidation/rebuild.

## Sourceable facts

Important variable factual attributes use the facts/evidence subsystem when appropriate, supporting:

- semantic state;
- typed retained value;
- multiple observations;
- multiple sources per observation;
- detailed source type/provenance;
- normalized `evidence_level` describing evidence strength/context;
- separate observation `confidence` in `high|medium|low|unknown`;
- freshness/revalidation semantics;
- conflict/history.

For facts, `evidence_level`, `confidence`, freshness and semantic state are distinct fields/concepts. No implementation may silently derive confidence from evidence level, convert stale to false, or treat `confidence=unknown` / `evidence_level=unknown_source` as fact state `unknown`. See `FACTS-SOURCES.md` and `CONFIDENCE-FRESHNESS.md`.

A broken source never converts a known historical observation into “never existed”.

## Personal opinions

Member ratings/preferences are member-scoped opinion data, not shared fact values. One member cannot overwrite another's opinion.

## Import/export machine names

Canonical JSON property names use documented camelCase schema; stable domain/criterion keys use their defined machine convention (commonly snake_case). CSV/XLSX labels can be localized/mapped.

Do not infer that every DB snake_case column is automatically a public canonical JSON field.

## Schema/semantic change rule

Changing field meaning/type/null semantics/units/status interpretation is a migration/compatibility event and requires governing documentation + tests. Reusing an old name for a new semantic meaning is forbidden.
