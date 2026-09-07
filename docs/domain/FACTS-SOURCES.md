# Facts, Observations and Sources

## Goal

Mariage OS must distinguish what the couple believes is currently true from the evidence that produced that belief.

## Fact definition

A fact is a typed, sourceable attribute about an entity.

Examples:

- venue external caterer allowed;
- venue reception-room area;
- music end time;
- air conditioning;
- vendor servers included;
- parking capacity;
- accessibility assessment.

## Fact state

A fact has one of these semantic states:

- `known`;
- `unknown`;
- `not_applicable`;
- `conflict`.

For boolean facts, `known + false` is different from `unknown`.

## Retained value

The system may expose one current retained value for operational use, but it may preserve multiple observations underneath.

Example:

```text
retained area = 300 m²

observations:
- official website: 300 m²
- specialist directory: 250 m²
- commercial email: 300 m²
```

## Observation

An observation records:

- normalized value;
- optional raw value/text;
- observed/verified date;
- source(s);
- `evidence_level`, describing the normalized strength/context class of the evidence supporting the observation;
- `confidence`, separately describing certainty as `high`, `medium`, `low` or `unknown`;
- importer/manual origin;
- author/import session;
- superseded status if applicable.

`evidence_level`, `confidence`, freshness and fact semantic state are separate axes. In particular:

- `confidence=unknown` does not mean fact state `unknown`;
- `evidence_level=unknown_source` does not mean fact state `unknown`;
- stale does not mean false;
- evidence level must not silently determine confidence.

The detailed semantics and evidence-level keys are frozen in `CONFIDENCE-FRESHNESS.md`.

## Source types

Canonical initial source types:

- `contract`;
- `written_confirmation`;
- `quote`;
- `official_website`;
- `phone_call_note`;
- `in_person_visit`;
- `specialized_directory`;
- `public_third_party`;
- `user_estimate`;
- `import_without_primary_source`.

Source type does not alone determine truth, evidence level or confidence; freshness and context also matter.

## Source entity

A source may carry:

- title;
- type;
- URL where applicable;
- document/media link where applicable;
- interaction/contact link;
- retrieval/observation date;
- `evidence_level` for the source's normalized strength/context class;
- notes;
- status: active, broken, superseded, archived, contradictory.

`source_type` preserves detailed provenance class. `evidence_level` is a separate normalized hierarchy/context key and is not a replacement for source type.

## Many-to-many support

A fact observation can cite multiple sources. One source can support multiple facts.

Because an observation may cite multiple sources, `fact_observations.evidence_level` records the explicit evidence classification supporting that observation while each source retains its own `sources.evidence_level`. WP-2.4 must not silently derive the observation level from the strongest linked source unless a deterministic rule is separately frozen and tested.

## Reliability hierarchy

Default operational preference, subject to context:

1. signed contract / contractual document;
2. direct written or recorded confirmation for the specific event;
3. current quote/proposal;
4. current official venue/vendor documentation;
5. in-person observation/measurement;
6. reputable specialist directory;
7. other third-party source;
8. unsourced estimate/import.

This hierarchy guides evidence classification/conflict resolution. It is not an irreversible automatic winner rule and does not imply a fixed `confidence` value.

The normalized evidence levels used by the schema are documented in `CONFIDENCE-FRESHNESS.md`: `contractual`, `confirmed_for_event`, `official_general`, `observed`, `third_party`, `estimated`, `unknown_source`.

## Conflicting evidence

When observations conflict:

- preserve all relevant observations;
- preserve each observation's source links, evidence level, confidence and timestamp;
- mark fact as conflict if no safe retained value exists;
- allow a retained-value decision with rationale under the owning conflict-resolution workflow;
- prefer explicit current/contractual evidence where justified;
- do not destroy weaker historical evidence merely because stronger evidence exists;
- optionally generate a `verify` task for critical conflicts in the owning Tasks workflow.

## Manual confirmation

A couple member may mark a retained value based on direct contact. The interaction/source should be linkable, e.g.:

> phone call with venue contact, 10 Sep 2026.

The source type, evidence level and confidence remain separately representable.

## Source expiry/broken links

A broken external URL does not delete the historical observation. It changes source health/state.

## Imports

Canonical imports may provide both the normalized fact and its primary source metadata. Imported evidence/confidence metadata is trusted only when the import contract/source is trusted to carry those semantics. Otherwise the observation remains conservatively classified, e.g. `evidence_level=unknown_source` and `confidence=unknown`, rather than fabricating stronger provenance/certainty.

## UI

The normal summary may show:

`External caterer: Yes · Confirmed for event · high confidence · Source`

Detailed view exposes all observations, source types, evidence levels, confidence, freshness and provenance.

## Tests

Test conflicting sources, supersession, weaker import against stronger retained evidence, broken source URL state, multi-source facts, unknown/false distinction, evidence-level/confidence independence, conservative import defaults and preservation of provenance/history.
