# Identifier Strategy

Status: **Normative V1 identity/reference contract**

## Internal entity IDs

Persistent application entities use UUIDs.

Reasons:

- offline/distributed creation;
- low collision risk without central sequence;
- stable internal links;
- no sequential record-count disclosure.

UUID is opaque identity, never authorization.

## Human-readable codes

Project-specific user codes such as `S32`/`P14` are optional human identifiers, not PKs. They may be editable under controlled uniqueness rules.

Natural sorting is required (`S2 < S10`).

## Canonical external IDs

Import identity is namespaced and typed.

A top-level external identity is conceptually:

```text
project_id
source_namespace
entity_type
external_id
```

Example:

```text
project: <current project>
namespace: chatgpt-wedding-research
entity_type: venue
external_id: venue-s32
```

Do not assume `external_id` alone—or even namespace+ID across different entity types—is globally unique.

### Nested/parent-scoped external IDs

Child IDs may be stable **within a parent context**.

Example:

```text
venue A / space externalId = main
venue B / space externalId = main
```

These are distinct valid identities.

Persistence/matching therefore includes parent identity/scope for nested entity types, conceptually:

```text
project_id
namespace
entity_type
parent_entity_type
parent_entity_identity
external_id
```

Exact physical key is frozen in physical schema/canonical addendum. The importer must resolve parent first and must never match a child from another parent merely because child external ID text matches.

## External ID stability

Within a source namespace, generators/importers should reuse the same external ID for the same semantic entity. Changing ID without migration creates a new identity/match problem rather than an implicit rename.

Namespaces must not be casually impersonated by unrelated import generators.

## Device IDs

Each installation/device context receives a locally generated UUID for sync/audit diagnostics.

Device ID is not authentication, authorization or proof of physical device trust.

## Operation IDs

Every retry-sensitive local/cloud command uses stable UUID operation ID for idempotence. Reusing one operation ID for a different semantic operation is forbidden.

## Import IDs

Every import session has UUID independent from source-file hash. Same file hash can be analyzed multiple times while import session identity/history remains distinct.

## File/media/document IDs

DB metadata uses UUID independent from storage path/original filename/content hash. Logical document versions can remain distinct records even if bytes deduplicate safely.

## Content hashes

SHA-256 can support:

- exact-byte duplicate detection;
- import-file repeat warnings;
- backup manifests/integrity.

A hash is not authorization and not general semantic identity. Visual similarity is not hash equality.

Dedup should not create cross-project content-presence side channels.

## IDs in authenticated routes

Internal UUID can appear in protected app path, e.g. `/venues/<uuid>`. Security assumes IDs are guessable/publicly observable and relies on authorization/RLS.

Avoid putting guest names/emails/private values in route/query identity where UUID can serve.

Invitation bearer token is not a normal stable entity ID and follows separate secret-token URL/history rules.

## Project identity immutability

Ordinary project-owned entity cannot change `project_id`. Cross-project “move” is not a normal update; use explicit export/copy/import semantics if ever supported.

## Deletion/reuse

Deleted internal UUID is never reused for a different entity.

External IDs that historically pointed to an entity are not silently reassigned to unrelated entity because that would make future re-import unsafe.

## Duplicate merge identity

When two records are deliberately merged, all accepted external identifiers/provenance needed for future idempotent matching should resolve to the retained semantic entity through the documented merge/import mechanism.

Do not invent an unspecified public redirect table; implementation uses the frozen `external_identifiers`/import lineage model unless a later reviewed migration adds an explicit alias mechanism.
