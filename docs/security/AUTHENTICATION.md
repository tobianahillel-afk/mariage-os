# Authentication Policy

## Goals

Authentication must be simple for two owners while providing sufficient protection for personal/financial data.

## Provider

Use Supabase Auth. Do not implement password/session cryptography ourselves.

## Primary owner accounts

Each partner uses an individual account. Shared credentials are discouraged because they break attribution, revocation and individual preferences.

## MFA

Before production data becomes authoritative, primary owners should enroll TOTP MFA where supported by the chosen Supabase configuration.

Critical administrative operations may require an `aal2`/recent strong-auth session.

Examples:

- delete entire project;
- change/remove owners;
- full sensitive backup export;
- security-sensitive membership changes.

## Recovery

Account recovery must be documented before real-data cutover.

The couple should have a practical recovery plan for:

- lost phone/authenticator;
- changed email;
- stolen/untrusted device;
- session revocation;
- backup authentication factor where platform support recommends it.

Security controls must not create an undocumented lockout path.

## Sessions

Ordinary trusted personal devices may remain signed in according to secure provider defaults. However:

- session state is never equivalent to project membership;
- membership removal must revoke future authorized data access;
- critical actions can require recent authentication;
- locally cached data remains a device-privacy consideration after cloud logout.

## Login UX

Requirements:

- clear project branding, not confusing developer auth UI;
- accessible error messages;
- rate-limit/provider errors shown without leaking internal details;
- successful login returns user to intended internal route where safe;
- invalid/expired invitation handled clearly.

## Invitations

Project membership is invitation-controlled. Creating an arbitrary account must not grant access to the couple's project.

## No secrets in frontend

Only public-client credentials intended for browser use may ship in the bundle. Service-role/secret credentials are forbidden.

## Reauthentication

For destructive/sensitive actions, require a recent authenticated state rather than relying on a session established months earlier where practical.

## Device identity

A local device UUID supports audit/sync diagnostics but is not an authentication factor.

## Tests

Cover:

- unauthenticated access;
- valid login;
- expired session;
- refresh/relogin with pending offline edits;
- MFA-gated critical operation;
- invitation acceptance;
- removed member;
- owner-preservation rules;
- logout without losing unsynchronized work metadata necessary for recovery, subject to privacy policy.
