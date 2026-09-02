# Documents and Media Domain

## Separation

Mariage OS distinguishes:

- `media`: photos/images and related visual assets;
- `documents`: PDFs, quotes, contracts, invoices, plans, menus and other structured files.

Binary file storage is separate from database metadata.

## Media metadata

A media record may include:

- internal UUID;
- project ID;
- storage mode: private_upload / remote_reference;
- storage path or remote URL;
- original filename;
- MIME type;
- byte size;
- dimensions;
- SHA-256 hash for exact duplicate detection;
- category;
- source page URL;
- source/author credit where known;
- caption;
- main/favorite flags;
- original-versus-derivative relationship;
- created/updated metadata.

## Media categories

Initial venue-oriented values include:

- exterior;
- interior_empty;
- interior_decorated;
- view;
- ceremony;
- kitchen;
- toilets;
- parking;
- accommodation;
- floorplan;
- own_visit;
- other.

Additional modules may define relevant categories without compromising the generic storage model.

## Originals and derivatives

User-uploaded originals are preserved byte-for-byte when stored.

Display derivatives may include:

- thumbnail;
- preview.

A derivative never replaces the original and records its parent.

## Remote references

For publicly sourced promotional images, default behavior should store:

- remote image URL;
- source page URL;
- retrieval date;
- category/metadata.

The user may explicitly archive a private copy for important finalist/reference images if free-tier space allows.

## External-link failure

A broken remote image does not delete metadata or venue facts. If an archived copy exists, it may be used as fallback.

## Document metadata

Documents may include:

- quote;
- contract;
- invoice;
- payment evidence;
- floor plan;
- brochure;
- menu;
- insurance/administrative document;
- other.

Metadata includes date, related entities, sensitivity/share class, source and version/supersession information where relevant.

## Multiple links

One document may legitimately relate to multiple objects, e.g. a quote linked to vendor, budget item and decision. Use explicit link tables rather than binary duplication.

## Security

Uploaded content is untrusted input.

- no arbitrary HTML execution;
- no inline untrusted SVG in V1;
- office macros are never executed;
- preview mechanisms must not weaken browser/application security;
- Storage remains private;
- signed/download access is authorized and scoped.

## Upload lifecycle

An upload is not considered committed until storage and metadata linkage succeed.

Temporary/orphan objects require cleanup policy.

## Quota behavior

Before large upload batches, estimate projected private storage usage. Essential structured-data workflows remain available even when media uploads are limited.

## Metadata privacy

Image derivatives/third-party exports may strip sensitive metadata such as GPS EXIF. Original user files may retain original metadata in private storage.

## Tests

Test duplicate detection, interrupted uploads, storage-success/DB-failure orphan cleanup, remote-link failure, privacy export filtering, derivative/original separation and cross-project access denial.
