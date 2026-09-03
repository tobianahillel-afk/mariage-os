# Inbox and Quick Capture Feature Contract

Status: **Normative V1 feature contract**

## Purpose

The Inbox is the low-friction entry point for information that the couple does not want to classify immediately. It prevents useful links/ideas/tasks from being lost while keeping domain records structured.

## Capture

Global `+` can create an Inbox item from:

- free text;
- URL;
- venue hint;
- vendor hint;
- guest hint;
- task hint;
- document/file hint;
- other.

Minimum valid capture is one non-empty text value or one valid safe URL.

## Status

- `inbox` — unprocessed;
- `converted` — converted/linked to a durable domain entity;
- `archived` — intentionally kept without conversion;
- `discarded` — recoverable deletion state until purge.

## Conversion

Supported conversions include:

- create/open Venue;
- create/open Vendor;
- create Guest/Household entry;
- create Task;
- create Decision;
- attach Document/Media;
- keep as project note/tagged reference where supported.

Conversion is explicit, idempotent and preserves a link/history back to the capture item. Retrying the same conversion cannot duplicate the resulting entity.

## Duplicate handling

Before converting a venue/vendor/guest hint, run the same duplicate-detection logic as ordinary creation/import. Inbox never bypasses duplicate safeguards.

## Offline

Text/URL capture works offline and queues synchronization. File upload can remain local-pending until connectivity is available.

## Privacy/security

Inbox content is private project data. URLs are validated before rendering/opening. Captured HTML is treated as text; no executable content is rendered.

## Acceptance criteria

- capture can be completed in a few seconds on mobile;
- an Inbox item can be converted once without duplicate entity creation;
- conversion failure leaves original capture recoverable;
- offline capture survives app restart;
- dismissed/archived items do not disappear silently;
- unrelated project member cannot access another project's Inbox via direct API.