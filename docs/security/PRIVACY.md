# Privacy by Design

## Principle

Mariage OS stores only information genuinely useful to planning the wedding. More data is not automatically better.

## Data classes

### PUBLIC_REFERENCE

Information already public and used as reference, e.g. venue name, official website, public address.

### PRIVATE_PROJECT

Couple-only planning information: ratings, private notes, rejection reasons, tasks, decisions.

### PERSONAL

Information about invitees/contacts: names, email, phone, address, logistics.

### FINANCIAL

Budget, quote amounts, payments, negotiated prices.

### SENSITIVE_DOCUMENT

Contracts, invoices, payment evidence and other private documents.

## Collection minimization

Do not collect fields without a planning purpose.

Examples normally unnecessary:

- identity documents;
- full birth dates for ordinary guests;
- unrelated personal history;
- payment-card credentials.

## Sensitive logistics

Dietary/allergy/accessibility information may be operationally useful but deserves restricted presentation and post-event cleanup options.

## Public GitHub

No production/private data. Synthetic fixtures only.

## Logs/diagnostics

Default diagnostics exclude personal names, contact data, auth tokens, document contents and raw financial/private notes.

A diagnostic export should use opaque entity IDs and technical state where possible.

## Export profiles

Data sharing uses allowlists.

Examples:

### Couple full export

All authorized project data requested by owners.

### Vendor packet

Only schedule/access/requirements/contact items relevant to that vendor.

### Guest information

Only event/address/transport/accommodation/public instructions needed by guests.

Never implement privacy by “export everything then blacklist a few fields.”

## Post-wedding cleanup

The product should offer a guided review of personal information no longer necessary.

Possible cleanup categories:

- guest phone/email/address;
- dietary/accessibility logistics;
- temporary transport/hotel assignments;
- temporary access/share data.

Decision history/photos may be retained separately according to couple preference.

## Device privacy

Offline cache means an authorized device may retain project data. Account logout/revocation and local-data removal behavior must be clearly defined.

## Third-party resources

Opening external websites/maps can expose normal browser/network metadata to those services. Do not embed unnecessary third-party trackers or scripts.

## Analytics

No advertising trackers, Meta Pixel, Hotjar or equivalent. Product analytics are not required for V1. If future telemetry is introduced, it requires explicit privacy review/ADR and minimization.

## Tests

Privacy tests include export allowlists, no PII in diagnostics, deleted-member access revocation, post-cleanup behavior and no real data in public test fixtures.
