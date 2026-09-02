# Import Mapping

## Goal

Recognize familiar files without forcing users to rename every column, while keeping ambiguity visible and controllable.

## Detection sources

Mapping engine may use deterministic signals:

- normalized column header;
- synonyms;
- sheet name;
- observed value type/pattern;
- known saved mapping profile;
- canonical schema markers.

Core V1 mapping must not require an external AI API.

## Header normalization

Normalize for matching only:

- trim whitespace;
- case fold;
- normalize accents/punctuation where appropriate;
- common unit suffix recognition.

Never mutate the raw source value used for audit/preview.

## Synonym examples

Capacity mapping candidates:

- capacity
- capacité
- nb personnes
- nombre personnes
- pax
- guests

Area candidates:

- surface
- m2
- m²
- area

Probability candidates:

- probability
- probabilité
- chance
- % venue

## Confidence

Mapping proposal has confidence:

- certain: canonical exact header/profile;
- high;
- medium;
- unknown.

Only certain/high unambiguous mappings may be auto-selected; the user can review/correct before apply.

## Saved mapping profiles

After user validates a recurring spreadsheet structure, save a mapping profile scoped to project/user/template signature.

Example:

`Guest Excel Hillel v2`

A future import with compatible headers applies the profile automatically but still previews changes.

## Type parsing

Mapping is followed by type parsing.

Recognize:

- French money/numbers;
- percentages;
- booleans `oui/non`, `yes/no`, `1/0` only where unambiguous;
- dates with locale context;
- URLs;
- status/category mappings.

## New categories/definitions

Unknown category values are not silently proliferated.

Preview offers:

- map to existing close value;
- create new value;
- leave unmapped/error.

## Ambiguity

If a column could reasonably map to multiple fields, require review.

Example: `Note` could mean private note text or rating. Value distribution may suggest but cannot silently decide with low confidence.

## Unmapped columns

Users may:

- ignore;
- map to existing field;
- create supported custom field/definition where permitted.

## Mapping preview

Show sample values and target semantics, not just field names.

## Tests

Include French/English headers, accents, aliases, saved profiles, reordered columns, new/removed columns, ambiguous `note/date/value`, unit suffixes and category typo detection.
