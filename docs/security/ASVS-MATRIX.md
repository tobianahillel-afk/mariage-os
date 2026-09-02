# OWASP ASVS Verification Matrix

## Standard

Mariage OS uses **OWASP ASVS 5.0** as the primary application-security verification reference.

This document is the matrix framework. During implementation/security hardening, each applicable ASVS requirement must be mapped to concrete implementation and verification evidence.

## Status values

- `PLANNED`
- `IMPLEMENTED`
- `VERIFIED`
- `N/A`
- `BLOCKED`

`N/A` requires a written rationale.

## Required columns

| ASVS ID | Requirement summary | Applicable? | Mariage OS control | Verification/test | Status | Notes |
|---|---|---|---|---|---|---|

## Priority domains

The detailed matrix must at minimum cover applicable controls in these areas:

### Architecture and threat modeling

- trust boundaries;
- least privilege;
- secure architecture documentation;
- separation of environments.

### Authentication

- Supabase Auth configuration;
- MFA/TOTP for owners;
- session security;
- recovery/reauthentication.

### Authorization

- RLS policies;
- role enforcement;
- project isolation;
- Storage access;
- administrative actions.

### Input validation

- forms;
- imported CSV/XLSX/JSON;
- URLs;
- identifiers;
- money/date/percentage parsing.

### File handling

- allowlists;
- MIME/signature checks;
- upload limits;
- archive traversal/decompression controls;
- safe previews.

### Output encoding / XSS

- text rendering;
- rich content policy;
- CSP;
- external URL safety.

### Data protection

- private project data;
- local device cache;
- backups;
- sensitive export allowlists;
- logs/diagnostics.

### Communications

- HTTPS only;
- secure external endpoints;
- no sensitive data in insecure URLs.

### API/web service

- direct Supabase API authorization;
- replay/idempotency where needed;
- no service-role exposure.

### Error/logging

- no secret/PII leakage;
- actionable user errors;
- diagnostic correlation IDs.

### Business logic

- import/destructive-operation safeguards;
- financial integrity;
- state-machine enforcement;
- rate/resource limits.

### Client-side security

- service worker;
- storage;
- CSP;
- safe DOM rendering;
- third-party dependencies.

## Verification rule

A requirement is not `VERIFIED` because documentation says it exists. It needs objective evidence such as:

- automated unit/integration/security test;
- direct RLS test;
- configuration inspection;
- manual security verification where automation is not adequate.

## Release policy

Applicable high-priority controls necessary for the deployed V1 architecture must be implemented/verified before production real-data cutover. Deferred/N/A items must be explicit and justified.
