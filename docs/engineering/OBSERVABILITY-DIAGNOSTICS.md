# Observability and Diagnostics

Status: **Normative operational contract**

Mariage OS intentionally avoids behavioral tracking/analytics. Diagnostics exist to understand correctness, synchronization and recovery without turning private wedding data into telemetry.

## No silent tracking

V1 must not include Google Analytics, Meta Pixel, Hotjar or equivalent behavioral tracking by default.

## Diagnostics screen

Settings/Diagnostics should be able to show safe operational metadata such as:

- app version/build;
- supported/current schema version;
- local DB version;
- authenticated project/member identifier in truncated/non-sensitive form;
- cloud connectivity status;
- last successful sync timestamp;
- pending mutation count;
- conflict count;
- last backup timestamp recorded by app;
- approximate local cache/storage usage;
- cloud storage usage when safely available;
- service-worker/PWA status;
- number of entities/media/documents by broad category;
- recent safe error IDs.

## Diagnostic export

A user can voluntarily export a diagnostic report for troubleshooting.

The report must exclude by default:

- guest names/contact information;
- note/document contents;
- budgets/financial amounts unless explicitly required and redacted;
- access/refresh tokens;
- Supabase secrets;
- signed storage URLs;
- raw uploaded files;
- precise personal addresses.

It may include:

- versions;
- browser/OS family;
- feature-support flags;
- operation/error IDs;
- counts;
- schema compatibility;
- sync queue metadata without private payload content.

## Operation IDs

Important asynchronous operations such as imports, sync mutations, uploads and restore jobs receive unique operation IDs so a user-facing failure can be correlated with safe diagnostic state.

## Audit vs diagnostics

- **Audit/activity history** answers who changed project state and why/what changed in human/business terms.
- **Diagnostics** answer whether software infrastructure/operations behaved correctly.

Do not combine them into a PII-heavy technical log.

## Error retention

Keep only the amount of local diagnostic history needed to diagnose recent failures. Bounded retention prevents uncontrolled growth.

## Integrity checks

The Diagnostics screen may expose a `Verify project integrity` operation that checks safe logical invariants such as:

- dangling references;
- duplicate stable external IDs where uniqueness is required;
- orphan media metadata;
- impossible state-machine values;
- unsupported schema versions;
- pending mutations referencing purged entities.

Automatic repair occurs only for unambiguous cases. Ambiguous issues are reported for review.

## Tests

- diagnostic export contains no forbidden PII fixture values;
- secret/token patterns are absent;
- integrity checker detects seeded corruption;
- ambiguous repair is never silently applied;
- bounded diagnostic retention works;
- diagnostics remain useful offline where relevant.
