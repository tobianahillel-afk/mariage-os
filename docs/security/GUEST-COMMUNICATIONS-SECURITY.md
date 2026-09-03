# Mariage OS — Guest Links & Outbound Communications Security

Status: **NORMATIVE V1 SECURITY CONTRACT**

## Threat model additions

Applicable risks include:

- invitation-token guessing/enumeration;
- leaked links from forwarded messages/screenshots;
- cross-household IDOR/BOLA;
- unauthorized +1/person creation;
- brute-force token resolution;
- replayed RSVP submissions;
- malicious field payloads/XSS;
- campaign audience expansion after preview;
- duplicate sends on retry;
- forged provider webhooks;
- leaked provider credentials;
- SMS/WhatsApp abuse/spam;
- malicious/invalid phone/email inputs;
- provider callback SSRF/open redirect if implemented incorrectly;
- cost explosion/resource exhaustion;
- contact/RSVP PII leakage in logs;
- accidental exposure of internal guest priority/probability;
- phishing/spoofing from unauthenticated email domains.

## Token requirements

Invitation capability tokens:

- CSPRNG only;
- at least 128 bits of effective entropy; prefer 192+ bits;
- URL-safe encoding;
- raw value returned only at creation/rotation boundary;
- only cryptographic hash stored server-side;
- no token in logs, analytics, referrer, crash reports or activity payloads;
- rotation revokes old token;
- link can expire/revoke independently of guest record;
- generic invalid/expired/revoked UI to reduce enumeration.

If token appears in path, guest portal MUST set restrictive referrer policy and must not load uncontrolled third-party resources that could receive it.

## Guest endpoint isolation

Anonymous/capability access must be implemented through a narrow public API/RPC boundary, not generic anonymous table CRUD.

The guest DTO is allowlisted. Every mutation is constrained by resolved `invitation_link_id + household_id` and server-side allowances.

Never accept household/project identity from the request as authoritative when it can be derived from the validated token.

## Rate limiting / abuse

Separate limits for:

- token lookup;
- RSVP submit;
- link rotation;
- QR/link generation;
- campaign preview;
- campaign send;
- provider webhook ingestion.

Rate-limit state must not leak whether a guessed token exists.

Public SaaS mode additionally requires platform-level abuse/tenant limits.

## Input security

All guest input passes central runtime schemas and domain validation.

Text rendered as text. No guest HTML/Markdown execution.

Bound lengths for names/messages/dietary/logistics fields.

Phone validation/normalization is server-verified before automatic send eligibility.

## Idempotency/concurrency

RSVP submissions and outbound sends require idempotency keys. Concurrent edits use revision/precondition rules; last-write-wins is not assumed for household composition changes.

## Provider credentials

- server-side only;
- never GitHub/browser/localStorage/IndexedDB/project export;
- environment/secret store;
- least privilege where provider supports it;
- rotation procedure documented;
- separate test/production credentials where practical.

## Webhook authenticity

Use provider's documented signature/authentication mechanism. Verification happens before parsing into trusted domain events.

Also enforce:

- HTTPS;
- request size limit;
- supported content type;
- timestamp/replay defense when provider supports it;
- event deduplication;
- provider-message mapping to stored recipient row;
- no arbitrary URL fetch from webhook payload;
- privacy-minimized logs.

## Email security/deliverability

Production sending domain must be authenticated. Configure SPF/DKIM and DMARC alignment appropriate to selected provider/domain. Bounce/complaint signals are processed and invalid destinations suppressed.

No user-supplied arbitrary From domain.

## WhatsApp/SMS compliance boundary

Mariage OS uses official provider APIs only. It does not bypass template, consent, throughput, sender-identity or quality restrictions.

The application stores only the consent/eligibility evidence it actually needs; it does not claim legal compliance automatically. Public SaaS launch requires jurisdiction/provider legal review.

## Privacy

Contact data and RSVP data are personal data. Apply least privilege:

- guest contacts excluded from unrelated exports;
- guest-facing portal receives only minimal DTO;
- communication bodies omitted from normal diagnostic logs;
- provider message IDs are not authorization tokens;
- raw provider webhook payload retention disabled by default;
- read/open analytics minimized; tracking pixels off by default.

## Cost / denial-of-wallet

Because SMS/WhatsApp/email can incur external cost:

- explicit provider setup;
- per-campaign recipient preview;
- maximum recipient cap;
- optional per-project daily/monthly send cap;
- known-cost preview where possible;
- no automatic paid-plan escalation;
- repeated failure loops bounded;
- scheduled send cancellation supported before dispatch window where provider semantics allow.

## Required adversarial tests

- random invalid tokens;
- valid token for A attempting B identifiers;
- expired/revoked token;
- token replay after rotation;
- duplicate submit idempotency;
- forbidden +1 creation;
- XSS payloads in every free-text field;
- oversized payload;
- forged webhook signature;
- replayed webhook;
- duplicate provider callback;
- destination tampering between preview/send;
- retry after provider success/local timeout;
- leaked/stale provider message ID used as access credential;
- provider cost cap exceeded;
- cross-project campaign/recipient access;
- export/log checks for token/contact leakage.