# Identifier Strategy

## Internal IDs

Use UUIDs for persistent internal entity identifiers.

Reasons:

- safe creation across offline devices;
- low collision risk without central allocation;
- stable references across imports/exports;
- no exposure of record counts through sequential IDs.

Internal UUIDs are opaque and never grant authorization by themselves.

## Human-readable codes

Entities may also have project-specific codes for human use.

Examples:

- venue: `S32`, `P14`
- budget item: optional human code if useful

Human codes are not primary keys and may be editable under controlled rules.

Sorting must be natural: `S2 < S10`, not lexical `S10 < S2`.

## External IDs

Importable entities may carry stable external identifiers scoped by namespace.

Example:

```text
namespace: chatgpt-wedding-research
external_id: venue-s32
```

The pair `(project_id, namespace, external_id)` can support idempotent re-import.

Never assume an external ID is globally unique without namespace.

## Device IDs

Each application installation/device context receives a locally generated UUID used for synchronization/audit diagnostics.

A device ID is not authentication and must not grant access.

## Operation IDs

Every queued synchronization/import operation uses a stable UUID for retry idempotency.

## Import IDs

Every import session receives a UUID and records source-file hash where available.

## File IDs

Uploaded files/media have database metadata UUIDs independent of their storage object paths and hashes.

## Content hashes

SHA-256 may be used for:

- exact duplicate-file detection;
- import-file idempotence warnings;
- backup integrity manifests.

A hash is not a primary authorization identifier.

## IDs in URLs

Stable internal IDs may appear in authenticated application routes. Security must never rely on IDs being secret.

Example:

`/venues/<uuid>`

## Reassignment

`project_id` identity is immutable for ordinary project-scoped entities. Moving an entity between projects is not a supported normal edit; export/import/copy semantics should be used if ever needed.

## Deletion and reuse

Deleted IDs are never reused for a different semantic entity.

## Merge behavior

When duplicates are merged, preserve redirect/alias metadata where useful so imported external IDs and historical references resolve to the retained entity.
