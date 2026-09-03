# Privacy by Design

Status: **Normative V1 privacy contract**

## Principle

Mariage OS stores only information genuinely useful to wedding planning. More data is not automatically better.

## Data classes

### `PUBLIC_REFERENCE`
Already-public reference such as venue name, official website/address or public marketing source URL.

### `PRIVATE_PROJECT`
Couple-only planning data: ratings, private notes, rejection reasons, tasks, decisions, Inbox.

### `PERSONAL`
Invitee/contact information: names, email, phone, address and logistics.

### `SENSITIVE_LOGISTICS`
Dietary/allergy/accessibility/transport/accommodation details whose disclosure could affect privacy and which should be cleaned when no longer needed.

### `FINANCIAL`
Budgets, quotes, negotiated prices, scenarios, payments.

### `SENSITIVE_DOCUMENT`
Contracts, invoices, payment evidence and other private uploaded files.

## Collection minimization

Do not collect fields without a real planning purpose.

Normally unnecessary:

- identity documents;
- full guest birth dates;
- unrelated personal history;
- payment-card credentials;
- identity/gender inference from seating section choices.

The seating model stores operational table/section placement only; it must not infer broader personal attributes from labels such as “Men”/“Women”.

## Public repository

No production/private data, private screenshots or real wedding exports. Synthetic fixtures only.

## Logs/diagnostics

Exclude by default:

- names/contact details;
- auth/session data;
- invite raw tokens;
- document contents;
- raw private notes;
- full financial payloads.

Diagnostics use opaque IDs, safe status/error code/version and sanitized metadata.

## Export profiles

Sharing uses **allowlists**, never “export everything then blacklist”.

Examples:

- Couple full export — all owner-authorized requested project data.
- Vendor packet — only relevant schedule/access/requirements/contact data.
- Guest packet — only intended event/address/transport/public instructions.
- Research completion export — only chosen facts/unknowns/source references, excluding unrelated guests/finance.

Automated tests verify restricted exports cannot leak unrelated private fields.

## Post-wedding cleanup

Provide guided cleanup of no-longer-useful personal data:

- guest phone/email/address;
- dietary/accessibility logistics;
- transport/accommodation data;
- temporary share/access information;
- obsolete cached external media.

Decision history/photos can be retained independently by couple choice.

## Local device privacy

IndexedDB/offline cache means an authorized device stores private bytes.

Frozen logout behavior:

- pending work is handled explicitly first;
- safe logout purges private project local database/cached media from that browser profile;
- non-sensitive app shell may remain cached;
- remote revocation cannot guarantee deletion from a stolen device that is permanently offline.

The residual lost-device risk depends on device OS/browser profile security and should be included in recovery guidance.

## Remote images

An external marketing image URL is not private Storage. Loading it directly can reveal the viewer's IP/network metadata to the third-party host even if no private wedding fields are transmitted.

V1 rules:

- remote promotional images are nonessential reference content;
- render with `referrerpolicy="no-referrer"` (or equivalent) to avoid sending the Mariage OS page URL as referrer;
- lazy-load where appropriate;
- never append project/guest/private query parameters to remote media URLs;
- remote media failure never breaks venue data;
- important/finalist images can be deliberately archived privately while retaining original source/provenance;
- no third-party image proxy is introduced unless separately privacy/security reviewed.

UI/documentation should not imply that direct remote image loading hides the user's IP from the image host.

## External maps/websites

Opening Google Maps, venue sites or other services exposes ordinary browser/network metadata to those services. Navigation is explicit/user-triggered and sends only what is required for the requested route/location.

No guest list, budget, private note or project token is inserted into external URLs.

## Search

Guest/vendor/project search is local or first-party Supabase project-scoped. Search terms containing private names are not sent to advertising/analytics/third-party semantic-search providers.

## Analytics

No advertising trackers, Meta Pixel, Hotjar or equivalent. Product telemetry is not required in V1. Any future telemetry requires explicit privacy ADR, minimization and disclosure.

## Tests

Privacy suite includes:

- export allowlists;
- no PII/secrets/raw invitation token in diagnostics/logs;
- removed-member authorization denial;
- safe logout clears private cache after pending-work handling;
- external URL construction contains no unrelated private data;
- remote images use no-referrer policy;
- search terms are not emitted to third-party analytics;
- post-cleanup behavior;
- no real data in public fixtures/repository.