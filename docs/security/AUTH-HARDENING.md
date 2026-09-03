# Authentication Hardening, Rate Limits and Token Safety

Status: **Normative V1/public-ready authentication hardening contract**

This document complements `AUTHENTICATION.md`, `BOOTSTRAP-INVITATIONS.md` and authorization documents.

## 1. Provider security boundary

Mariage OS uses Supabase Auth. We do not implement:

- password hashing/storage;
- access/refresh token signing;
- TOTP cryptography;
- email verification token generation;
- password-reset secret generation.

Provider configuration is security-sensitive configuration and receives versioned checklist/evidence before real-data cutover and public launch.

## 2. Anti-brute-force / anti-automation

Supabase Auth provider rate limiting must remain enabled and be reviewed against current provider defaults/capabilities before release.

Required review covers at least:

- login/token endpoint behavior;
- verification requests;
- OTP/magic-link sends if enabled;
- password recovery;
- MFA challenge/verification;
- signup/provisioning if public activation occurs.

Application behavior:

- handle `429 Too Many Requests` safely;
- do not immediately retry in a tight loop;
- use bounded exponential backoff/jitter where automatic retries are appropriate;
- user-visible messaging does not reveal internal counters or facilitate account enumeration;
- custom frontend cannot bypass provider limits by calling a different equivalent endpoint.

Before public self-service activation, add CAPTCHA/Turnstile or equivalent provider-supported anti-bot control to signup/recovery/abuse-prone flows where appropriate, and add application/project quotas around project creation/upload/import.

## 3. Password mode if selected

If password sign-in is chosen for V1/public product:

- email verification required;
- provider minimum password length configured to a strong value appropriate to current guidance/product UX rather than simply accepting a weak minimum;
- for the two private V1 owners, if password mode is chosen, target a long unique passphrase/password-manager generated secret (recommended product configuration target: at least 14 characters unless Lot 1 security review selects a stronger current provider-compatible policy);
- support long passwords/passphrases/password managers;
- do not impose arbitrary periodic password rotation absent compromise;
- no custom complexity checker that encourages predictable patterns unless required by provider policy;
- leaked-password screening may be enabled when supported by the active provider plan, but security architecture must remain acceptable without a paid-only feature;
- password reset/change uses provider verified/recent-auth flows.

The final numeric password policy and Auth mode are recorded in production configuration evidence, because provider capabilities and public-product UX can evolve.

## 4. PKCE / redirect flows

If auth uses email links, OAuth/social providers or another redirect/code flow, prefer/provider-enable PKCE according to Supabase-supported flow.

Requirements:

- one-time authorization code exchanges are handled by the official SDK/provider flow;
- exact allowed redirect URLs are configured;
- callback route is dedicated/minimal;
- authorization code/token-like query values are removed from normal app navigation/history after exchange where feasible;
- failed/stale/replayed codes fail safely;
- overlapping-flow edge cases are tested if relevant to chosen SDK configuration.

Do not invent a custom OAuth flow when the provider supports the required browser flow.

## 5. MFA

For the two real V1 owners:

- TOTP MFA enrollment and challenge verified before source-of-truth cutover;
- sensitive privileged commands verify strong assurance server-side where provider data permits;
- UI showing “MFA verified” is not authoritative;
- factor enrollment/removal is itself security-sensitive and logged/audited safely;
- recovery/lost-factor procedure is tested before cutover;
- because Supabase does not rely on classic recovery codes for Auth MFA and supports multiple factors, each owner should enroll/test a **separate backup TOTP factor** before real-data cutover where provider/browser flow supports it; backup factor/device/secret must not be stored in the same failure domain as the primary factor.

For future public users, MFA policy may vary by plan/use case but owner/account-security architecture remains ready for it.

## 6. Session / refresh-token behavior

- access token lifetime/refresh behavior uses provider-supported SDK/session handling;
- application code does not implement token refresh cryptography manually;
- Supabase refresh-token rotation/reuse-detection security defaults are preserved unless an explicit security review demonstrates a reason to change them;
- retry logic avoids refresh storms across tabs/devices;
- logout stops realtime/cloud mutation flow before local purge;
- session expiry never silently discards offline work;
- stolen/revoked membership cannot regain project rights from stale cached role information;
- account password/security changes that invalidate sessions are handled as a normal reauthentication path.

Provider features for maximum session lifetime/single-session enforcement may depend on plan and are not assumed available on the free V1 tier.

A pure browser SPA necessarily has JavaScript-accessible session material through the provider client architecture. Therefore XSS prevention (safe DOM, CSP, Trusted Types where compatible, minimal third-party script surface) is a critical token-theft control. If a future risk review requires HttpOnly server-managed session cookies, that would be a deliberate architecture change with CSRF/BFF implications rather than an ad hoc patch.

## 7. Token storage

No raw access/refresh/MFA/invite token is written into:

- application logs;
- activity records;
- diagnostic exports;
- query strings we control after auth completion;
- analytics/tracking;
- GitHub issues/screenshots/fixtures.

Use the provider SDK's supported persistence/storage mechanism for the chosen client architecture. Do not copy auth tokens into extra localStorage/IndexedDB fields for convenience.

Auth token storage is separate from project data cache. Purging project cache does not implement token revocation; signing out/revoking session uses Auth semantics.

## 8. Account enumeration

Signup/login/recovery/invite UX must avoid unnecessary disclosure such as:

- whether an unrelated email belongs to a Mariage OS account;
- whether a project exists for a guessed identifier;
- whether an invitation exists for an unauthorized observer.

Where provider behavior reveals unavoidable information to the email owner, the UI/API still avoids amplifying it to arbitrary callers.

## 9. Recovery

Before production cutover:

- both owners test recovery from ordinary sign-in loss;
- both owners test primary-TOTP-loss using the configured backup factor/recovery path;
- backup TOTP factor is independent from the primary failure domain;
- owner/project access cannot be restored by a custom secret question, project name, wedding date or support-only backdoor;
- platform support/admin cannot silently bypass membership/authentication rules.

## 10. Invitation security

Partner/public project invitations are bearer-like capability links until exchanged. Therefore:

- use cryptographically random token;
- store only hash server-side;
- one-time atomic acceptance;
- expiry/revocation;
- bind intended role/project/email where applicable;
- do not log raw token;
- strip token from normal browser-visible navigation/history after successful acceptance where feasible;
- rate-limit invitation creation/accept attempts.

## 11. Production evidence

Security evidence records:

- enabled Auth providers;
- email verification setting;
- signup/provisioning mode;
- chosen flow type (password / PKCE link / OAuth etc.);
- configured redirect allowlist;
- password policy if applicable;
- MFA configuration + backup factor result;
- refresh-token rotation/reuse-detection configuration review;
- rate-limit review results;
- CAPTCHA/Turnstile state where applicable;
- recovery test result;
- no-secret client-build test result.

## 12. Required adversarial tests

- repeated invalid login/brute-force simulation within safe test environment;
- 429/backoff behavior;
- unknown account/recovery enumeration behavior;
- invalid/unverified identity;
- reused/expired auth code;
- malicious/open redirect;
- invite replay/wrong identity;
- MFA bypass attempt;
- primary-factor-loss/backup-factor recovery drill;
- stale JWT after membership revoke;
- refresh-token replay/reuse behavior follows provider-supported security model;
- old session after role downgrade;
- explicit logout with pending offline work;
- raw token search in logs/build/URLs/diagnostic output.
