# Mariage OS Security — Start Here

Status: **Normative security documentation entry point**

Security work must not start from an isolated UI condition, RLS policy or “we will sanitize it later” assumption. Read the relevant contracts below before implementation.

## Core security architecture

1. `SECURITY-ARCHITECTURE.md`
2. `SECURITY-CONTROL-BASELINE.md`
3. `SECURITY-REQUIREMENTS.md` — stable traceable `SEC-*` requirements for implementation evidence.
4. `THREAT-MODEL.md`
5. `THREAT-MODEL-HARDENING-ADDENDUM.md`
6. `THREAT-MODEL-AUTHORIZATION-ADDENDUM.md`
7. `SECURE-CODING-PATTERNS.md`
8. `INPUT-VALIDATION.md`
9. `WEB-PROTOCOL-SECURITY.md`
10. `SECRET-MANAGEMENT.md`

## Authentication / sessions / brute force

11. `AUTHENTICATION.md`
12. `AUTH-HARDENING.md`
13. `BOOTSTRAP-INVITATIONS.md`
14. `PUBLIC-ABUSE-PROTECTION.md` for public-ready/self-service surfaces.

## Authorization / rights

15. `AUTHORIZATION-MODEL.md`
16. `AUTHORIZATION-REQUIREMENTS.md`
17. `ROLE-PERMISSION-MATRIX.md`
18. `AUTHORIZATION-RLS.md`
19. `RLS-MATRIX-V1.md`
20. `RLS-PERMISSION-MAPPING.md`
21. `PRIVILEGED-OPERATIONS.md`
22. `PLATFORM-ADMIN-ACCESS.md`
23. `STORAGE-RLS.md`

Physical authorization schema: `../domain/PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`.

## Database/query security

24. `SECURE-DATABASE-QUERIES.md`
25. schema/migration contracts under `../domain/` and `../engineering/MIGRATIONS.md`.

## Browser/frontend

26. `FRONTEND-SECURITY.md`
27. UX/image/private SEO contracts where external media/navigation is involved.

## Files/storage/imports

28. `FILE-SECURITY.md`
29. `STORAGE-RLS.md`
30. relevant `../import-export/*` and backup contracts.

## Privacy / platform access

31. `PRIVACY.md`
32. `PLATFORM-ADMIN-ACCESS.md`
33. public web/SEO/export privacy contracts where applicable.

## Supply chain / repository

34. `SUPPLY-CHAIN.md`
35. `SECRET-MANAGEMENT.md`
36. CI/CD and quality-gate contracts.

## Verification

37. `ASVS-MATRIX.md`
38. `../quality/SECURITY-TESTING.md`
39. `../reviews/SECURITY-HARDENING-REVIEW.md`
40. `../reviews/AUTHORIZATION-DESIGN-REVIEW.md`

## Non-negotiable authorization rule

Every access decision is based on:

`authenticated identity + current project membership + explicit permission + relationship/attribute constraints + domain invariants + required auth assurance`.

Project role is a centrally mapped permission bundle. Feature code must not implement authorization by scattered `if role === ...` branches.

## Non-negotiable injection rule

Untrusted data is **data**, never executable syntax.

- no concatenated SQL;
- no raw user SQL/query fragments;
- no `eval`/`new Function`;
- no arbitrary user HTML/SVG execution;
- no arbitrary user regex execution;
- no unsafe deep merge into configuration/security state;
- no privileged arbitrary server-side URL fetch without SSRF design;
- no custom crypto/password/token implementation.

## Public-ready rule

The private V1 has two owners, but security tests use multiple projects, unrelated users, owner/editor/viewer roles, revoked members and cross-project adversarial requests.

Public activation may add provisioning/roles, but it may not weaken tenant isolation, validation, anti-abuse or server-side permission checks.

## Security review trigger

A new attack surface automatically reopens security design for that surface. Examples:

- new Auth/OAuth provider;
- public API/webhook;
- rich HTML/Markdown renderer;
- dynamic/raw SQL;
- server-side URL fetch/OCR/research;
- new archive/file parser;
- cryptography;
- payment integration;
- runtime third-party script;
- support impersonation/JIT access;
- runtime process/command execution.

Do not implement first and document security afterward.
