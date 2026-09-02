# File and Import Security

## Principle

Every uploaded/imported file is untrusted input, including files selected by a project owner.

## Allowed V1 types

Structured import:

- CSV
- XLSX (non-macro workbook processing only)
- JSON conforming to supported schemas
- `.mariage` archive format

Documents/media:

- PDF
- JPEG/JPG
- PNG
- WebP
- HEIC/HEIF if safely supported for storage/preview conversion

Other formats require explicit review before enablement.

## Explicitly disallowed as active content

- HTML upload rendered as application content;
- JavaScript;
- executable/batch/shell files;
- macro execution;
- arbitrary inline SVG from users/external sources;
- office active content execution.

## Validation layers

Validate where practical:

1. extension;
2. declared MIME type;
3. signature/magic bytes for supported binary types;
4. size;
5. parser/schema validity;
6. logical record/batch limits.

No single client-provided metadata field is trusted alone.

## Size limits

Application limits should be lower than provider hard limits and configurable/documented.

Initial design targets:

- photo: 20 MB/object;
- PDF: 25 MB;
- structured import: 20 MB;
- maximum structured rows: 50,000/import;
- maximum spreadsheet sheets/columns: bounded defensively.

Exact values may be adjusted with an ADR/performance evidence.

## CSV/XLSX safety

- never execute macros;
- treat formulas as untrusted data; do not run arbitrary workbook calculation engines;
- if a cached calculated value is unavailable, flag it;
- neutralize formula-injection-prone text on spreadsheet export when opened by common spreadsheet software;
- handle encoding/delimiter safely.

## JSON safety

- validate schema/version;
- reject unsupported future versions rather than partially guessing;
- limit nesting/object counts/string sizes;
- never map JSON data into executable code.

## Archive safety

`.mariage` restore must protect against:

- path traversal (`../` zip slip);
- decompression bombs/resource exhaustion;
- duplicate/conflicting manifest paths;
- invalid checksums;
- unsupported schema versions;
- unexpected executable content.

## Upload lifecycle

1. validate locally where possible;
2. create pending metadata as needed;
3. upload to private storage;
4. verify expected object result;
5. commit/link metadata transactionally where possible;
6. mark committed;
7. cleanup orphan/incomplete uploads.

## Previews

Previewing a file must not execute active content. PDF/image previews should use safe browser/object handling with appropriate content types and isolation.

## URLs

External/source URL fields accept only intended protocols such as HTTPS/HTTP where appropriate. Reject `javascript:`, `data:` for user-entered navigation targets unless a narrowly reviewed internal use exists.

## Hashing

SHA-256 may detect exact duplicate files and verify backup integrity. Hash equality does not authorize access.

## EXIF/privacy

Private originals can remain byte-identical. Generated derivatives/third-party exports may strip GPS/device metadata by default when appropriate.

## Storage policies

Private Storage bucket; project-aware authorization; no public listing; signed access only where needed.

## Tests

Include malformed/renamed files, MIME mismatch, oversized input, duplicate upload, interrupted upload, DB-link failure, path traversal archive, formula injection, malicious URLs and cross-project Storage access.
