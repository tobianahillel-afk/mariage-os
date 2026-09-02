# Authentication Policy

Status: **Normative V1 authentication contract**

Detailed production bootstrap/invitation flow: `BOOTSTRAP-INVITATIONS.md`.

## Goals

Authentication must remain simple for the two owners while protecting personal, financial and contractual data.

## Provider

Use Supabase Auth. Mariage OS does not implement password hashing, token cryptography or recovery secrets itself.

## V1 primary authentication

V1 production uses:

- verified email identity;
- password authentication for ordinary sign-in/recovery;
- TOTP MFA for both active project owners before real wedding data cutover.

Each partner has an individual account. Shared credentials are prohibited as normal operation because they break attribution, revocation, personal ratings/preferences and secure recovery.

## Closed deployment

Mariage OS V1 is a single-couple deployment rather than public self-service SaaS.

After controlled creation of the two intended owner accounts/project, unrestricted new Auth signup is disabled operationally. Database project creation also remains locked from unrelated users.

See `BOOTSTRAP-INVITATIONS.md`.

## MFA

Both production owners must reach TOTP MFA enrollment/verification before V1 cutover.

Sensitive operations require strong/recent authentication according to capability and risk, including:

- project permanent deletion;
- owner/member changes;
- complete sensitive backup export;
- destructive replace/restore;
- other security-critical administration.

If provider session exposes assurance level, `aal2` is required where specified. UI may not simulate strong authentication purely client-side.

## Recovery

Before real-data cutover both owners validate recovery for:

- forgotten password;
- changed/lost authenticator;
- changed email;
- stolen/untrusted device;
- revocation of sessions;
- backup/secondary MFA factor according to provider-supported policy.

No custom bypass may grant project access merely because a person knows project metadata.

## Sessions

Trusted personal devices may remain signed in according to secure provider defaults, but:

- auth session is never equivalent to project membership;
- revoked membership loses future cloud authorization immediately according to RLS/token refresh behavior;
- critical actions require recent/strong auth;
- session expiry never deletes pending local work;
- reauthentication must re-check project membership before queued sync resumes.

## Login UX

Requirements:

- clear Mariage OS identity;
- verified-email/password flow;
- accessible generic error messages;
- no internal provider/DB detail leakage;
- return to intended safe internal route after successful login;
- invalid/expired invite handled without leaking project data;
- offline signed-out state does not show cached private content.

## Partner invitation

Invitation is not an Auth admin/service-role call from browser. V1 uses the client-safe one-time hashed token flow defined in `BOOTSTRAP-INVITATIONS.md`.

The invitation is bound to:

- project;
- intended verified email;
- allowed role;
- expiry/revocation;
- one-time acceptance.

Wrong identity/token replay cannot create membership.

## No secrets in frontend

Only browser-safe Supabase project/public credentials may ship in bundle. Secret/service-role credentials are forbidden in frontend, static hosting configuration exposed to client, repository, logs or tests.

## Device identity

A generated local device UUID may support synchronization/audit diagnostics but is **not** an authentication factor and cannot grant access.

## Logout and local private cache

V1 policy is frozen:

1. stop realtime/new cloud writes;
2. if pending unsynced work exists, user must synchronize, explicitly export/recover it, or explicitly discard after strong warning;
3. logout never silently discards pending work;
4. after safe logout, private project IndexedDB/cache/media for that browser profile is purged;
5. non-sensitive static PWA shell may remain cached;
6. a separate clear-local-data action is available/possible.

Remote session revocation cannot remotely erase bytes already present on a stolen offline device. This residual risk relies on device OS security and is documented.

## Account/email changes

Use provider-supported verified flow. After identity change, invitation/member relation remains tied to immutable Auth user ID while display/contact email updates through provider-confirmed identity.

## Tests

Required auth tests:

- anonymous access denied;
- valid email/password login;
- unverified/invalid credential behavior;
- session expiry with pending offline edit;
- reauth resumes sync only after membership revalidation;
- TOTP enrollment/challenge;
- strong-auth protected action;
- partner invitation accepted once;
- wrong account/expired/revoked token denied;
- removed/revoked member loses access;
- owner-preservation rules;
- signup lock/additional project creation denied;
- logout pending-work safeguard;
- logout purges private local cache;
- no service-role secret exists in client build.