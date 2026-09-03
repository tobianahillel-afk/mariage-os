# Mariage OS — Guest Communications Authorization

Status: **NORMATIVE V1 AUTHORIZATION ADDENDUM**

## Project-member permissions

Add stable permission keys:

- `guest_contacts.read`
- `guest_contacts.write`
- `guest_invitations.read`
- `guest_invitations.manage`
- `communications.read`
- `communications.draft`
- `communications.send`
- `communications.retry`
- `communications.templates.manage`
- `communications.provider_settings.manage`
- `communications.suppressions.manage`

## Default role bundles

### Owner

All above permissions, subject to recent-auth/MFA for provider-secret/provider-configuration operations where required.

### Editor

Default public-SaaS-ready baseline:

- guest contacts read/write: configurable/trusted role only;
- invitation links read/manage: allowed when guest write is allowed;
- communications read/draft: allowed;
- communications send: **not granted by default** in generic public-ready role bundle; project owner may grant through future reviewed custom-role model;
- provider settings: denied.

V1 private two-owner deployment uses Owner for both partners, so both can prepare/send invitations.

### Viewer

No guest-sensitive contact data or communication send rights by default. Aggregate RSVP read may follow existing guest privacy policy, but raw phone/email/message bodies remain protected.

## Guest capability access

A guest RSVP token is NOT a role and does not call `has_project_permission()` as if it were a project member.

The guest link authorizes only the narrow guest-safe operations described by `GUEST-RSVP-PORTAL.md`.

## Privileged operations

Require server-side authorization and recent authentication/MFA where appropriate:

- configure/rotate provider credentials;
- change sender domain/identity;
- change high-volume send caps;
- enable an automatic provider in production;
- bulk-send above a configurable risk threshold;
- export full guest contacts/communication history when classified sensitive.

## Send-time authorization

A campaign draft may be created by `communications.draft`.

The actual dispatch command rechecks `communications.send` at send time. A user who lost send permission after preview cannot dispatch using a stale preview.

Scheduled sends re-evaluate project/provider policy at dispatch time. Revoked membership or disabled provider prevents send rather than relying on old creator permission.

## Household contact privacy

Contact points require explicit guest-contact permission. A user who can view aggregate guests but not contact PII receives masked/absent contact fields.

## Provider webhook identity

Provider webhooks are machine-to-machine trusted only after provider signature verification. They do not receive project-member permissions and cannot select arbitrary project scope from payload input.

## Tests

Required deny tests include:

- viewer reads phone/email;
- editor without send permission dispatches campaign;
- user A dispatches project B campaign id;
- revoked owner dispatches previously previewed campaign;
- guest token calls private communications endpoint;
- forged webhook mutates recipient state;
- provider-settings endpoint called without privileged permission/recent auth.