# Production Bootstrap, Signup and Partner Invitation

Status: **Normative V1 security/operations contract**

Mariage OS V1 is a private single-couple deployment. The static application may be publicly reachable, but production is **not** a public SaaS onboarding surface.

## 1. Authentication method

V1 primary login is:

- verified email account through Supabase Auth;
- password authentication for ordinary sign-in/recovery;
- TOTP MFA enrolled for both production owners before real-data cutover.

Passwordless provider features may be added later, but V1 correctness cannot depend on a custom email-sending backend.

## 2. Bootstrap sequence

1. Deploy Cloudflare Pages and empty Supabase production project.
2. Keep production project data empty.
3. Temporarily allow controlled Auth registration for owner bootstrap.
4. Intended first owner registers/verifies email and signs in.
5. Database command `create_initial_project` (logical name; migration may choose exact function name) succeeds only when deployment has no existing project and caller satisfies bootstrap state.
6. Transaction creates project + active owner membership atomically.
7. First owner creates a one-time partner invitation.
8. Partner registers/verifies the exact invited email if no account exists.
9. Partner signs in and accepts invitation token.
10. Acceptance atomically validates token hash/expiry/email and creates one active owner membership.
11. Both owners enroll/verify TOTP MFA and recovery plan.
12. Operator disables unrestricted new Auth signups in Supabase production configuration.
13. Project creation remains locked to additional unrelated projects.

Normal production thereafter has exactly the intended project and owners unless a deliberate administrative recovery/change flow occurs.

## 3. Invitation token design

Invitation creation is an authorized database operation; no service-role secret is shipped to the browser.

Server/database operation:

- authenticates owner membership;
- normalizes intended email;
- generates cryptographically strong random token material;
- stores only a one-way cryptographic hash of token;
- stores expiry, project, role and inviter;
- returns raw token once to the owner client;
- owner can manually share generated invite link with partner.

Raw token must never enter activity logs, diagnostics, public GitHub or persistent client telemetry.

## 4. Acceptance

Authenticated partner opens invitation link and invokes acceptance command with raw token.

Command verifies:

1. token hash matches one active unexpired invitation;
2. invitation is not revoked/accepted;
3. authenticated provider email is verified;
4. normalized authenticated email equals invited email;
5. invitation project still exists;
6. role is allowed;
7. no conflicting existing membership exists.

Then transaction:

- creates/activates membership exactly once;
- marks invite accepted;
- records accepted user/time;
- prevents token reuse.

A repeated successful request returns idempotent success, not a duplicate membership.

## 5. Wrong-account and expired invite UX

Never leak full intended email to an unrelated account. Show a generic message that invitation cannot be accepted by current account and allow logout/relogin.

Expired/revoked invite does not expose project data and can be reissued by existing owner.

## 6. Signup lock and free-tier abuse protection

After both owners are enrolled, unrestricted signup is disabled operationally. Even if an unrelated authenticated account somehow exists, DB project-creation and membership rules prevent it from creating/reading the couple's project.

This protects the free-tier resource budget from arbitrary public project creation.

For future authorized replacement/addition:

- existing owner/operator deliberately reopens controlled signup if required;
- issue invitation first;
- complete acceptance/MFA;
- close signup again.

## 7. Recovery

Provider-supported password/email recovery is used. There is no custom bypass that grants membership because someone knows a project ID.

MFA loss follows validated provider recovery/second-factor policy. Both owners must test the recovery runbook before cutover.

## 8. Local cache on logout

Normal logout is privacy-preserving:

- if pending unsynced edits exist, user must sync, explicitly export/recover them, or explicitly discard after strong warning;
- logout never silently drops pending work;
- after safe completion of logout, private project IndexedDB/cache/media for that browser profile is purged;
- non-sensitive app shell/assets may remain cached;
- user can separately clear all app local data.

Remote session revocation cannot guarantee remote deletion of already cached bytes on a stolen offline device; this residual risk is documented and relies on device OS security.

## 9. Required tests

- initial project creation only once;
- atomic owner creation;
- unauthorized account cannot create second project;
- invitation token hash only persisted;
- token expiry/revocation;
- wrong verified email denied;
- token replay idempotent/no duplicate membership;
- unrelated account direct RLS access denied;
- signup lock operational checklist;
- logout with pending edits cannot silently lose work;
- successful logout purges private local cache;
- both owners MFA before cutover.