# Initial Wedding Data Migration Plan

## Objective

Move existing wedding research and spreadsheets into Mariage OS without losing history, duplicating people/venues or treating conversation summaries as stronger evidence than primary sources.

## Known source classes

### Venue research

Existing project conversations contain:

- S/P human codes;
- keep/reject/reserve decisions;
- private couple comments;
- verified public facts/sources;
- candidate photos/URLs;
- reasons for rejection.

Migration should produce structured venue entities while preserving uncertainty/provenance.

### Guest workbook

Existing XLSX contains guest groups, priorities, probabilities, household/conjoint/children information and calculated statistics.

The workbook is a key source for the initial guest import.

### Caterer/vendor research

Existing research contains candidate names, public/contact data, price/inclusion research and private assessments.

## Migration order

1. Freeze/document source files/conversation extracts used for migration.
2. Build synthetic importer tests using equivalent structures.
3. Import venues into a nonproduction/demo project.
4. Reconcile codes/names/statuses/duplicates.
5. Import guest workbook into nonproduction project.
6. Compare all expected counts/statistics against legacy workbook.
7. Import vendor/caterer data.
8. Validate sources/confidence and private/public classification.
9. Review with couple.
10. Import into production project.
11. Generate verified backup.
12. Declare cutover only after acceptance.

## Venue precedence

For conflicts:

- latest explicit couple decision controls current keep/reject/reserve status;
- public facts should prefer current primary/official evidence when available;
- old assistant estimates remain estimates unless verified;
- rejection reasons/private comments remain private project notes.

## Human codes

Preserve existing S/P codes exactly where the same venue identity is established.

Do not reuse deleted/rejected codes for unrelated venues.

## Guest verification

After import compare at minimum:

- number of guest records;
- households;
- category/group counts;
- priority distribution;
- probability values;
- cumulative 1 / 1+2 / 1+2+3 / etc.;
- expected attendance total;
- explicitly known spouse/child exceptions.

Any mismatch blocks production cutover until explained.

## Duplicates

Venue and guest deduplication follows documented conservative policy. Names alone do not justify automatic guest merge.

## Private data

Real migration artifacts do not enter GitHub. Public repository may contain only synthetic equivalents/templates.

## Legacy archive

After cutover, retain original Excel/source exports as read-only historical files outside GitHub so recovery/comparison remains possible.

## Cutover rule

Until the cutover checklist is signed off, Mariage OS is not the sole authoritative operational source and legacy files must not be discarded.
