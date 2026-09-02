# Security Testing

## Objective

Security controls are verified through direct adversarial tests, not assumed from UI behavior.

## Authorization suite

For every project-scoped table/resource:

- anonymous read denied;
- anonymous write denied;
- owner reads own project;
- owner cannot read other project;
- owner cannot insert/update with another project ID;
- removed member denied;
- viewer/editor restrictions where roles exist;
- protected administrative fields cannot be escalated client-side.

## Storage suite

- unauthorized object read denied;
- cross-project path denied;
- unauthorized upload/update/delete denied;
- signed/private link behavior verified;
- malformed/path traversal names handled safely;
- orphan cleanup does not cross project boundaries.

## XSS/URL suite

Payloads in:

- venue/vendor/guest names;
- notes;
- captions;
- imported headers/values;
- source labels;
- URLs.

Verify no script execution and dangerous protocols rejected.

## File/import adversarial suite

- MIME/extension mismatch;
- oversized file;
- malformed XLSX/CSV/JSON;
- formula-injection strings;
- macro-containing workbook handled without execution;
- archive traversal;
- decompression/resource abuse limits;
- future/unsupported backup schema;
- duplicate hashes;
- interrupted upload;
- malformed HEIC/image where supported.

## Business-logic abuse

- import changes locked selected venue;
- stale import downgrades contractual fact;
- negative/overflow financial values;
- impossible probabilities;
- invalid state transition;
- task dependency cycle;
- concurrent stale overwrite;
- delete/edit race;
- repeated operation replay.

## Session/auth tests

- expired token;
- revoked user;
- MFA-required action without adequate assurance;
- stale session attempts destructive action;
- logout/relogin with pending local mutation.

## Frontend security configuration

Verify production build for:

- CSP compatibility;
- no `unsafe-eval` if policy forbids it;
- no service-role/secret token string;
- expected security headers;
- no third-party trackers;
- safe external link behavior.

## Dependency/supply chain

- static analysis;
- dependency vulnerability scan;
- secret scan;
- lockfile consistency;
- CI permission review.

## Manual security review

Before real-data V1 cutover perform manual attempts to bypass UI and call Supabase APIs directly using ordinary test-user credentials.

## Regression rule

Every discovered security defect gets a regression test at the appropriate layer before closure.

## Production data prohibition

All security tests use isolated synthetic projects and accounts.
