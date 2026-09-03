# Repository/Service Contracts — Public-Readiness Addendum

Status: **Normative addendum to `REPOSITORY-SERVICE-CONTRACTS.md`**

This addendum ensures application-layer contracts remain valid when Mariage OS moves from private-pair deployment to multi-tenant public SaaS.

---

## 1. `ProjectContext`

Every project-owned service/repository call is executed in explicit project context.

Conceptually:

```text
ProjectContext {
  userId
  projectId
  membershipRole
  membershipStatus
}
```

Safe deployment-mode/entitlement data may be carried separately; the browser context never substitutes for DB authorization.

Views must not rely on one global singleton “current wedding” object that cannot be switched/scoped.

---

## 2. `ProjectProvisioningService`

Separate from ordinary `ProjectService`.

Responsibilities:

- private bootstrap authorization;
- future public self-service creation policy;
- atomic project + first-owner membership creation;
- idempotency;
- deployment-mode enforcement;
- eligibility/consent/entitlement hooks;
- provisioning audit outcome.

This service is network/server-required and never queueable offline.

`ProjectService` continues to manage settings/lifecycle of an existing authorized project and must not own public signup abuse policy.

---

## 3. `ProjectMembershipService`

Membership semantics may remain inside `AuthMembershipService` implementation, but conceptually support:

- list caller-authorized project memberships;
- resolve project role;
- invitation lifecycle;
- revoke/leave membership where safe;
- last-owner protections;
- future project-chooser read model.

No method means “list all projects in system”.

---

## 4. `EntitlementPolicy`

Use a centralized capability/quota abstraction rather than feature-local hard-coded plan limits.

Conceptual checks:

```text
canCreateProject(user)
canInviteMember(project, actor)
canUploadBytes(project, bytes)
canRunLargeImport(project, complexity)
featureEnabled(project, capability)
```

Private V1 implementation may be a simple deterministic zero-cost policy.

Future public tiers/billing may replace policy data/provider without rewriting Venue/Guest/Budget/etc. services.

Entitlement denial is distinct from RLS authorization denial.

---

## 5. Public control-plane boundary

Ordinary domain repositories continue to use browser-safe Supabase APIs + RLS.

Public-only sensitive operations may require a serverless/control-plane adapter:

- project provisioning;
- Turnstile-protected public forms where provider-native Auth protection is insufficient;
- entitlement/billing webhooks;
- privileged support operations;
- transactional email dispatch beyond provider-native Auth;
- abuse-specific throttled endpoints.

Domain services must not start routing all ordinary wedding CRUD through this control plane merely because it exists.

---

## 6. `ProjectDirectoryService` future UI support

Private V1 may bypass this UI because each real owner has one project.

The read contract should still make future chooser implementation simple:

- list **only projects the authenticated user belongs to**;
- return safe project summary (id, display name, role, selected date/last accessed where allowed);
- no guest/budget/private detailed payload;
- never use a global project directory/search.

---

## 7. Regression review

A service change fails review if it:

- removes project ID from a project-owned repository boundary;
- assumes a user has one project;
- makes a globally scoped query then filters client-side;
- hard-codes private owner UUID/email;
- mixes system-admin and project-owner privileges;
- embeds plan/quota values across domain services;
- makes future public signup require replacing ordinary domain repositories.
