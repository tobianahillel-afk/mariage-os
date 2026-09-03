# Mariage OS — V1 Guest Communications Scope-Change Review

Status: **PRE-MERGE DESIGN REVIEW — SCOPE CHANGE**

Purpose: independently review the promotion of secure guest RSVP + Email/SMS/WhatsApp communications into V1 before re-freezing the pre-code specification.

## Review method

Review performed across:

- product mission/scope;
- feature/requirement/acceptance traceability;
- onboarding/QIF;
- private/public routes;
- UX information architecture;
- schema/invariants/state/dependencies;
- project authorization vs guest capability authorization;
- token/input/privacy/anti-abuse security;
- provider ports/secrets/webhooks/idempotency;
- offline/PWA/update behavior;
- import/export/backup/restore;
- free-tier/external cost semantics;
- public-SaaS multi-tenancy;
- lot/checkpoint/cutover sequencing;
- code placement/LLM navigation.

## Findings and resolutions

| ID | Severity | Finding | Resolution | State |
|---|---|---|---|---|
| GCR-001 | BLOCKING | Original V1 had RSVP state but no secure guest self-service portal. | Added FTR-105..111, guest portal contract, schema/security/UX/acceptance. | RESOLVED |
| GCR-002 | BLOCKING | Automated Email/SMS/WhatsApp was absent/post-V1; user requires it in V1. | Added FTR-112..120, product/scope/roadmap/requirements/contracts. | RESOLVED |
| GCR-003 | MAJOR | Old docs could still present “guest portal/automated email” as post-V1. | Updated V1 scope/Deferred/Lots; frozen manifest explicitly controls stale historical wording. | RESOLVED |
| GCR-004 | MAJOR | Root/index could still tell LLM “104 features / 80 scenarios”. | Added V1 manifest, updated AGENTS/START-HERE/README/INDEX; current V1=120, base acceptance + GC-001..060. | RESOLVED |
| GCR-005 | BLOCKING | Guest link could be confused with project membership/RLS. | Separate capability authorization, narrow DTO/server boundary; no broad anon CRUD. | RESOLVED |
| GCR-006 | BLOCKING | Raw RSVP token handling was unspecified. | CSPRNG/high entropy/hash-at-rest/non-log/rotation/revocation contract; local-data policy. | RESOLVED |
| GCR-007 | MAJOR | +1/children self-registration could create unauthorized guests. | Explicit per-household allowances enforced server-side + invariants/tests. | RESOLVED |
| GCR-008 | BLOCKING | Provider SDK/secret placement unspecified. | Provider ports + infrastructure-only SDKs + secret-store requirement + code structure. | RESOLVED |
| GCR-009 | BLOCKING | Bulk send could duplicate paid messages on retry. | Logical recipient idempotency, attempts/history, provider reconciliation, acceptance tests. | RESOLVED |
| GCR-010 | BLOCKING | Webhook could be forged/replayed or trust caller project IDs. | Signature/auth verification, dedup, server-side provider-message mapping, tests. | RESOLVED |
| GCR-011 | MAJOR | Audience could change between preview and send. | Frozen recipient rows + preview revision/stale revalidation + invariant/tests. | RESOLVED |
| GCR-012 | MAJOR | Browser/service worker could accidentally become scheduler. | Durable server-side scheduler port/operations rule; browser never authoritative. | RESOLVED |
| GCR-013 | MAJOR | Existing €0/month constraint conflicted with potentially paid communications. | Free-tier policy now distinguishes zero-cost core from optional chargeable external traffic; caps/manual fallback. | RESOLVED |
| GCR-014 | MAJOR | Provider outage could block RSVP/product usage. | Manual link/QR fallback, provider-degraded state, guest list/RSVP domain independent. | RESOLVED |
| GCR-015 | MAJOR | Onboarding risked provider jargon/mandatory setup. | QIF onboarding asks intent/questions/channels; technical setup deferrable. | RESOLVED |
| GCR-016 | MAJOR | Communications could clutter top-level navigation/turn app into CRM. | `Guests → Invitations & RSVP`, household integration, Settings advanced config; QIF/UX blueprint. | RESOLVED |
| GCR-017 | MAJOR | Contact points embedded as ad-hoc guest strings would limit validation/multi-channel use. | First-class normalized `guest_contact_points` + eligibility metadata. | RESOLVED |
| GCR-018 | MAJOR | Possessing a phone/email could be treated as universal messaging consent/eligibility. | Separate channel eligibility/consent/suppression projection; no automatic legal-compliance claim. | RESOLVED |
| GCR-019 | MAJOR | Communication state lacked logical-recipient vs provider-attempt distinction. | Added recipients + attempts + append-only events and monotonic normalization rules. | RESOLVED |
| GCR-020 | MAJOR | Late/out-of-order provider callbacks could regress state. | State-machine contract forbids blind last-callback-wins; event-time/provider semantics. | RESOLVED |
| GCR-021 | MAJOR | Delivery/read state might be mistaken for RSVP. | Explicit invariant: channel status and RSVP lifecycle independent. | RESOLVED |
| GCR-022 | MAJOR | RSVP changes could leave seating/budget/dashboard stale. | Dependency addendum defines recalculation/invalidation without rewriting historical/contractual truth. | RESOLVED |
| GCR-023 | MAJOR | Offline/send semantics were ambiguous. | Drafts may persist; sends/token operations/server RSVP commits require cloud revalidation; explicit not-confirmed states. | RESOLVED |
| GCR-024 | MAJOR | Backup/restore could leak tokens/secrets or resend scheduled campaigns. | Portability contract excludes raw tokens/provider secrets; restored schedules non-dispatchable until reconciliation. | RESOLVED |
| GCR-025 | MAJOR | Public-SaaS future provider topology could force refactor. | Tenant-scoped data + platform/tenant provider topology behind stable ports + entitlements/caps readiness. | RESOLVED |
| GCR-026 | MAJOR | Role-only authorization insufficient for sensitive contacts/sending. | Explicit guest-contact/invitation/communication permissions; dispatch rechecks current permission. | RESOLVED |
| GCR-027 | MAJOR | Guest portal URL could leak token via third-party referrer/resources. | Restrictive referrer/resource trust-boundary contract; no unnecessary analytics/ad pixels. | RESOLVED |
| GCR-028 | MAJOR | Email sender spoofing/deliverability requirements absent. | Production email readiness requires authenticated sender/domain, SPF/DKIM/DMARC review and bounce handling. | RESOLVED |
| GCR-029 | MAJOR | WhatsApp could be implemented via personal/Web automation. | Explicit official Business-compatible provider/API requirement; personal/Web automation forbidden. | RESOLVED |
| GCR-030 | MAJOR | Importing contacts might accidentally activate/send invitations. | Import/portability contract explicitly forbids implicit campaign/link activation/send. | RESOLVED |
| GCR-031 | MAJOR | Local storage might persist raw invitation capabilities indefinitely. | Local-data addendum defaults to ephemeral/one-time raw token + reissue/rotation, no ordinary IndexedDB secret. | RESOLVED |
| GCR-032 | MAJOR | Communication provider error types could contaminate UI/domain. | Normalized port result/error classes; raw provider details restricted to diagnostics. | RESOLVED |
| GCR-033 | MAJOR | No durable traceability for scope change. | New RSVP/COM/QIF/COMMOPS/PUB-COM IDs + FTR-105..120 + GC-001..060 + traceability matrix. | RESOLVED |
| GCR-034 | MAJOR | Lot ownership/cutover timing unclear. | Lot1 hooks, Lot6 functional domain, Lot11 production providers, Lot12 real-data/guest acceptance; checkpoint addenda. | RESOLVED |
| GCR-035 | MAJOR | LLM task routing could miss new addenda. | V1 manifest + AGENTS/START-HERE/INDEX explicit guest-communications route. | RESOLVED |
| GCR-036 | MAJOR | QIF could be mistaken for external standard or remain subjective. | Explicit internal definition + P0/P1 QIF requirements + GC usability scenarios/checkpoint evidence. | RESOLVED |

