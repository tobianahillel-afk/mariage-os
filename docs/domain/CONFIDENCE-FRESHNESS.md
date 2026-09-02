# Confidence and Freshness

## Purpose

A fact can be correctly sourced yet too old, estimated, or insufficiently specific to the couple's actual event. Mariage OS therefore treats confidence and freshness separately.

## Confidence levels

Initial normalized levels:

- `contractual` — explicitly guaranteed in a signed/accepted contractual document;
- `confirmed_for_event` — directly confirmed in writing or recorded interaction for the couple's event/date/configuration;
- `official_general` — stated by the official venue/vendor but not specifically guaranteed for the event;
- `observed` — verified by the couple in person/measurement;
- `third_party` — reputable external directory/source;
- `estimated` — reasoned estimate/inference;
- `unknown_source` — imported/entered without adequate provenance.

Confidence is not equivalent to freshness.

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

At runtime a fact can be:

- fresh;
- aging;
- stale;
- unknown freshness.

Stale does not mean false. It means “revalidate before relying on this for the next critical decision.”

## Event-specific confirmation

Before contract/signature, certain blocking facts should preferably be elevated from official-general to confirmed-for-event or contractual.

Examples:

- external caterer accepted for the specific event;
- exact music curfew;
- capacity/configuration restrictions;
- chosen date availability;
- included furniture;
- pricing/package.

## Oral-only risk

The system should be able to surface important retained facts whose strongest evidence is only a phone-call note or oral statement.

Example pre-contract warning:

> 3 important conditions are only orally confirmed.

## Staleness after decision changes

Changing the intended wedding date or guest count may invalidate/reduce confidence in previously adequate commercial information even if the source itself is recent.

The dependency rules should mark affected facts/scenarios `revalidation_needed` rather than silently assuming continued applicability.

## UI

Summary examples:

- `Contractual · 12 Sep 2026`
- `Confirmed for our event · 8 Sep 2026`
- `Official source · revalidate before booking`
- `Estimate · not confirmed`
- `Conflicting sources`

## Alerts

Do not create noisy alerts for every old stable fact. Freshness warnings should prioritize facts that matter to an active decision/phase.

## Imports

Imported values inherit provided verification metadata only if the format/source is trusted to carry it. Otherwise they default to an appropriate lower confidence.

## Tests

Test confidence ordering, stale-but-valid display, critical stale-data warnings, changed wedding date invalidating offer relevance and imports lacking source metadata.
