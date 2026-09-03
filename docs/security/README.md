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
15. `GUEST-COMMUNICATIONS-SECURITY.md` for guest capability links, outbound providers and webhooks.

Partner-account invitations and guest RSVP invitations are separate trust models. A guest link never creates project membership.

## Authorization / rights

16. `AUTHORIZATION-MODEL.md`
17. `AUTHORIZATION-REQUIREMENTS.md`
18. `ROLE-PERMISSION-MATRIX.md`
19. `AUTHORIZATION-RLS.md`
20. `RLS-MATRIX-V1.md`
21. `RLS-PERMISSION-MAPPING.md`
22. `PRIVILEGED-OPERATIONS.md`
23. `PLATFORM-ADMIN-ACCESS.md`
24. `STORAGE-RLS.md`
25. `GUEST-COMMUNICATIONS-AUTHORIZATION.md` for contact/invitation/campaign/provider permissions and guest-capability separation.

Physical authorization schema: `../domain/PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md` plus guest-communications schema addendum.

## Database/query security

26. `SECURE-DATABASE-QUERIES.md`
27. schema/migration contracts under `../domain/` and `../engineering/MIGRATIONS.md`.
28. `../domain/PHYSICAL-SCHEMA-GUEST-COMMUNICATIONS-ADDENDUM.md` for invitation/contact/campaign/webhook entities.

## Browser/frontend/external content

29. `FRONTEND-SECURITY.md`
30. `EXTERNAL-CONTENT-SECURITY.md`
31. guest-link referrer/third-party-resource restrictions from `GUEST-COMMUNICATIONS-SECURITY.md`.
32. UX/image/private SEO contracts where external media/navigation is involved.

## Files/storage/imports

33. `FILE-SECURITY.md`
34. `STORAGE-RLS.md`
35. relevant `../import-export/*` and backup contracts.
36. invitation-card assets follow ordinary media/file safety rules.

## Privacy / platform access

37. `PRIVACY.md`
38. `PLATFORM-ADMIN-ACCESS.md`
39. `GUEST-COMMUNICATIONS-SECURITY.md` — contact/RSVP/message minimization, tracking defaults and capability-token rules.
40. public web/SEO/export privacy contracts where applicable.

## Provider/webhook security

For Email/SMS/WhatsApp work, additionally read:

- `GUEST-COMMUNICATIONS-SECURITY.md`;
- `GUEST-COMMUNICATIONS-AUTHORIZATION.md`;
- `SECRET-MANAGEMENT.md`;
- `WEB-PROTOCOL-SECURITY.md`;
- `../features/COMMUNICATIONS.md`;
- `../operations/COMMUNICATION-PROVIDER-OPERATIONS.md`;
- selected provider's official webhook/signature documentation at implementation time.

No provider SDK/API can be integrated before its authentication, signature, idempotency, retry, privacy and cost-abuse behavior are reviewed.

## Supply chain / repository

41. `SUPPLY-CHAIN.md`
42. `SECRET-MANAGEMENT.md`
43. CI/CD and quality-gate contracts.

## Verification

44. `ASVS-MATRIX.md`
45. `../quality/SECURITY-TESTING.md`
46. `../quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`
47. `../reviews/SECURITY-HARDENING-REVIEW.md`
48. `../reviews/AUTHORIZATION-DESIGN-REVIEW.md`

## Non-negotiable authorization rule

Every project-member access decision is based on:

`authenticated identity + current project membership + explicit permission + relationship/attribute constraints + domain invariants + required auth assurance`.

Project role is a centrally mapped permission bundle. Feature code must not implement authorization by scattered `if role === ...` branches.

Guest RSVP capability authorization is intentionally different: validated capability token + narrow household scope + explicit allowed fields/actions. It never inherits project-member rights.

## Non-negotiable injection rule

Untrusted data is **data**, never executable syntax.

- no concatenated SQL;
- no raw user SQL/query fragments;
- no `eval`/`new Function`;
- no arbitrary user HTML/SVG execution;
- no arbitrary user regex execution;
- no unsafe deep merge into configuration/security state;
- no privileged arbitrary server-side URL fetch without SSRF design;
- no custom crypto/password/token implementation;
- no arbitrary executable message-template expressions.

## Guest token rule

- CSPRNG only;
- high entropy;
- hash at rest;
- raw token absent from DB/logs/analytics/repo;
- expiry/revocation/rotation;
- generic invalid-link errors;
- no unrelated third-party resource requests that receive token/referrer;
- no generic anonymous CRUD on private project tables.

## Outbound communication rule

- official provider APIs only;
- secrets server-side;
- preview/frozen audience before send;
- stable idempotency;
- authenticated/deduplicated webhooks;
- send/cost caps;
- no automatic paid-plan escalation;
- no email tracking pixel by default;
- no WhatsApp Web/personal-account automation.

## Public-ready rule

The private V1 has two owners, but security tests use multiple projects, unrelated users, owner/editor/viewer roles, revoked members, cross-project adversarial requests and capability-link attacks.

Public activation may add provisioning/roles, but it may not weaken tenant isolation, guest-capability isolation, validation, anti-abuse or server-side permission checks.

## Security review trigger

A new attack surface automatically reopens security design for that surface. Examples:

- new Auth/OAuth provider;
- public guest capability endpoint;
- Email/SMS/WhatsApp provider;
- new webhook/callback source;
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