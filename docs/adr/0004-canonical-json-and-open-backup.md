# ADR 0004 — Canonical versioned JSON plus open `.mariage` backup

- Status: Accepted
- Date: 2026-09-02

## Context

Mariage OS must accept spreadsheets for humans, allow ChatGPT/tools to generate structured imports, and remain recoverable without vendor lock-in. CSV cannot faithfully represent deeply nested venue spaces/offers/sources/media. A proprietary opaque backup would create unacceptable recovery risk.

## Decision

Use:

1. versioned Mariage OS JSON as the canonical rich exchange format;
2. CSV/XLSX as human-friendly module imports/exports with documented lossy/lossless scope;
3. `.mariage` as a ZIP-compatible open archive containing versioned JSON manifests/data plus optional media/documents and checksums.

Stable namespaced `externalId` values support idempotent re-import.

## Consequences

- canonical schemas are versioned and documented;
- old supported schemas have migration fixtures;
- future unknown schemas are rejected safely;
- export→import round-trip is tested where lossless behavior is claimed;
- users can recover JSON/files even if Mariage OS itself is unavailable;
- import provenance and source hashes are retained.

## Rejected alternatives

### CSV as only interchange format
Rejected because nested relationships and multiple observations/sources cannot be represented reliably without awkward multi-file conventions.

### Supabase dump as user backup
Rejected because it couples recovery to internal provider/schema implementation and is not suitable as a user-owned portable project format.

### Opaque proprietary binary backup
Rejected because it violates portability/recovery goals.
