# Mariage OS — Guest Communications & RSVP Requirements

Status: **NORMATIVE V1 REQUIREMENT EXTENSION**

Priority convention: P0 release-blocking, P1 required V1, P2 desirable/non-blocking only when explicitly stated.

## RSVP portal

| ID | Priority | Requirement |
|---|---|---|
| RSVP-001 | P0 | Every guest-facing RSVP access is scoped by an unguessable invitation capability, never project membership. |
| RSVP-002 | P0 | Guest portal returns an allowlisted guest-safe DTO and cannot expose other households/internal project data. |
| RSVP-003 | P0 | Raw invitation tokens are never stored server-side or logged. |
| RSVP-004 | P0 | Expired/revoked/rotated links cannot mutate RSVP data. |
| RSVP-005 | P0 | RSVP submit is runtime-validated, idempotent and transactionally constrained to the linked household. |
| RSVP-006 | P1 | Existing invited persons are updated rather than duplicated. |
| RSVP-007 | P0 | +1/child creation is server-rejected unless explicit allowance exists. |
| RSVP-008 | P1 | Couple can configure response deadline, editable state and shown questions. |
| RSVP-009 | P1 | Guest may answer person-by-person for household members. |
| RSVP-010 | P1 | Guest can provide configured dietary/accessibility/transport/accommodation information and a message. |
| RSVP-011 | P1 | Accepted RSVP changes update canonical guest statistics and dependency invalidation. |
| RSVP-012 | P1 | Guest sees a clear confirmation and edit policy after submit. |
| RSVP-013 | P1 | Portal is mobile-first, accessible and requires no account/password. |
| RSVP-014 | P1 | Household detail exposes link state, response history, contact points and communication timeline. |
| RSVP-015 | P1 | Couple can rotate/revoke/copy invitation links and generate QR codes. |

## Communications

| ID | Priority | Requirement |
|---|---|---|
| COM-001 | P1 | V1 architecture supports email, SMS, WhatsApp Business-compatible channel and manual link/QR fallback. |
| COM-002 | P0 | Domain/application code depends on provider-neutral communication ports, not a vendor SDK directly. |
| COM-003 | P0 | Provider credentials are server-side secrets and never client/project/export data. |
| COM-004 | P0 | No bulk send occurs before frozen audience + message + channel preview. |
| COM-005 | P1 | Preflight identifies missing/invalid contacts, duplicates, suppression and missing RSVP links. |
| COM-006 | P1 | Preflight shows exact recipient count and known/reliable external cost estimate when available. |
| COM-007 | P0 | Logical sends are idempotent and retries cannot duplicate successful messages. |
| COM-008 | P0 | Provider webhook authenticity is verified before events become trusted domain state. |
| COM-009 | P0 | Provider callback events are deduplicated and project/recipient scope derives from server-stored mapping. |
| COM-010 | P1 | Product normalizes provider statuses into canonical pending/accepted/sent/delivered/read/failed/suppressed semantics as applicable. |
| COM-011 | P1 | Email production configuration requires authenticated sending domain and SPF/DKIM/DMARC readiness appropriate to provider. |
| COM-012 | P1 | SMS destinations use validated normalized phone numbers and failure/delivery callback processing. |
| COM-013 | P0 | WhatsApp uses an official Business Platform-compatible API/provider and does not automate personal WhatsApp/Web. |
| COM-014 | P1 | WhatsApp provider template/eligibility/consent requirements are represented without claiming automatic legal compliance. |
| COM-015 | P0 | User-configurable/campaign caps prevent unbounded paid sends and denial-of-wallet loops. |
| COM-016 | P1 | Campaign supports invitation, RSVP reminder and information/update purposes. |
| COM-017 | P1 | Couple can selectively retry failed recipients without resending successful recipients. |
| COM-018 | P1 | Household communication history is visible from guest management. |
| COM-019 | P1 | No email tracking pixel/open tracking by default; native channel delivery/read events may be represented when legitimately supplied. |
| COM-020 | P1 | Manual copy/share/QR path remains functional when automatic providers are unconfigured/unavailable. |
| COM-021 | P1 | Communication body variables come from a fixed allowlist; arbitrary executable template syntax is forbidden. |
| COM-022 | P0 | Audience cannot silently expand between preview and send. |
| COM-023 | P1 | Scheduled send state/cancellation is modeled when provider/implementation supports scheduling. |
| COM-024 | P1 | Invalid/bounced destinations can be suppressed to prevent repeated failures. |

## Onboarding / QIF

| ID | Priority | Requirement |
|---|---|---|
| QIF-001 | P0 | Primary workflows expose one obvious next action and no dead-end without recovery/next-step guidance. |
| QIF-002 | P1 | Couple onboarding asks RSVP/channel intentions in wedding language, not provider jargon. |
| QIF-003 | P1 | Provider technical setup can be deferred without blocking basic onboarding or manual RSVP links. |
| QIF-004 | P1 | `Invitations & RSVP` is discoverable from Guests without global-navigation clutter. |
| QIF-005 | P1 | Campaign preparation follows purpose → audience → channel/message → preview → send/schedule → result. |
| QIF-006 | P0 | Send confirmation states exact channel and recipient count. |
| QIF-007 | P1 | Typical guest RSVP is completable on mobile without account creation or documentation. |
| QIF-008 | P1 | Missing configuration/contact data explains the corrective action inline. |
| QIF-009 | P1 | Delivery/provider technical details are progressive disclosure, not primary-screen noise. |
| QIF-010 | P1 | QIF usability review becomes part of feature/checkpoint acceptance evidence for onboarding/guest communications. |

## Cost / operations

| ID | Priority | Requirement |
|---|---|---|
| COMMOPS-001 | P0 | Documentation clearly distinguishes zero-cost core application from potentially chargeable outbound provider usage. |
| COMMOPS-002 | P0 | Mariage OS never automatically purchases/upgrades provider plans or enables unbounded overage. |
| COMMOPS-003 | P1 | Provider/channel health and webhook failures are diagnosable without logging message/contact secrets. |
| COMMOPS-004 | P1 | Public SaaS future mode adds tenant-level quotas, abuse controls and compliance review without redesigning guest domain. |
| COMMOPS-005 | P1 | Provider selection remains an implementation/deployment decision behind stable ports unless a future ADR changes it. |