## Open findings

**BLOCKING: 0**

**MAJOR: 0**

Remaining pre-merge work is verification/recertification/sentry only, not unresolved design semantics.

## Design conclusions

### Product coherence

PASS. Invitations/RSVP are an extension of Guests rather than an unrelated messaging CRM. The loop feeds canonical guest state, seating/budget/planning readiness and next actions.

### UX/QIF

PASS at design level. Provider jargon is progressive/Settings-only. Manual secure link/QR provides a simple baseline. Automatic campaign flow is focused/preview-first. Guest flow is mobile-first/accountless.

### Security

PASS at design level. Project membership, guest capability and provider webhook are three distinct trust/auth models. Tokens/secrets/idempotency/webhook/cost abuse are explicitly designed/tested.

### Data/architecture

PASS at design level. Contact/invitation/campaign/attempt/event/suppression models are explicit, same-project scoped and provider-neutral. Local/offline/backup/update behavior is defined.

### Public readiness

PASS at design level. Private deployment can use one provider connection while future SaaS can introduce platform or tenant-bound provider connections/entitlements without rewriting campaign/RSVP domain.

### Roadmap

PASS. No new implementation lot is needed; ownership fits Lots 1/6/11/12 and Checkpoints B/D.

## Gate effect

This review does **not** start Lot 0. The scope change is eligible for re-freeze only after:

- 36-criterion re-certification;
- cold-start LLM navigation review;
- final diff sentry/private-data/secret/stale-wording scan;
- scope-change PR merge unchanged;
- post-merge `FINAL-DESIGN-REVIEW` and `IMPLEMENTATION-STATUS` update.
