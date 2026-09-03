# Mariage OS — Frozen V1 Manifest

Status: **NORMATIVE PRECEDENCE / NAVIGATION MANIFEST**

Purpose: give a context-free developer/LLM one compact answer to “what exactly constitutes the frozen V1 specification and how is it safely executed?” after the Invitations/RSVP/Communications and AI lot-orchestration reviews.

## Current V1 feature inventory

V1 contains **120 trackable capabilities**:

- FTR-001..104: `FEATURE-LEDGER.md`
- FTR-105..120: `FEATURE-LEDGER-GUEST-COMMUNICATIONS-EXTENSION.md`

Both files form one logical V1 Feature Ledger. Neither can be ignored by lot/checkpoint/status tooling.

## Master product/scope

Read together:

1. `PRODUCT-SPECIFICATION.md`
2. `PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md`
3. `PRODUCT-SPECIFICATION-GUEST-COMMUNICATIONS-ADDENDUM.md`
4. `roadmap/V1-SCOPE.md`
5. applicable narrower scope/public-readiness addenda
6. `REQUIREMENTS-CATALOG.md`
7. `requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md`

Where the guest-communications addendum explicitly promotes guest portal/Email/SMS/WhatsApp functionality into V1, it overrides older statements that classified those capabilities post-V1.

## Guest communications normative set

### Features
- `features/GUESTS.md`
- `features/GUEST-RSVP-PORTAL.md`
- `features/COMMUNICATIONS.md`
- `features/AUTH-ONBOARDING.md`

### UX/routes
- `ux/GUEST-COMMUNICATIONS-BLUEPRINTS.md`
- `ux/ROUTE-FEATURE-GUEST-COMMUNICATIONS-ADDENDUM.md`

### Architecture/data
- `architecture/COMMUNICATION-PROVIDER-PORTS.md`
- `domain/PHYSICAL-SCHEMA-GUEST-COMMUNICATIONS-ADDENDUM.md`
- `domain/DEPENDENCY-GRAPH-GUEST-COMMUNICATIONS-ADDENDUM.md`

### Security/authorization
- `security/GUEST-COMMUNICATIONS-SECURITY.md`
- `security/GUEST-COMMUNICATIONS-AUTHORIZATION.md`
- `security/README.md`

### Import/export/operations
- `import-export/GUEST-COMMUNICATIONS-PORTABILITY.md`
- `operations/COMMUNICATION-PROVIDER-OPERATIONS.md`

### Quality
- `quality/GUEST-COMMUNICATIONS-ACCEPTANCE.md`

### Roadmap
- `roadmap/LOTS.md`
- `roadmap/LOT-ACCEPTANCE.md`
- `roadmap/LOT-ACCEPTANCE-GUEST-COMMUNICATIONS-ADDENDUM.md`
- checkpoint contracts/review evidence.

## AI implementation execution governance

A human may simply request `Do Lot N` / `Fais le Lot N`.

That command is governed by:

1. `engineering/AI-LOT-ORCHESTRATION.md`;
2. `engineering/IMPLEMENTATION-PLAYBOOK.md`;
3. `engineering/DEFINITION-OF-DONE.md`;
4. `templates/WORK-PACKET-RECORD.md`;
5. `roadmap/LOTS.md`;
6. base + applicable addendum Lot acceptance contracts.

A Lot is a product milestone and user command boundary, **not** the normal AI context/work unit.

The mandatory hierarchy is:

```text
Feature/FIR
→ bounded Work Packet
→ Pass A IMPLEMENT
→ Pass B ADVERSARIAL REVIEW
→ Pass C ACCEPTANCE
→ Lot reconciliation
→ Lot Integration Pass
→ Lot acceptance
→ Checkpoint when applicable
```

Every required current-lot Feature/control responsibility must be assigned to at least one Work Packet before implementation starts. A non-empty `required - accepted/evidenced` reconciliation blocks Lot closure.

The default is one Work Packet `IN_PROGRESS` at a time. Session state must record current Lot, current packet/pass and next permitted action so a cold-start agent can resume without chat history.

## QIF

`QIF — Quick & Intuitive Flow` is an internal Mariage OS quality criterion introduced by the V1 guest-communications scope change.

It is normative for:
- couple onboarding;
- guest import/contact readiness guidance;
- Invitations & RSVP workspace;
- campaign wizard;
- guest mobile RSVP;
- blocked/error recovery paths.

It is not an external industry certification. Product/review documents must not present it as one.

## Cost precedence

Core private Mariage OS continues to target zero-cost infrastructure. This does **not** mean external Email/SMS/WhatsApp delivery is guaranteed free.

Automatic providers are opt-in, capped, previewed and never auto-upgraded. Manual secure RSVP links/QR remain the no-provider fallback.

## Security precedence

Guest RSVP token ≠ project-member account/role.

Provider webhook ≠ project-member/API trust.

Provider credential ≠ project data.

Any implementation that collapses those boundaries violates V1.

## Implementation sequencing

The design freeze does not start Lot 0.

Guest communications implementation ownership:
- Lot 1: shell/settings/public-capability architectural hooks only;
- Lot 6: user-visible Invitations/RSVP/communications domain + test/sandbox adapters + seating integration;
- Lot 11: real provider production hardening/cutover/monitoring/cost caps;
- Lot 12: real-data/contact reconciliation and representative guest acceptance.

Every Lot is internally decomposed using the AI orchestration contract before production implementation begins.

## Context-free routing

For any task containing RSVP link, invitation, guest message, email, SMS, WhatsApp, campaign, reminder, contact point or communication webhook:

1. read this manifest;
2. read Feature IDs FTR-105..120;
3. read `requirements/GUEST-COMMUNICATIONS-REQUIREMENTS.md`;
4. read the exact feature contract;
5. read the UX blueprint/route addendum for UI work;
6. read security + authorization for any endpoint/contact/provider work;
7. read provider ports + operations for integrations;
8. read acceptance scenarios;
9. read current Lot/Checkpoint acceptance;
10. if the request is an entire Lot, apply `engineering/AI-LOT-ORCHESTRATION.md` before coding.

Do not guess from general Guests behavior alone.