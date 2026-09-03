# Duplicate Detection

## Principle

Duplicate detection should be aggressive at warning and conservative at automatic merging.

## Match levels

### Certain

Safe for automatic match in normal circumstances:

- same namespaced `external_id`;
- same canonical internal ID in trusted Mariage OS export;
- exact file hash for binary duplicate.

### Very strong

Usually match but still preview:

- same official website/domain plus compatible venue/vendor identity;
- same unique phone/email plus compatible entity type.

### Strong/possible

Require human confirmation:

- normalized name + same city/address;
- highly similar venue name + same coordinates;
- guest full name + same household/context.

### Weak

Never auto-merge:

- same common human name only;
- similar vendor name without location/contact;
- approximate text similarity alone.

## Venue aliases

Support aliases/previous names so `Domaine X` and a known former/canonical name can resolve without creating repeated candidates.

## Guest safety

Same-name guests are common. Guest auto-merge requires stronger identity/context such as external ID or uniquely matching contact/household evidence.

## File deduplication

Use SHA-256 for exact binary duplicate detection.

Do not infer semantic duplicate from filename alone.

## Duplicate review UI

Show side-by-side:

- existing entity key fields;
- incoming fields;
- match reasons/confidence;
- choices: merge, create separately, ignore, mark not duplicate.

Allow bulk application only for genuinely homogeneous/high-confidence cases.

## Duplicate memory

If user explicitly marks two similar entities as `not duplicate`, store enough matching exception/context to avoid repeatedly asking for the same pair where practical.

## Entity merge

When merging true duplicates:

- choose retained canonical entity;
- migrate relationships safely;
- preserve aliases/external IDs;
- deduplicate identical links/files;
- preserve conflicting facts as observations;
- record merge history;
- soft-delete/redirect old duplicate as appropriate.

## Tests

Test S32-like alias case, same-name guests, exact external ID, same website, false positive names, file hashes and merged relationship integrity.
