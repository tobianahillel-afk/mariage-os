# Mariage OS Security — Start Here

Status: **Normative security documentation entry point**

Security/authorization work must not start from an isolated RLS policy or UI condition. Read the relevant contracts in this order.

## Core architecture

1. `SECURITY-ARCHITECTURE.md`
2. `THREAT-MODEL.md`
3. `THREAT-MODEL-AUTHORIZATION-ADDENDUM.md`
4. `AUTHENTICATION.md`
5. `BOOTSTRAP-INVITATIONS.md`

## Authorization / rights

6. `AUTHORIZATION-MODEL.md`
7. `ROLE-PERMISSION-MATRIX.md`
8. `AUTHORIZATION-RLS.md`
9. `RLS-MATRIX-V1.md`
10. `RLS-PERMISSION-MAPPING.md`
11. `PRIVILEGED-OPERATIONS.md`
12. `PLATFORM-ADMIN-ACCESS.md`
13. `STORAGE-RLS.md`

Physical authorization schema: `../domain/PHYSICAL-SCHEMA-AUTHORIZATION-ADDENDUM.md`.

## Other security domains

14. `FILE-SECURITY.md`
15. `FRONTEND-SECURITY.md`
16. `PRIVACY.md`
17. `PUBLIC-ABUSE-PROTECTION.md`
18. `SUPPLY-CHAIN.md`
19. `ASVS-MATRIX.md`

Quality/security tests: `../quality/SECURITY-TESTING.md` and public-readiness test contracts.

## Non-negotiable authorization rule

Every access decision is based on:

`authenticated identity + current project membership + explicit permission + relationship/attribute constraints + domain invariants + required auth assurance`.

Project role is a centrally mapped permission bundle. Feature code must not implement authorization by scattered `if role === ...` branches.

## Public-ready rule

The private V1 has two owners, but security tests use multiple projects, unrelated users, owner/editor/viewer roles, revoked members and cross-project adversarial requests.

Public activation may add provisioning/roles, but it may not weaken tenant isolation or replace server-side permission checks with UI-only rules.