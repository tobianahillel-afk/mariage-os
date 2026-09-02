# `.mariage` Backup Format v1

Status: **Normative V1 portable recovery contract**

A portable backup must remain recoverable independently of Supabase and must never depend on an opaque vendor-specific dump.

## 1. Two export modes

### Plain portable archive

Filename convention:

`MariageOS_<project>_<YYYY-MM-DD>.mariage`

The file is a ZIP-compatible archive with UTF-8 paths/content.

Logical layout:

```text
manifest.json
checksums.json
data/
  project.json
  venues.json
  vendors.json
  guests.json
  seating.json
  tasks.json
  decisions.json
  budget.json
  planning.json
  documents.json
  media.json
  sources.json
  settings.json
media/
documents/
```

Binary directories are optional in a lightweight backup and present according to export options in a full backup.

### Password-protected encrypted backup

Encrypted backups use the same inner archive, encrypted client-side into a versioned outer container. The password never leaves the browser.

## 2. `manifest.json`

Required semantic fields:

```json
{
  "format": "mariage-os-backup",
  "formatVersion": "1.0",
  "schemaVersion": "1.0",
  "appVersion": "1.0.0",
  "exportedAt": "2027-01-15T12:00:00Z",
  "projectId": "uuid",
  "projectName": "...",
  "locale": "fr-FR",
  "timezone": "Europe/Paris",
  "currency": "EUR",
  "includesMedia": true,
  "includesDocuments": true,
  "encryption": "none"
}
```

Project ID is recovery metadata, not authorization. Restoring into another controlled project creates/maps new internal IDs as needed.

## 3. `checksums.json`

Contains SHA-256 for every archive entry except itself, using normalized relative path as key.

Verification checks:

- manifest is supported;
- no duplicate/case-conflicting unsafe archive paths;
- no absolute/path-traversal entry;
- all listed files exist;
- all checksums match;
- all required data files parse/validate;
- referenced included binaries exist when required.

A corrupted backup is rejected before destructive restore.

## 4. Structured data

Structured files use canonical Mariage OS export semantics. Cross-file references use exported stable backup IDs/external IDs rather than relying on insertion order.

Restore occurs in dependency-aware order and validates all project-scoped relationships.

## 5. Binary file rules

- preserve private original bytes when included;
- archive path uses generated safe IDs, not unsanitized user filenames as directory paths;
- original filename remains metadata;
- derivatives may be regenerated and can be optionally omitted when safely reproducible;
- remote promotional URLs may remain URL references rather than downloaded copies unless an archived private copy exists.

## 6. Encrypted container v1

Encrypted file extension can remain `.mariage` with a recognizable outer magic/version; implementation may optionally use `.mariage.enc` for clearer UX but must detect format from content, not extension alone.

Logical outer header:

```json
{
  "magic": "MARIAGE-ENC-1",
  "kdf": "PBKDF2-HMAC-SHA-256",
  "kdfIterations": 600000,
  "salt": "base64",
  "cipher": "AES-256-GCM",
  "nonce": "base64",
  "createdAt": "ISO instant"
}
```

Followed by authenticated ciphertext of the complete inner `.mariage` archive.

### Cryptographic invariants

- Web Crypto API only; no home-grown cryptography.
- AES key size: 256 bits.
- AES-GCM nonce: fresh cryptographically random 96-bit value per encryption.
- Salt: fresh cryptographically random at least 128 bits.
- KDF: PBKDF2-HMAC-SHA-256.
- V1 reference work factor: **600,000 iterations**. Lot 11 benchmarks supported real devices before release; a security ADR may increase the value if performance permits, but must not silently decrease below the frozen minimum without security review.
- Header parameters necessary for decryption are authenticated as Additional Authenticated Data (AAD) or equivalently bound to the authenticated container format.
- Never reuse an AES-GCM nonce with the same derived key.
- Password/key material is never logged, persisted to GitHub or sent to Supabase merely to create a local backup.

Wrong password/tampered ciphertext fails authentication and must be reported generically without partial restore.

## 7. Password UX

Encrypted export requires:

- password entry + confirmation;
- warning that forgotten password cannot be recovered by Mariage OS;
- no password strength theater that silently weakens encryption; encourage a long passphrase;
- no persistent password storage by the app.

Restore asks password locally and only proceeds after full authenticated decryption + integrity validation.

## 8. Restore modes

V1 supports:

### Restore into empty/recovery project
Preferred disaster-recovery path. Validates entire backup then imports transactionally/phase-wise with recovery checkpoints.

### Replace current project
High-risk operation. Requires recent strong auth, current safety backup/checkpoint and explicit confirmation. Implementation may choose restore-to-new-project + cutover instead if safer.

### Inspect/validate only
No mutation. Produces integrity/schema/object counts and incompatibility report.

## 9. Compatibility

- supported older format/schema → migrate through tested chain;
- unsupported future format → reject safely;
- never silently drop unknown future fields and call restore complete.

Historical backup fixtures are permanent regression assets using synthetic data.

## 10. Resource limits and archive bombs

Before/during restore enforce:

- maximum total uncompressed size appropriate to free-tier/project policy;
- maximum entry count;
- maximum single entry size;
- decompression ratio safeguards;
- path traversal/symlink-like unsafe entry rejection;
- streaming/incremental processing where practical rather than unbounded memory expansion.

## 11. Round-trip acceptance

A golden synthetic project must pass:

`export → verify → destroy test target → restore → semantic comparison`

for:

- lightweight plain backup;
- complete plain backup;
- encrypted complete backup;
- supported historical version migration.

## 12. Recovery independence

The backup format is documented in the public repository so project data remains recoverable even if the hosted Mariage OS deployment no longer exists. No production backup itself belongs in GitHub.