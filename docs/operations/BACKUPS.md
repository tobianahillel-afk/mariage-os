# Backup Policy

## Principle

Cloud synchronization is not a substitute for a portable, verified backup.

## Backup levels

### Level 1 — Cloud history/audit

Supports ordinary change history and application-level recovery workflows. Not sufficient alone for disaster recovery.

### Level 2 — Lightweight project export

Contains structured project data, schema/format manifest and media/document references where configured.

Fast to create and useful for frequent snapshots.

### Level 3 — Complete `.mariage` backup

Contains structured data plus selected/all private media/documents and integrity manifest.

Potential structure:

```text
manifest.json
data/
media/
documents/
checksums.json
```

The archive format is documented and versioned.

## Encryption

Complete backups containing personal/financial/contractual information should support client-side password protection/encryption before download.

Encryption design must use reviewed Web Crypto primitives and authenticated encryption such as AES-GCM with proper key derivation; exact format will be specified before implementation.

## Backup reminders

The application should record the last known successful external backup timestamp and unobtrusively remind owners when backups become old, with stronger prompting before major migrations/cutover.

## Automatic safety snapshots

Before high-risk logical operations such as:

- bulk destructive import;
- schema/data migration at application level;
- large merge;
- restore/replace;
- mass deletion;

create a recoverable logical snapshot/checkpoint where feasible.

## Integrity

A complete backup includes checksums/manifest. Verification can confirm:

- archive readable;
- supported schema version;
- required files present;
- checksums match;
- references are structurally valid.

## Restore testing

Backup is not considered trustworthy until automated restore tests recreate a clean synthetic project and compare semantic content.

## Version compatibility

Backups carry:

- format identifier;
- schema version;
- application version;
- project ID/origin metadata;
- export timestamp.

Current versions migrate supported older backups forward. Older apps reject unsupported future backups safely.

## Storage of downloaded backups

Once downloaded, backups are outside application cloud control. Project deletion does not erase copies held by users.

## Production cutover

Before Mariage OS becomes the real project's source of truth, produce/verify a baseline export of the imported project and preserve the previous Excel/source files as read-only historical references.
