# Mariage OS — Guest Communications V1

Status: **NORMATIVE V1 FEATURE CONTRACT**

## Purpose

Provide safe, previewable and provider-neutral invitation/reminder communication by email, SMS and WhatsApp, linked to guest households and secure RSVP links.

Communications are never a generic bulk-spam engine.

## Supported V1 channels

- Email
- SMS
- WhatsApp Business Platform compatible provider
- Copy/share link and QR-code fallback

The implementation MUST use provider adapters. Guest/domain logic MUST NOT depend directly on a single vendor SDK.

Conceptual ports:

- `EmailCommunicationProvider`
- `SmsCommunicationProvider`
- `WhatsAppCommunicationProvider`
- `CommunicationStatusWebhookAdapter`

Provider selection/configuration is infrastructure, not domain truth.

## Campaign model

A campaign contains:

- project id;
- purpose/type (`invitation`, `rsvp_reminder`, `information`, `confirmation`, other allowlisted type);
- audience definition and frozen recipient snapshot;
- channel strategy;
- message template/version;
- optional invitation-card asset;
- scheduled-at or manual-send state;
- sender identity;
- cost/usage estimate when provider makes it available;
- send lifecycle and summary.

A campaign MUST support preview before sending.

## Audience safety

Audience is derived from explicit guest/household filters and then frozen for the send operation.

Before commit, show at minimum:

- number of households;
- number of destination addresses/numbers;
- missing/invalid contacts;
- duplicates;
- recipients suppressed/revoked;
- recipients without active RSVP link when link is required;
- selected language/template;
- expected provider cost when reliably knowable;
- exact sample rendering for at least one recipient.

No campaign can silently broaden its audience after preview.

## Contact normalization

Phone numbers are stored canonically in E.164 when validated. Raw user-entered display form may be retained separately if useful.

Email addresses are normalized conservatively; do not invent mailbox semantics by destructive lowercasing of local parts beyond provider-safe rules.

Each household/person contact point records provenance and verification state where available.

## Personalization

Templates may use an allowlisted variable set such as:

- household display name;
- wedding display name;
- event date;
- RSVP deadline;
- secure household RSVP URL;
- configured public wedding details.

Arbitrary template expressions/code are forbidden.

Missing required template variables block send rather than rendering internal identifiers or placeholders.

## Email

Email provider integration must support:

- authenticated sending domain;
- SPF/DKIM and DMARC-aligned production configuration;
- bounce/complaint handling where provider supports it;
- delivery event ingestion;
- no tracking pixel by default;
- plain-text fallback;
- accessible HTML templates;
- unsubscribe/suppression semantics when legally/applicably required.

Invitation emails are never sent from an unauthenticated spoofable From domain in production.

## SMS

SMS integration must support:

- validated destination numbers;
- message-segment/cost preview where provider makes it available;
- delivery/failure callbacks;
- sender identity according to country/provider rules;
- retry policy that does not duplicate successful sends;
- suppression of repeatedly invalid destinations.

## WhatsApp

WhatsApp sending must use an official Business Platform-compatible provider/API, not browser automation or personal-account scraping.

V1 contract includes:

- approved/eligible outbound templates where required by platform policy;
- destination consent/eligibility metadata required for lawful/provider-compliant sending;
- variables rendered only through approved template slots;
- webhook-based delivery state ingestion;
- provider-native read state only when legitimately supplied; no artificial tracking;
- rate/quality/error handling;
- no attempt to evade provider restrictions.

## Send lifecycle

Canonical logical lifecycle:

- `draft`
- `preview_ready`
- `scheduled`
- `sending`
- `partially_sent`
- `sent`
- `completed`
- `cancelled`
- `failed`

Per-recipient attempt states are normalized from provider-specific states, for example:

- `pending`
- `accepted`
- `sent`
- `delivered`
- `read` (only where provider supplies it)
- `failed`
- `suppressed`

Provider raw state may be retained for diagnostics, but product logic uses canonical normalized states.

## Idempotency and retries

Every logical send has a stable idempotency key. Provider callbacks are deduplicated. Retrying a transient failure must never create duplicate logical communications.

A successful provider send is not retried just because a later local acknowledgement was lost.

## Webhooks

Webhook ingestion must:

- validate provider signature/authenticity using provider-supported mechanism;
- enforce body-size limits;
- parse with runtime schemas;
- reject unknown/untrusted event structure;
- deduplicate event IDs;
- record event time separately from receive time;
- never trust project/recipient IDs supplied by an unverified payload;
- map provider identifiers through server-side stored references;
- avoid logging message body/contact secrets unnecessarily.

## Cost / zero-cost architecture

Core Mariage OS can remain zero-cost, but outbound SMS/WhatsApp/email providers may charge usage fees or require paid tiers.

Therefore:

- channels are disabled until explicitly configured;
- no automatic paid upgrade/overage is enabled by Mariage OS;
- preview surfaces known/estimated external cost;
- configurable campaign caps prevent accidental high-volume sending;
- provider credentials remain server-side secret configuration;
- manual copy/share/QR remains a fallback when no paid provider is configured.

## QIF — Quick & Intuitive Flow

The couple-side campaign flow MUST be understandable as:

`Choose purpose → choose audience → choose channel/template → preview → send/schedule → track`.

Requirements:

- no provider jargon in the primary UI;
- one primary CTA per step;
- audience count always visible before send;
- risky gaps (missing phone, no consent, invalid email, missing RSVP token) shown before confirmation;
- bulk send confirmation names the channel and exact recipient count;
- progress and partial failure are understandable;
- failed recipients can be retried selectively;
- user can jump from campaign result to affected household;
- communications timeline is accessible from household detail.

## Non-goals

- cold marketing to arbitrary contacts;
- importing scraped phone lists;
- automatic messaging to people not represented in authorized project data;
- WhatsApp Web automation;
- hidden read/open tracking;
- sending without preview/recipient snapshot;
- embedding provider secrets in frontend code.