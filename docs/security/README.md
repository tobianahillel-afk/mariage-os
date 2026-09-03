# Mariage OS Security — Start Here

Status: **Normative security documentation entry point**

Security work must not start from an isolated UI condition, RLS policy or “we will sanitize it later” assumption. Read the relevant contracts below before implementation.

## Core security architecture

1. `SECURITY-ARCHITECTURE.md`
2. `SECURITY-CONTROL-BASELINE.md`
3. `THREAT-MODEL.md`
4. `THREAT-MODEL-AUTHORIZATION-ADDENDUM.md`
5. `SECURE-CODING-PATTERNS.md`
6. `INPUT-VALIDATION.md`
7. `WEB-PROTOCOL-SECURITY.md`
8. `SECRET-MANAGEMENT.md`

## Authentication / sessions / brute force

9. `AUTHENTICATION.md`
10. `AUTH-HARDENING.md`
11. `BOOTSTRAP-INVITATIONS.md`
12. `PUBLIC-ABUSE-PROTECTION.md` for public-ready/self-service surfaces.

## Authorization / rights

13. `AUTHORIZATION-MODEL.md`
14. `AUTHORIZATION-REQUIREMENTS.md`
15. `ROLE-PERMISSION-MATRIX.md`
16. `AUTHORIZATION-RLS.md`
17. `RLS-MATRIX-V1.md`
18. `RLS-PERMISSION-MAPPING.md`
19. `PRIVILEGED-OPERATIONS.md`
20. `PLATFORM-ADMIN-ACCESS.md`
21. `STORAGE-RLS.md`

Physical authorization schema: `../domain/PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`.

## Database/query security

22. `SECURE-DATABASE-QUERIES.md`
23. schema/migration contracts under `../domain/` and `../engineering/MIGRATIONS.md`.

## Browser/frontend

24. `FRONTEND-SECURITY.md`
25. UX/image/private SEO contracts where external media/navigation is involved.

## Files/storage/imports

26. `FILE-SECURITY.md`
27. `STORAGE-RLS.md`
28. relevant `../import-export/*` and backup contracts.

## Privacy / platform access

29. `PRIVACY.md`
30. `PLATFORM-ADMIN-ACCESS.md`
31. public web/SEO/export privacy contracts where applicable.

## Supply chain / repository

32. `SUPPLY-CHAIN.md`
33. `SECRET-MANAGEMENT.md`
34. CI/CD and quality-gate contracts.

## Verification

35. `ASVS-MATRIX.md`
36. `../quality/SECURITY-TESTING.md`
37. `../reviews/SECURITY-HARDENING-REVIEW.md`
38. `../reviews/AUTHORIZATION-DESIGN-REVIEW.md`

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
