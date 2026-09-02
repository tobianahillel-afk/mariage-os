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
- confidence/verification level;
- importer/manual origin;
- author/import session;
- superseded status if applicable.

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

Source type does not alone determine truth; freshness and context also matter.

## Source entity

A source may carry:

- title;
- type;
- URL where applicable;
- document/media link where applicable;
- interaction/contact link;
- retrieval/observation date;
- notes;
- status: active, broken, superseded, archived, contradictory.

## Many-to-many support

A fact observation can cite multiple sources. One source can support multiple facts.

## Reliability hierarchy

Default operational preference, subject to context:

1. signed contract / contractual document;
2. direct written confirmation for the specific event;
3. current quote/proposal;
4. current official venue/vendor documentation;
5. in-person observation/measurement;
6. reputable specialist directory;
7. other third-party source;
8. unsourced estimate/import.

This hierarchy is guidance for conflict resolution, not an irreversible automatic rule.

## Conflicting evidence

When observations conflict:

- preserve all relevant observations;
- mark fact as conflict if no safe retained value exists;
- allow a retained-value decision with rationale;
- prefer explicit current/contractual evidence where justified;
- optionally generate a `verify` task for critical conflicts.

## Manual confirmation

A couple member may mark a retained value based on direct contact. The interaction/source should be linkable, e.g.:

> phone call with venue contact, 10 Sep 2026.

## Source expiry/broken links

A broken external URL does not delete the historical observation. It changes source health/state.

## Imports

Canonical imports may provide both the normalized fact and its primary source metadata. If no source exists, the imported value remains lower-confidence by default.

## UI

The normal summary may show:

`External caterer: Yes · Confirmed · Source`

Detailed view exposes all observations and provenance.

## Tests

Test conflicting sources, supersession, weaker import against stronger retained evidence, broken source URL state, multi-source facts and unknown/false distinction.
