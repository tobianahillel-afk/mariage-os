# Documents and Media Feature Contract

## Purpose

Provide one reliable place for quotes, contracts, invoices, plans, menus, photos and evidence, linked to the entities/decisions/budget items they support.

## Main views

- All documents
- Quotes
- Contracts
- Invoices/payment evidence
- Plans/brochures/menus
- Photos/media
- Recently added
- Orphan/unclassified inbox

## Document card/detail

Shows:

- filename/title;
- type/category;
- linked entities;
- date;
- source/vendor;
- sensitivity/share class;
- status/version/supersession;
- size/type;
- open/download action;
- related budget/decision where useful.

## Upload

Users can upload from device/camera/file picker. Upload lifecycle and security follow file-security specification.

A file may be initially unclassified and later linked without reuploading.

## Multi-link

One quote can be linked to:

- vendor;
- budget item;
- decision;
- interaction.

Do not duplicate the binary file to achieve multiple relationships.

## Versions

Revised quote/contract versions remain separate documents with supersession relationship, preserving history.

## Photos

Media gallery supports source category and original/thumbnail distinction.

For external marketing images, remote references are default; important finalist images may be privately archived.

## Sharing/export

Documents are private by default. Export packets use explicit allowlists/sensitivity classes.

## Search

Search metadata/title/vendor/entity relationships. Full-text PDF indexing is not required for core V1.

## Empty/orphan state

An Inbox/unclassified section allows fast upload before classification.

## Acceptance criteria

- same binary can link to multiple entities without duplicate storage;
- private Storage access is RLS-authorized;
- interrupted upload never appears as valid committed document;
- superseded version remains accessible historically;
- unclassified file can be classified later;
- vendor/guest export cannot leak unrelated sensitive documents;
- exact duplicate upload is detected where hashing is available.
