# Controlled Backlog

Status: **Non-V1 unless explicitly promoted**

This file captures useful ideas without allowing them to silently expand V1. An item entering V1 requires an explicit scope change, affected requirement IDs, architecture/security/test impact and updated lot acceptance.

## High-value post-V1 candidates

### Seating and room planning

- visual room-layout canvas;
- tables/zones/dance floors/mehitsa objects;
- guest seating assignment;
- relationship warnings (`keep together` / `avoid together`);
- plan versioning;
- printable final plan.

### Advanced transportation

- guest origin aggregation;
- shuttle routes/departure times;
- vehicle capacity;
- guest assignment;
- transport budget linkage.

### Accommodation

- hotel room blocks;
- rates/deadlines/codes;
- guest allocation;
- remaining capacity.

### Wedding-day mode

- frozen operational snapshot;
- timeline;
- next event;
- emergency/vendor contacts;
- delegated responsibilities;
- day-of minimal UI.

### Controlled sharing

- guest-safe information export/page;
- vendor-specific operational packet;
- temporary scoped links with expiry;
- strict allowlisted field profiles.

### Notifications

- PWA push for truly important deadlines;
- notification preferences/snooze;
- anti-spam rules;
- optional reminders beyond calendar export.

### Assisted document processing

- OCR/text extraction;
- suggested quote fields;
- contract-clause extraction;
- human confirmation before canonical mutation.

This must remain optional and work without paid AI services.

### Calendar integrations

- Google/Apple/Outlook event sync;
- provider-auth complexity evaluated before implementation.

### Research assistance

- structured research import workflows;
- optional external research integrations;
- never make web research/AI a required runtime dependency.

## Ideas deliberately rejected unless product mission changes

- social network/feed;
- public wedding marketplace;
- internal chat replacing normal messaging apps;
- banking/card payment handling;
- full accounting product;
- generic enterprise PM suite;
- unrestricted HTML page builder;
- advertising/tracking platform;
- storing personal data merely because it might be useful someday.

## Promotion process

To promote backlog item into a release:

1. define user problem;
2. identify why existing workflow is insufficient;
3. create/update requirements;
4. define data model;
5. threat/privacy review;
6. offline/sync/import/export impact;
7. acceptance criteria and tests;
8. ADR if architectural;
9. assign implementation lot/version;
10. preserve €0/month constraint unless couple explicitly changes it.

Backlog existence is not implementation authorization.
