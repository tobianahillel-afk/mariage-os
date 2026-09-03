# Mariage OS — V1 Feature Ledger Extension: Guest Communications

Status: **NORMATIVE V1 LEDGER EXTENSION**

The frozen V1 feature inventory is the union of `FEATURE-LEDGER.md` (FTR-001..104) and this extension (FTR-105..120). Total V1 capability rows after this scope change: **120**.

| ID | Capability | Lot | Primary contracts | Initial status |
|---|---|---:|---|---|
| FTR-105 | Secure household invitation-link lifecycle (create/activate/rotate/revoke/expire) | 6 | GUEST-RSVP-PORTAL, GUEST-COMMUNICATIONS-SECURITY, schema addendum | SPECIFIED |
| FTR-106 | No-account mobile guest RSVP portal with guest-safe DTO | 6 | GUEST-RSVP-PORTAL, GUEST-COMMUNICATIONS-BLUEPRINTS | SPECIFIED |
| FTR-107 | Person-by-person RSVP and authorized +1/child creation | 6 | GUEST-RSVP-PORTAL, schema addendum | SPECIFIED |
| FTR-108 | Configurable guest RSVP questions/logistics/message | 6 | GUEST-RSVP-PORTAL, onboarding/blueprints | SPECIFIED |
| FTR-109 | RSVP response history/edit/deadline/idempotency/invalidation | 6 | GUEST-RSVP-PORTAL, STATE-MACHINES, DEPENDENCY-GRAPH | SPECIFIED |
| FTR-110 | Household contact points and invitation/communication timeline | 6 | GUESTS, schema addendum | SPECIFIED |
| FTR-111 | RSVP link copy/share/QR fallback independent of paid providers | 6 | GUEST-RSVP-PORTAL, GUEST-COMMUNICATIONS-BLUEPRINTS | SPECIFIED |
| FTR-112 | Provider-neutral campaign/audience/template/preflight engine | 6 | COMMUNICATIONS, requirements | SPECIFIED |
| FTR-113 | Email invitation/reminder provider adapter and delivery lifecycle | 6/11 | COMMUNICATIONS, security | SPECIFIED |
| FTR-114 | SMS invitation/reminder provider adapter and delivery lifecycle | 6/11 | COMMUNICATIONS, security | SPECIFIED |
| FTR-115 | WhatsApp Business-compatible invitation/reminder adapter/template lifecycle | 6/11 | COMMUNICATIONS, security | SPECIFIED |
| FTR-116 | Authenticated/deduplicated provider webhook status ingestion | 6/11 | COMMUNICATIONS, security, schema addendum | SPECIFIED |
| FTR-117 | Scheduled/manual sends, selective retry and suppression handling | 6/11 | COMMUNICATIONS | SPECIFIED |
| FTR-118 | Invitation card/template personalization with safe allowlisted variables | 6 | COMMUNICATIONS, blueprints | SPECIFIED |
| FTR-119 | Invitations & RSVP onboarding/settings/QIF configuration | 1/6 | GUEST-COMMUNICATIONS-BLUEPRINTS, requirements | SPECIFIED |
| FTR-120 | Guest communication diagnostics, usage/cost caps and public-SaaS quota readiness | 11 | COMMUNICATIONS, security, FREE-TIER/public-readiness | SPECIFIED |

## Lot ownership rule

Lot 1 owns only reusable shell/settings/onboarding hooks needed before guest functionality exists. It MUST NOT implement outbound providers early.

Lot 6 owns the complete user-visible invitation/RSVP/campaign domain and manual link/QR path, plus provider ports and test doubles.

Lot 11 owns production-provider hardening/configuration, production webhooks, real sender-domain/provider evidence, monitoring/caps and release proof. Provider adapters may be developed/tested earlier against sandbox/test environments, but production readiness cannot be claimed before Lot 11 evidence.

## Checkpoint impact

Checkpoint B (Lots 4–7) now requires FTR-105..119 to be reconciled and QIF-reviewed at implementation level.

Checkpoint D (Lots 11–12) requires production provider/security/cost/diagnostic evidence for FTR-113..117 and FTR-120 if automatic channels are enabled for production cutover.

Manual link/QR RSVP remains a valid operational fallback and must not depend on automatic provider readiness.