# Mariage OS — Communication Provider Operations

Status: **NORMATIVE V1 OPERATIONS CONTRACT**

## Principle

Automatic guest communications are optional channel integrations around a provider-neutral domain. Production enablement is explicit per channel and per environment.

## Environment separation

Use distinct configuration for local/test/preview/production where provider supports it. Preview PRs MUST NOT inherit production send credentials by default.

Provider secrets are never available to untrusted fork/PR execution.

## Channel readiness states

Canonical operational states:

- `not_configured`
- `configuring`
- `sandbox_ready`
- `production_ready`
- `degraded`
- `disabled`

Product UI uses friendly labels and remediation; raw provider codes stay diagnostic.

## Email production checklist

Before `production_ready`:

- sending identity/domain verified with selected provider;
- SPF/DKIM configured;
- DMARC alignment/policy reviewed;
- From/Reply-To strategy defined;
- bounce/complaint callback path verified;
- test email delivered to representative providers;
- no secret/client-side credentials;
- rate/send caps configured;
- accessible HTML + plain-text fallback verified.

## SMS production checklist

- sender identity/number configured according to provider/country rules;
- destination normalization validated;
- test send + delivery/failure callback verified;
- segmentation/cost behavior understood;
- send cap configured;
- retry behavior tested;
- invalid destination suppression tested.

## WhatsApp production checklist

- official Business Platform-compatible provider/account configured;
- sender/phone number and business requirements satisfied;
- required templates approved/eligible;
- variable mapping reviewed;
- webhook authenticity verified;
- test send/status callback verified;
- rate/quality/provider restrictions understood;
- consent/eligibility evidence policy reviewed;
- send cap configured.

## Scheduling

Mariage OS can model scheduled campaigns. Dispatch mechanism must be durable and server-side.

A browser tab staying open is never the scheduler.

At dispatch time revalidate:

- campaign still scheduled/active;
- audience snapshot/preflight validity according to contract;
- current send permission/policy;
- provider readiness;
- cost/send cap;
- project/tenant enabled state.

Cancellation is best-effort according to whether dispatch has already crossed provider boundary.

## Monitoring

Operational metrics/events may include privacy-minimized counts/rates:

- sends attempted/succeeded/failed;
- callback verification failures;
- webhook latency/backlog;
- provider error-class rate;
- bounce/suppression rate;
- scheduled-send backlog;
- cap/quota blocks.

Do not include message body, raw token, full phone/email or provider secret in telemetry.

## Incident modes

### Provider outage

- mark channel degraded;
- stop unsafe retries;
- preserve draft/scheduled state;
- surface manual link/QR or alternate channel when appropriate;
- do not alter RSVP data.

### Credential compromise

- disable provider/channel;
- rotate/revoke credentials immediately;
- inspect send/activity history;
- invalidate webhook secret/signing config if applicable;
- follow incident runbook;
- no need to invalidate RSVP links unless independently compromised.

### Runaway sending/cost anomaly

- trip project/platform send cap;
- halt new dispatches;
- preserve in-flight/historical state;
- require explicit privileged re-enable after review.

## Public SaaS future

Public mode requires tenant-level:

- quotas/caps;
- abuse detection;
- sender/domain onboarding model;
- billing/cost allocation policy;
- support tooling without universal hidden project access;
- legal/privacy/compliance review for messaging jurisdictions.

The V1 private architecture must not hard-code credentials or a single global project into domain logic.

## Backup/restore

Project backup may include templates/campaign/history according to privacy profile, but MUST NOT include live provider secrets. Restored scheduled campaigns default to non-dispatchable until explicit reviewed activation.

## Release/update compatibility

Provider webhook contracts and normalized states are versioned. Deployments use backward-compatible webhook parsing during transition where provider callbacks can arrive for messages sent by the previous app release.