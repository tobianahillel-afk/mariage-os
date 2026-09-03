# Mariage OS — Public SaaS Readiness Addendum: Guest Communications

Status: **NORMATIVE V1 PUBLIC-READINESS ADDENDUM**

## Goal

Private V1 uses one couple, but guest communications must not create architecture that prevents later multi-tenant public SaaS.

## Tenant-scoped domain

All project-owned contact/invitation/campaign/template/recipient/event/suppression entities carry project scope and same-project integrity.

One tenant can never:
- read another tenant's contacts/messages/RSVP;
- consume another tenant's campaign quota;
- use another tenant's sender/template/provider connection;
- receive another tenant's webhook events;
- resolve another tenant's invitation link through guessed identifiers.

## Provider topology

Architecture must support future policies such as:

1. **platform-managed provider** — Mariage OS uses platform account/credentials and applies per-tenant entitlements/quotas;
2. **tenant-bound provider connection** — a tenant connects its own sender/provider credential through a secure platform secret-binding mechanism;
3. hybrid channel-specific policy.

Private V1 may use one platform-managed provider configuration, but domain/application code must not assume a single global project or hard-code provider secrets.

Exact public billing/provider topology is deferred.

## Quotas/entitlements

Public SaaS must be able to control per project/plan:
- enabled channels;
- recipient/send limits;
- scheduling availability;
- storage/history retention if needed;
- provider spend/cost caps;
- advanced template/branding features.

V1 channel settings/campaign model must be compatible with a future entitlement service rather than scattering plan checks through UI/domain.

## Abuse/spam readiness

Public launch requires additional controls beyond private V1:
- self-service provisioning abuse controls;
- tenant communication quotas;
- destination/complaint/abuse monitoring;
- terms/privacy/acceptable-use policy;
- support/report-abuse workflow;
- legal/compliance review by launch jurisdictions/provider policies;
- provider reputation/quality isolation strategy where needed.

Private V1 does not need to pretend these public operations already exist, but must not block them architecturally.

## Guest portal scale

`/rsvp/:token` is already Internet-facing in private V1, so even private deployment requires production-grade token security/rate limiting/privacy. Future SaaS adds tenant volume, not a fundamentally different authorization model.

## Branding

V1 guest portal uses project public wedding identity. Future plans may allow custom branding/domain, but guest portal payload remains allowlisted and separate from private project UI.

## Analytics/privacy

No cross-tenant behavioral advertising or contact monetization. Future aggregate platform health metrics must remain privacy-minimized.

## Testing from private V1

Synthetic tests already include:
- projects A/B with overlapping guest names/contact formats;
- invitation token from A cannot access B;
- campaign recipient from A cannot reference B contact;
- webhook event mapped to A cannot mutate B;
- per-project cap logic independent;
- cache/search/export isolation.

These tests are required before public launch and should exist during private implementation to prevent single-tenant shortcuts.