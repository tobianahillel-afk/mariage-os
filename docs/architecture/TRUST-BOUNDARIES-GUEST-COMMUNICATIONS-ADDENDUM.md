# Mariage OS — Trust Boundaries Addendum: Guest Communications

Status: **NORMATIVE V1 TRUST-BOUNDARY ADDENDUM**

## New external actors/boundaries

### Guest browser

Untrusted Internet client holding one invitation capability token. It is not a project member and is never trusted with private app APIs/data.

### Invitation capability token

Secret bearer capability that identifies one narrow household invitation scope. Possession is authorization only for explicitly allowlisted guest RSVP operations while active.

### Communication provider

External Email/SMS/WhatsApp delivery service. Trusted only for provider-specific delivery functions after authenticated API use. Provider responses/events are still parsed/validated and do not define project authorization.

### Provider webhook endpoint

Public Internet endpoint. Request is untrusted until provider signature/authentication succeeds. Even after verification, payload fields are provider claims to normalize/reconcile, not arbitrary database commands.

### Email/SMS/WhatsApp recipient device

External endpoint outside Mariage OS control. Messages/links can be forwarded/screenshot. Therefore guest capability scope must remain minimal and revocable.

## Data crossing boundaries

### Private app → provider

Only required delivery data:
- destination;
- rendered message/template variables;
- provider callback/correlation identifier;
- minimal sender metadata.

Do not send private budget/internal guest notes/probabilities/project secrets to provider.

### Provider → webhook

Accept only documented callback/event data after authenticity verification. Normalize to internal states.

### Guest browser → guest API

Accept:
- capability token;
- allowlisted RSVP fields;
- idempotency/revision metadata.

Do not accept project membership/role claims from guest browser.

### Guest API → guest browser

Return minimal guest-safe DTO only.

## Referrer/resource boundary

Because RSVP token can appear in URL path, guest portal uses restrictive Referrer-Policy and avoids unnecessary third-party resources. No analytics/ad pixels that could receive token/referrer.

If remote decorative assets are used, they must not carry private/token data in URL/referrer and should be proxied/self-hosted only after appropriate security/privacy review.

## Provider SDK boundary

Provider SDK belongs in infrastructure/runtime server boundary. It never crosses into:
- domain types;
- UI bundle;
- client IndexedDB;
- canonical project export.

## Scheduler boundary

Authoritative scheduled dispatch is server-side durable infrastructure. Browser/PWA/service worker is not trusted to execute paid external sends reliably/uniquely.

## Secret boundary

Provider credentials/webhook secrets live in environment/secret management. Project owners may configure provider integration through privileged UI/commands, but browser never receives reusable provider secret.

## Public SaaS boundary

Future public tenants share platform provider infrastructure only through tenant-scoped policy/caps. One tenant cannot view/consume another tenant's campaign/recipient/provider state.

## Failure assumptions

Assume:
- messages can be delayed/duplicated/reordered;
- provider callbacks can be delayed/duplicated/reordered;
- guest links can be forwarded;
- browser can tamper with every request field;
- provider can be unavailable;
- network acknowledgement can be lost after successful send/RSVP commit.

Architecture must remain correct under those assumptions.