# Documents and Media Feature Contract

Status: **Normative V1 feature contract**

## Purpose

Provide one reliable place for quotes, contracts, invoices, plans, menus, photos and evidence, while preserving version lineage, safe review state and links to the domain data they support.

## Main views

- All documents
- Quotes/proposals
- Contracts/amendments
- Invoices/payment evidence
- Plans/brochures/menus
- Photos/media
- Needs review
- Recently added
- Unclassified/orphan inbox

## Document detail

Shows:

- title/original filename;
- document type;
- document date;
- linked venue/vendor/budget/decision/source/interaction;
- sensitivity/share class;
- version/supersession lineage;
- review status/reviewer/time;
- file size/MIME/upload state;
- open/download;
- contract/quote readiness checklist when applicable;
- source/provenance.

## Upload

Upload follows Storage/file-security lifecycle. A file can begin unclassified and later be linked without duplicate upload.

A database row is not `committed` until required Storage/reference state is valid.

## Multi-link

One binary can link to multiple entities without duplication, e.g. quote ↔ vendor + budget item + decision + source.

Every link is same-project validated.

## Versions and supersession

A revised quote/contract is a new document row. It can `supersede` a previous document.

Requirements:

- prior bytes/history remain available until retention/purge;
- no supersession cycle;
- latest version visually identified;
- a new version does not silently inherit review completion from the prior version;
- facts sourced from old version remain historical and may become superseded/stale rather than rewritten.

## Quote/contract readiness

For applicable documents, use `CONTRACT-READINESS.md`.

Review states:

- unreviewed;
- in review;
- reviewed with open items;
- reviewed;
- superseded.

Checklist items can link to facts/sources/tasks and capture whether an item is confirmed in document, externally confirmed, missing, contradictory or needs human review.

No automated legal advice claim.

## Photos/media

Media gallery distinguishes:

- private original;
- generated preview/thumbnail;
- remote external reference;
- couple's own visit media.

Original stored bytes are never silently replaced by derivative.

Remote media follows privacy/no-referrer policy and remains nonessential.

## Search

V1 searches metadata/title/vendor/entity relationships. Full-text PDF OCR/indexing is post-V1.

## Sharing/export

Documents private by default. Any packet uses explicit field/document allowlist.

A vendor packet must not accidentally include unrelated contract, guest list, budget, partner note or diagnostics.

## Unclassified state

Fast file capture can remain unclassified and later be linked/classified. Unclassified file still receives privacy/security controls and cannot be public by omission.

## Acceptance criteria

- same binary can link multiple entities without storage duplication;
- private Storage RLS enforced direct API;
- interrupted upload not shown as valid document;
- document supersession preserved and acyclic;
- prior version remains historical;
- new version does not inherit stale review confirmations;
- quote/contract checklist persists review state;
- document-backed source can support fact observation;
- unclassified file can be classified later;
- restricted exports cannot leak unrelated documents/private review notes;
- exact duplicate upload detected where hashing available;
- no unsafe active document content executed inline.