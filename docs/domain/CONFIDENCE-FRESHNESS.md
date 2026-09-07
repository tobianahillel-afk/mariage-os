# Evidence, Confidence and Freshness

## Purpose

A fact can be strongly sourced yet old, weakly sourced yet plausible, or current but uncertain. Mariage OS therefore keeps three independent axes for factual observations:

- `evidence_level` — the normalized strength/context class of the evidence supporting an observation or represented by a source;
- `confidence` — the explicit certainty assessment attached to an observation: `high`, `medium`, `low` or `unknown`;
- freshness — whether the evidence is still timely enough for the current decision/context.

These axes must not be collapsed into one field. WP-2.4 must not derive one automatically from another unless a later frozen deterministic rule explicitly says so.

## Evidence levels

Initial normalized `evidence_level` keys, ordered as an operational preference subject to context:

- `contractual` — explicitly guaranteed in a signed/accepted contractual document;
- `confirmed_for_event` — directly confirmed for the couple's event/date/configuration in writing or another recorded interaction;
- `official_general` — stated by the official venue/vendor but not specifically guaranteed for the event;
- `observed` — verified by the couple in person or by direct measurement;
- `third_party` — supported by a reputable external directory/public third party;
- `estimated` — reasoned estimate or inference without stronger supporting evidence;
- `unknown_source` — imported/entered without adequate provenance.

`evidence_level` is not the same thing as `source_type`. `source_type` preserves the more detailed provenance class required by the Facts contract, such as `contract`, `written_confirmation`, `quote`, `official_website`, `phone_call_note`, `in_person_visit`, `specialized_directory`, `public_third_party`, `user_estimate` or `import_without_primary_source`. Several source types can legitimately map to the same evidence level depending on event specificity and context.

For example, a quote written specifically for the selected date may justify `confirmed_for_event`, while a generic published tariff may remain `official_general`. A recorded phone call can support an event-specific observation without becoming a written-confirmation source type.

## Source versus observation evidence level

The physical schema deliberately carries `evidence_level` on both `sources` and `fact_observations`.

- `sources.evidence_level` classifies that source's evidence strength/context.
- `fact_observations.evidence_level` classifies the evidence actually supporting that observation.

An observation can cite multiple sources. WP-2.4 must preserve those source links and the explicit observation-level classification. It must not silently compute observation evidence level from the strongest linked source unless a deterministic rule is separately frozen and tested.

## Confidence

`fact_observations.confidence` has exactly these V1 values:

- `high` — the observation is assessed with strong certainty for its stated value and context;
- `medium` — the observation is credible but has material uncertainty;
- `low` — the observation is tentative, approximate or otherwise materially uncertain;
- `unknown` — certainty was not assessed or cannot be justified from the available information.

Confidence is an assessment of certainty, not a synonym for provenance strength and not a replacement for evidence level.

Examples of valid independent combinations include:

- `evidence_level=contractual`, `confidence=high`;
- `evidence_level=official_general`, `confidence=high` for what the official page actually states, while its applicability to the couple's exact event remains general;
- `evidence_level=observed`, `confidence=medium` where a direct measurement was approximate;
- `evidence_level=estimated`, `confidence=low`;
- any evidence level with `confidence=unknown` when no explicit certainty assessment is available.

`confidence=unknown` means the observation's certainty is unknown. It does **not** mean the fact's retained value/state is `unknown`. Likewise `evidence_level=unknown_source` describes provenance quality, not the semantic fact state.

## No implicit derivation

For WP-2.4:

- source type does not automatically determine evidence level;
- evidence level does not automatically determine confidence;
- confidence does not automatically determine retained fact state;
- freshness does not automatically change a value from true to false;
- a stale observation is not automatically low-confidence;
- an unknown-confidence observation is not automatically stale;
- a stronger evidence level is a conflict-resolution input, not permission to destroy weaker historical evidence.

Later deterministic conflict/readiness logic may consume these axes, but it must be frozen in its owning contract before implementation.

## Freshness policies

Fact definitions may specify a default revalidation interval/class.

Suggested classes:

- `stable` — structural facts such as room dimensions unless renovation occurs;
- `annual` — general packages/services likely to change seasonally;
- `six_months`;
- `three_months` — pricing/general commercial rules;
- `thirty_days` — availability-sensitive planning facts;
- `real_time` — availability/options/holds where old data becomes unreliable quickly;
- `manual` — revalidation determined case-by-case.

## Freshness status

At runtime a fact/observation can be:

- fresh;
- aging;
- stale;
- unknown freshness.

Stale does not mean false. It means “revalidate before relying on this for the next critical decision.” Freshness is independent from evidence level and confidence.

## Event-specific confirmation

Before contract/signature, certain blocking facts should preferably move from general evidence toward event-specific or contractual evidence where available.

Examples:

- external caterer accepted for the specific event;
- exact music curfew;
- capacity/configuration restrictions;
- chosen date availability;
- included furniture;
- pricing/package.

This changes the evidence context; it does not require an automatic confidence rewrite.

## Oral-only risk

The system should be able to surface important retained facts whose strongest linked evidence is only a phone-call note or oral statement.

Example pre-contract warning:

> 3 important conditions are only orally confirmed.

The detailed `source_type` makes that warning possible even when the observation has an event-specific evidence level.

## Staleness after decision changes

Changing the intended wedding date or guest count may invalidate the applicability of previously adequate commercial information even if the source itself is recent.

Dependency rules should mark affected facts/scenarios `revalidation_needed` rather than silently changing evidence level, confidence or retained truth.

## UI

Summary examples may combine evidence context, freshness and confidence without conflating them:

- `Contractual · high confidence · 12 Sep 2026`;
- `Confirmed for our event · 8 Sep 2026`;
- `Official source · revalidate before booking`;
- `Estimate · low confidence · not confirmed`;
- `Conflicting sources`.

## Alerts

Do not create noisy alerts for every old stable fact. Freshness warnings should prioritize facts that matter to an active decision/phase.

## Imports

Imported observations inherit supplied evidence/confidence metadata only when the import contract/source is trusted to carry those semantics. Otherwise provenance defaults conservatively, e.g. `evidence_level=unknown_source`, and `confidence=unknown` unless an explicit assessment is provided. Import must not fabricate stronger evidence or confidence.

## Tests

Required WP-2.4 evidence includes:

- evidence-level values remain distinct from `source_type` and `confidence`;
- `confidence` accepts only `high|medium|low|unknown`;
- no implicit evidence-level→confidence derivation;
- stale-but-valid evidence remains historical evidence;
- critical stale-data revalidation behavior;
- changed wedding context can require revalidation without rewriting historical evidence/confidence;
- imports lacking trusted source metadata do not gain stronger evidence/confidence;
- conflicting observations retain their separate evidence, confidence, sources and history.
