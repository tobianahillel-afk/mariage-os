# OWASP ASVS Verification Matrix

Status: **Normative security-verification framework**

## Standard

Mariage OS uses **OWASP ASVS 5.0** as the primary application-security verification reference.

During implementation/security hardening, each applicable ASVS requirement is mapped to concrete implementation and objective verification evidence.

## Status values

- `PLANNED`
- `IMPLEMENTED`
- `VERIFIED`
- `N/A`
- `BLOCKED`

`N/A` requires written rationale.

## Required columns

| ASVS ID | Requirement summary | Applicable? | Mariage OS control | Verification/test | Status | Notes |
|---|---|---|---|---|---|---|

## Priority domains

### Architecture / threat modeling

- trust boundaries;
- multi-tenant isolation;
- least privilege / deny by default;
- private-deployment vs public-ready boundary;
- separation of environments;
- platform-admin trust domain separated from project membership.

### Authentication

- Supabase Auth configuration;
- verified identity;
- MFA/TOTP for owners before real-data cutover;
- session security;
- recovery;
- recent/strong authentication for privileged operations.

### Authorization / access control

Evidence must reference:

- `AUTHORIZATION-MODEL.md`;
- `ROLE-PERMISSION-MATRIX.md`;
- `AUTHORIZATION-RLS.md`;
- `RLS-MATRIX-V1.md`;
- `RLS-PERMISSION-MAPPING.md`;
- `PRIVILEGED-OPERATIONS.md`;
- `PLATFORM-ADMIN-ACCESS.md`.

Verification must cover at minimum:

- explicit permission catalog and centralized evaluation;
- active project membership;
- deny-by-default behavior;
- PostgreSQL grants **and** RLS policies;
- same-project relational integrity;
- owner/editor/viewer built-in permission bundles;
- relationship-based author checks for ratings/preferences/approvals;
- protected membership/security/system columns;
- direct REST/RPC authorization independent of UI;
- Storage authorization;
- Realtime isolation;
- role downgrade/revocation during active session;
- viewer/editor denial of owner-only privileged operations;
- cross-project BOLA/IDOR attempts;
- Search/export filtering by effective permission;
- guest-sensitive/finance/sensitive-document restrictions;
- platform/support access not implemented as universal hidden project membership.

A feature or table is not authorization-verified if only the happy-path owner test exists. Direct negative tests are required.

### Input validation

- forms;
- CSV/XLSX/JSON/imports;
- URLs;
- identifiers;
- money/date/percentage parsing;
- privileged-command parameters.

### File handling

- allowlists;
- MIME/signature checks;
- upload limits;
- archive traversal/decompression controls;
- safe previews;
- private signed access.

### Output encoding / XSS

- safe text rendering;
- rich content policy;
- CSP;
- external URL safety;
- no private metadata/referrer leakage.

### Data protection

- project isolation;
- guest/financial/document data classification;
- local device cache;
- backups;
- export allowlists;
- logs/diagnostics;
- project-switch/cache isolation.

### Communications

- HTTPS only;
- secure external endpoints;
- no sensitive data in insecure/public URLs.

### API/web service

- direct Supabase API authorization;
- replay/idempotency where needed;
- narrow privileged RPCs;
- no service-role exposure;
- no client-trusted project role claim.

### Error/logging

- no secret/PII leakage;
- safe permission-denied behavior without existence leakage;
- diagnostic correlation IDs;
- privileged-security event auditing.

### Business logic

- import/destructive safeguards;
- financial integrity;
- state-machine enforcement;
- rate/resource limits;
- role/permission/domain-state combinations.

### Client-side security

- service worker;
- IndexedDB partitioning/purge;
- CSP;
- safe DOM rendering;
- third-party dependencies;
- local permissions are UX only, not authoritative security.

## Verification rule

A requirement is not `VERIFIED` because documentation says it exists. It needs objective evidence such as:

- unit/property/security tests;
- direct RLS/RPC/Storage allow+deny tests;
- E2E multi-project tests;
- configuration/grant inspection;
- manual security verification where automation is inadequate.

## Authorization release blocker

Any of these blocks real-data/public release:

- cross-project read/write/reference path;
- role/permission escalation;
- missing deny test for sensitive permission;
- public/private Storage bypass;
- service-role/browser exposure;
- stale role still authorizing cloud write after revocation;
- viewer/editor access to owner-only privileged action;
- support/platform identity silently bypassing tenant boundaries.

## Release policy

Applicable high-priority controls required by the deployed architecture must be implemented and verified before production real-data cutover. Deferred/N/A items must be explicit and justified.