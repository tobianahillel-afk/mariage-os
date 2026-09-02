# Authentication Policy

Status: **Normative V1 authentication/security contract**

Detailed production bootstrap/invitation flow: `BOOTSTRAP-INVITATIONS.md`.

## Goals

Authentication must be simple for two owners while protecting personal, financial and contractual data. Provider-specific sign-in UX may evolve; identity, authorization, MFA and recovery guarantees are frozen.

## Provider

Use Supabase Auth. Mariage OS does not implement password hashing, session-token cryptography or account-recovery secrets itself.

## V1 identity/account contract

V1 requires:

- a verified email identity for each owner;
- one separate Auth account per partner;
- browser-safe provider-supported ordinary sign-in flow selected in Lot 1;
- TOTP MFA for both active owners before real-data cutover.

Exact ordinary sign-in mechanism (for example password-based flow if selected and supported) is an implementation choice listed in `DEFERRED-DECISIONS.md`; it may not weaken verified identity, recovery, bootstrap or MFA requirements.

Shared credentials are prohibited for normal operation because they break attribution, revocation, ratings/preferences and recovery.

## Closed deployment

Mariage OS V1 is a single-couple deployment, not public self-service SaaS.

Bootstrap policy permits only intended project/owner establishment. After both intended owners can authenticate and join, unrestricted signup/project creation is disabled operationally according to `BOOTSTRAP-INVITATIONS.md`. DB project creation remains protected independently from Auth signup settings.

The implementation must test the exact provider configuration so “signup disabled” never accidentally blocks the intended partner before their account/invitation flow is complete.

## MFA

Both production owners complete TOTP MFA enrollment/verification before V1 source-of-truth cutover.

Sensitive actions require strong/recent authentication according to risk/capability, including:

- permanent project deletion;
- owner/member administration;
- complete sensitive backup export where policy requires;
- destructive restore/replace;
- other security-critical administration.

If provider exposes assurance level, required commands validate it server-side. UI cannot simulate strong auth.

## Recovery

Before cutover both owners validate provider-supported recovery for the chosen sign-in mechanism and:

- lost/changed authenticator;
- changed verified email;
- stolen/untrusted device/session revocation;
- backup/secondary MFA factor according to provider-supported policy.

No custom bypass grants project access from knowledge of project metadata.

## Session semantics

Auth session is never equivalent to project membership.

### Normal/valid session

Cloud access still requires active membership/RLS.

### Token/session expiry during an established local/offline context

- pending local work remains durable;
- previously authorized cached content may remain visible according to local privacy policy;
- UI clearly shows session expired/locked for synchronization;
- no protected cloud refresh/write resumes until reauthentication + membership revalidation.

This is **not** the same as explicit logout.

### Explicit logout / fresh signed-out user

- old project context stops rendering;
- realtime/new cloud writes stop;
- pending work must be resolved safely first;
- private project cache is purged after safe logout according to local-data policy;
- a fresh signed-out/new user is never shown another user's cached project data.

### Membership revocation

Future cloud authorization is denied. An offline device may physically retain bytes until local purge/recovery, but those bytes never grant cloud rights.

## Login UX

Requirements:

- clear project/app identity;
- accessible generic error messages;
- no provider/DB internals leaked;
- verified identity handled according to chosen provider flow;
- safe return to intended internal route;
- invalid/expired invite handled without project-data leak;
- explicit offline/session-expired vs fresh-signed-out distinction.

## Partner invitation

Invitation is not implemented through a browser-exposed admin/service-role secret.

V1 one-time invitation is bound to:

- project;
- intended normalized verified email;
- allowed role;
- expiry/revocation;
- one-time acceptance/token hash.

Wrong identity/replay cannot create membership. The partner may complete the provider-supported account-creation/sign-in step needed to establish the intended verified identity during the controlled onboarding window.

## No secrets in frontend

Only browser-safe public project credentials may ship in bundle. Service-role/private secrets are forbidden in client assets, public repo, logs, browser-visible config and synthetic test output.

## Device identity

Local device UUID supports sync/audit diagnostics only. It is not authentication or trusted-device proof.

## Logout/local cache frozen policy

1. Stop realtime/new outgoing cloud actions during logout transition.
2. Inspect pending mutations/drafts/unsynced files.
3. User synchronizes, exports/recoveries, or explicitly discards where allowed.
4. Never silently discard pending work.
5. Clear visible project context.
6. Purge private project IndexedDB/cache/media for that browser profile once safe.
7. Static non-sensitive PWA shell may remain.

Remote revocation cannot erase an offline stolen device; residual device-security risk is documented.

## Account/email changes

Use provider-supported verified flow. Membership references immutable Auth user ID, not editable email text. Invitation matching uses intended verified identity during acceptance only.

## Required tests

- fresh signed-out project access denied;
- chosen ordinary sign-in flow valid/invalid/unverified cases;
- session expiry with pending offline edit;
- expired established local context remains recoverable but cannot sync;
- reauth resumes only after membership validation;
- TOTP enrollment/challenge/strong-auth command;
- invitation accepted once;
- wrong identity/expired/revoked/replayed invite denied;
- intended partner account creation works within controlled bootstrap window;
- revoked member loses cloud access;
- final-owner invariant;
- unrelated project creation denied;
- signup/project creation locked after bootstrap;
- explicit logout pending-work safeguard + private-cache purge;
- fresh signed-out/new user never sees prior local project;
- no service-role secret in client build.
