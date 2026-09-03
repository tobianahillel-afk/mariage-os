# Import / Export Feature Contract

## Product principle

Existing structured data should never require manual re-entry. Imports must be safer than bulk manual editing.

## Entry points

Import Center supports:

- CSV;
- XLSX;
- canonical Mariage OS JSON;
- `.mariage` backup/restore;
- paste tabular data;
- paste canonical JSON;
- media/document batches.

## Import workflow

No supported structured import writes immediately to production state.

Canonical workflow:

1. Select/input
2. Detect format/domain
3. Parse locally where practical
4. Infer/map fields
5. Validate types/constraints
6. Detect duplicates/existing entities
7. Detect conflicts/protected changes
8. Preview exact operations
9. User confirms
10. Apply transactionally where required
11. Record import history/provenance
12. Show result/rollback availability

## Import modes

### Smart merge (default)

Create missing entities, update safe values, preserve unrelated fields, never delete by omission.

### Create only

Existing matched entities remain untouched.

### Complete unknowns only

Fill unknown/missing facts but do not replace existing retained values.

### Controlled replace

Advanced explicit operation restricted to selected fields/scope with stronger preview/confirmation.

## Protected information

Imports cannot silently modify high-impact/locked states such as:

- confirmed selected venue/vendor;
- signed-contract state;
- actual paid payment;
- final joint decision;
- membership/owner permissions;
- contractual fact with weaker imported evidence.

## Duplicate safety

Exact canonical re-import is idempotent via external IDs/file hashes/operation semantics.

## Preview

Summary groups:

- unchanged;
- create;
- update;
- conflict;
- error;
- protected change;
- new categories/definitions.

Users can inspect field-level diff before applying.

## Rollback

Applied imports keep enough operation history to roll back safely. Rollback must not overwrite newer unrelated user edits blindly.

## Export

Each major module supports open formats where meaningful:

- CSV for simple tabular data;
- XLSX for human-friendly richer workbook;
- canonical JSON for complete fidelity;
- `.mariage` for project recovery;
- print/PDF-like browser output where human distribution is needed.

## “Export missing data”

A critical workflow for venue/vendor research:

- export only missing/stale/conflicting facts needing research;
- external researcher/ChatGPT can return canonical completed JSON;
- preview/merge back into project with sources.

## Privacy

Raw files parse locally where feasible. Original input is not uploaded to cloud unless the user explicitly chooses to retain it as a document.

## Acceptance criteria

- same canonical file imported twice creates no duplicates;
- missing input rows do not delete existing data;
- weaker source cannot silently downgrade contractual retained fact;
- conflicts are reviewable;
- invalid rows cannot corrupt unrelated data;
- rollback works according to documented policy;
- canonical JSON round-trip is semantically lossless;
- no macros/active content executed;
- import history identifies file/hash/user/time/mapping/result.
