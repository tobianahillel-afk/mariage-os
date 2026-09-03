# Production Bootstrap, Signup and Partner Invitation

Status: **Normative V1 private-deployment security contract; public-ready provisioning boundary preserved**

Mariage OS V1 is a private single-couple **deployment policy**, not a single-tenant domain architecture. The application/domain remains multi-project capable according to `architecture/PUBLIC-SAAS-READINESS.md` and `domain/TENANCY-MODEL.md`.

The static application may be publicly reachable, but private V1 production is **not** a public SaaS onboarding surface.

---

## 1. Authentication method

V1 primary identity uses:

- verified email account through Supabase Auth;
- a supported browser-safe Supabase sign-in mechanism selected in Lot 1;
- TOTP MFA enrolled for both production owners before real-data cutover;
- provider-supported secure recovery.

The exact ordinary sign-in UX can evolve without changing tenant/membership semantics.

No browser-held service-role/privileged secret is permitted.

---

## 2. Provisioning architecture

Project provisioning and project membership are separate concepts.

A `ProjectProvisioningService` application boundary exists even in private V1.

### Private `private_pair` policy

Ordinary unrelated users cannot create projects.

A controlled bootstrap operation provisions the intended initial project and owner.

### Future `public_saas` policy

The same logical provisioning boundary may allow verified users to create isolated projects after abuse/consent/entitlement checks.

**Important:** private V1 must not encode “the database can contain only one project” as a schema/RLS/domain invariant. The restriction is deployment policy.

---

## 3. Private V1 bootstrap sequence

1. Deploy Cloudflare Pages and empty Supabase production project.
2. Keep production wedding data empty.
3. Put deployment policy in controlled private/bootstrap state.
4. Intended first owner registers/verifies email and signs in using the supported Auth flow.
5. Controlled provisioning operation verifies that this deployment is authorized for initial private bootstrap.
6. Transaction creates the intended project + active owner membership atomically.
7. Deployment policy closes ordinary unrelated project provisioning.
8. First owner creates a one-time partner invitation.
9. Partner registers/verifies the exact invited email if no account exists.
10. Partner signs in and accepts invitation token.
11. Acceptance atomically validates token hash/expiry/email and creates one active owner membership.
12. Both owners enroll/verify TOTP MFA and recovery plan.
13. Unrestricted public self-service signup/project creation remains disabled in private production.

Normal private production thereafter has the intended couple/project unless a deliberate recovery or deployment-mode change occurs.

The provisioning implementation must be written so future public mode can authorize additional projects without replacing the wedding-domain schema.

---

## 4. Invitation token design

Invitation creation is an authorized database/control-plane operation; no service-role secret is shipped to the browser.

Operation:

- authenticates membership/permission;
- normalizes intended email;
- generates cryptographically strong random token material;
- stores only a one-way cryptographic hash of token;
- stores expiry, project, role and inviter;
- returns raw token only through the intended controlled flow;
- private V1 may let owner manually share generated invite link with partner.

Raw token must never enter activity logs, diagnostics, public GitHub or persistent client telemetry.

Future public automated email delivery uses server-side/provider credentials and rate/abuse limits; the token persistence model remains unchanged.

---

## 5. Acceptance

Authenticated invitee opens invitation link and invokes acceptance command with raw token.

Command verifies:

1. token hash matches one active unexpired invitation;
2. invitation is not revoked/accepted;
3. authenticated provider email is verified;
4. normalized authenticated email equals invited email;
5. invitation project still exists;
6. requested role is allowed;
7. no conflicting existing membership exists.

Then transaction:

- creates/activates membership exactly once;
- marks invite accepted;
- records accepted user/time;
- prevents token reuse.

A repeated successful request returns idempotent success, not a duplicate membership.

---

## 6. Wrong-account and expired invite UX

Never leak full intended email to an unrelated account. Show a generic message that invitation cannot be accepted by the current account and allow logout/relogin.

Expired/revoked invite does not expose project data and can be reissued by an authorized member.

Public scale later adds invite issuance/resend throttling from `security/PUBLIC-ABUSE-PROTECTION.md`.

---

## 7. Private signup lock / future public activation

### Private V1

Unrelated project provisioning is denied by trusted policy/server/database control. Even if an unrelated Auth account exists, RLS/project-creation rules prevent it from creating/reading the couple's project.

This protects private free-tier resources.

### Future public SaaS

Do **not** reuse the private one-project bootstrap check as the public provisioning rule.

Public launch uses the public-ready provisioning service with:

- verified identity;
- CAPTCHA/bot protection;
- rate limits;
- legal consent/eligibility;
- project entitlement/quota;
- atomic project + initial membership creation.

See `operations/PUBLIC-LAUNCH-GATE.md`.

---

## 8. Recovery

Provider-supported password/email recovery is used. There is no custom bypass that grants membership because someone knows a project ID.

MFA loss follows validated provider recovery/second-factor policy. Both production owners test the recovery runbook before cutover.

Future public support/recovery never obtains access by silently granting itself ordinary project-owner membership.

---

## 9. Local cache on logout

Normal logout is privacy-preserving:

- if pending unsynced edits exist, user must sync, explicitly export/recover them, or explicitly discard after strong warning;
- logout never silently drops pending work;
- after safe completion of logout, private project IndexedDB/cache/media for that browser profile is purged according to local-data policy;
- non-sensitive app shell/assets may remain cached;
- user can separately clear all app local data.

Multi-project/account readiness:

- cache is partitioned by account + project;
- switching projects cannot expose another project partition;
- explicit logout/account switch cannot expose previous account private cache;
- pending mutations retain original project scope.

Remote session revocation cannot guarantee remote deletion of already cached bytes on a stolen offline device; this residual risk is documented and relies on device OS security.

---

## 10. Required private-V1 tests

- controlled initial private project provisioning;
- atomic owner creation;
- unrelated account cannot provision project in private mode;
- tenant schema can still contain multiple synthetic projects in test environment;
- one synthetic user can belong to multiple synthetic projects without data collision;
- invitation token hash only persisted;
- token expiry/revocation;
- wrong verified email denied;
- token replay idempotent/no duplicate membership;
- unrelated account direct RLS access denied;
- project-scoped route/cache behavior;
- logout with pending edits cannot silently lose work;
- successful logout purges private local state according to policy;
- both real owners MFA before cutover.

---

## 11. Public-readiness invariant

A developer must be able to replace the private provisioning policy with the public protected provisioning policy **without rewriting**:

- `projects`;
- `project_members`;
- project-scoped domain tables;
- RLS isolation;
- Storage isolation;
- IndexedDB project partitioning;
- ordinary wedding CRUD services.

If public activation requires such a rewrite, this V1 architecture contract has been violated.
