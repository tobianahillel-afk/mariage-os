# Mariage OS — Communication Provider Ports

Status: **NORMATIVE V1 ARCHITECTURE CONTRACT**

## Goal

Keep guest invitation/RSVP domain independent from Email/SMS/WhatsApp vendors and SDKs.

## Layering

UI → application commands/use-cases → communication domain → provider ports ← infrastructure adapters.

Forbidden:

- UI importing Twilio/Meta/email-provider SDK directly;
- domain objects containing vendor SDK response types;
- provider webhook payload shapes becoming canonical domain models;
- browser holding provider private credentials.

## Conceptual ports

### `EmailProviderPort`

Capabilities:
- validate configuration/readiness;
- estimate/send eligibility when supported;
- send one normalized message request;
- optionally schedule/cancel when adapter/provider semantics support it;
- map provider response to stable provider reference;
- normalize webhook events/errors.

### `SmsProviderPort`

Same concepts plus segmentation/cost metadata where supported.

### `WhatsAppProviderPort`

Capabilities include provider-template reference/variable validation and official Business-compatible sending.

### `CommunicationProviderRegistry`

Resolves configured adapter by `(environment, project/channel policy)` without exposing credentials to domain/UI.

### `CommunicationSchedulerPort`

Durable server-side scheduling/dispatch trigger. Browser timer is not acceptable.

### `CommunicationEventVerifierPort`

Provider-specific webhook signature/authentication verification happens in infrastructure before canonical event mapping.

## Normalized send request

Conceptual fields:
- logical communication recipient ID;
- channel;
- normalized destination;
- rendered subject/body or approved provider template reference;
- allowlisted rendered variables;
- idempotency key;
- callback correlation reference;
- schedule metadata if applicable.

Project/household authorization context is resolved before reaching provider adapter. Provider does not decide application authorization.

## Normalized result

- accepted boolean/state;
- provider message reference;
- normalized state;
- known cost/segments if reliably returned;
- normalized retryability/error class;
- provider raw error code allowed in restricted diagnostics.

Do not store provider raw payload as authoritative domain state.

## Error classification

Canonical classes should distinguish at minimum:
- transient provider/network;
- invalid destination;
- authentication/configuration;
- template/policy rejection;
- rate/throughput limit;
- insufficient provider balance/quota;
- permanent unknown failure.

Retry policy is based on normalized class and provider guidance, with bounded retries.

## Idempotency

Application owns stable logical idempotency. If provider has native idempotency support, adapter uses it. If not, application reconciles stored provider reference/state before retry.

## Provider selection

Actual vendors/packages are deferred deployment/implementation choices, but any choice must satisfy this port contract and security/operations requirements.

Replacing provider requires an adapter + migration/rebinding plan, not a rewrite of guest/campaign domain.

## Testing

Each adapter must have:
- contract tests against provider port behavior;
- test/sandbox integration where provider supports it;
- error/timeout/idempotency fixtures;
- webhook signature/event fixtures;
- no-secret-in-client build assertion.

Core campaign/RSVP tests use deterministic fake providers.