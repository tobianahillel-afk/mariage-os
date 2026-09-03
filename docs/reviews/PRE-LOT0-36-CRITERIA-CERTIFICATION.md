# Mariage OS — Pre-Lot 0 36-Criteria Certification

Status: **FINAL PRE-CODE DESIGN CERTIFICATION — V1 WITH GUEST RSVP + EMAIL/SMS/WHATSAPP COMMUNICATIONS**

Purpose: certify the exact design/documentation conditions that must be complete before Lot 0 may be READY. This certification covers the frozen V1 feature set `FTR-001..FTR-120`, including the guest invitation/RSVP/communication scope change.

## Scoring rule

Each criterion is scored from 1 to 100.

A score of **100/100** means, for the pre-code phase:

- required behavior is explicit enough to implement without material guessing;
- authoritative documents and precedence are known;
- new guest-communication behavior is integrated into the same product/architecture rather than documented as an isolated module;
- verification/evidence requirements are assigned to the proper future lot;
- no unresolved BLOCKING or MAJOR design defect is known for the criterion;
- runtime proof that cannot exist before code is not falsely claimed.

It does **not** mean unimplemented providers, database policies, rendering or CI have already been executed.

## Certified criteria

| # | Pre-Lot 0 criterion | Score /100 | Certification basis after scope change |
|---:|---|---:|---|
| 1 | Product mission / couple jobs | **100** | Decision/action mission now includes the complete invitation-to-RSVP loop without turning the product into a messaging CRM. |
| 2 | V1 / post-V1 scope | **100** | RSVP portal and Email/SMS/WhatsApp are explicitly promoted to V1; old post-V1 exclusions are superseded/removed; exact provider choice remains an implementation decision only. |
| 3 | Private-V1 vs public-SaaS boundary | **100** | Public guest capability routes are separated from public SaaS self-service; first deployment remains private while the core remains multi-tenant/public-ready. |
| 4 | Multi-tenant project context | **100** | Guest links, contacts, campaigns, recipients, webhooks, caches and provider configuration are project-scoped and tested conceptually against cross-project leakage. |
| 5 | Feature inventory / traceability | **100** | Frozen set is `FTR-001..FTR-120`; `FTR-105..120` are mapped to RSVP/COM/QIF/COMMOPS requirements, lots, routes and acceptance scenarios. |
| 6 | User flows / acceptance scenarios | **100** | Base flows plus 60 guest-communication scenarios cover happy path, failures, retry/idempotence, revocation, provider outage, restore and cross-household attacks. |
| 7 | UX information architecture | **100** | Invitations & RSVP live within Guests; advanced provider configuration lives in Settings; communication is a workflow, not a new cluttered top-level product. |
| 8 | Navigation / route discoverability | **100** | Authenticated invitation-management routes and public `/rsvp/:token` route have explicit jobs, ownership and safe deep-link behavior. |
| 9 | Screen composition | **100** | Guest portal, campaign wizard, preview/results and communication settings have blueprints; one-primary-action and progressive-disclosure rules remain binding. |
| 10 | Visual identity / color system | **100** | New screens inherit the frozen wedding-editorial × calm-OS identity and semantic/domain color rules; provider branding cannot replace Mariage OS hierarchy. |
| 11 | Motion / dynamic list-table behavior | **100** | Existing motion/state contract applies to campaign recipient updates, RSVP feedback and status changes without unnecessary celebratory/noisy motion. |
| 12 | Image delivery / metadata / private SEO | **100** | RSVP pages are private capability surfaces, noindex, privacy-minimized; invitation images/cards follow existing safe-media rules. |
| 13 | Future public web shell / marketing SEO | **100** | Public marketing/Auth shell remains distinct from guest RSVP capability pages and authenticated project content. |
| 14 | Responsive behavior | **100** | RSVP is mobile-first; campaign management has explicit desktop/mobile behavior; no horizontal-table dependence for guest responses. |
| 15 | Accessibility contract | **100** | RSVP/forms/channel setup must meet the existing semantic form, focus, error, contrast, reduced-motion and touch-target requirements. |
| 16 | Cloud architecture | **100** | Provider adapters/webhooks/scheduling are server-side/platform concerns behind ports; browser/domain layers do not own provider secrets or authoritative sends. |
| 17 | Local-first / IndexedDB architecture | **100** | Safe drafts/configuration may be local; raw capability tokens/provider secrets are excluded; send/submission confirmation remains server-authoritative. |
| 18 | Synchronization / conflicts | **100** | RSVP submissions and outbound sends have idempotency/version rules; provider callbacks are append-oriented and normalized without reverting newer state. |
| 19 | Offline capability classification | **100** | Portal submission and actual send are explicitly server-required; campaign drafts may be local; UI cannot claim sent/submitted while offline. |
| 20 | Database / same-project integrity | **100** | New contact/invitation/campaign/recipient/event entities have same-project ownership and constrained relations; public capability access avoids broad anonymous project-table RLS. |
| 21 | Facts / evidence / criteria model | **100** | Existing facts/evidence model is unaffected; guest answers that are operational data do not silently become unrelated venue/vendor evidence. |
| 22 | Money / budget / payments | **100** | Core wedding budget semantics remain unchanged; external communication cost is separately bounded/previewed and never silently treated as free core operation. |
| 23 | Guests / households / RSVP / communications / seating | **100** | Household invitation unit, contacts, secure portal, individual RSVP, controlled +1/children, communication status and seating invalidation form one coherent domain workflow. |
| 24 | Venues / access / vendors | **100** | No regression: communications use generic provider infrastructure and do not couple venue/vendor domain behavior to messaging vendors. |
| 25 | Tasks / decisions / Inbox / Search | **100** | Communication follow-ups/failures can create actionable work without polluting unrelated queues; search/privacy boundaries remain explicit. |
| 26 | Planning / wedding-day timeline | **100** | RSVP deadline and campaign scheduling integrate with planning; browser timers are forbidden as authoritative schedulers. |
| 27 | Documents / contract readiness / media | **100** | Invitation assets/templates obey existing file/media security; provider credentials and raw payloads are not documents exposed to project users. |
| 28 | Import / external IDs / merge / rollback | **100** | Guest contact/channel data is portable with conservative dedup; provider secrets are excluded; restore cannot auto-resend scheduled/queued campaigns. |
| 29 | Backup / restore / encryption | **100** | RSVP/campaign semantic state is included where appropriate; credentials/raw tokens are excluded; restored outbound work requires deliberate reactivation. |
| 30 | Authentication / capability links / authorization / RLS | **100** | Owner/member permissions remain explicit; guest access is a narrow hashed-token capability with expiry/revocation/rate limiting and household-scoped DTO/mutations. |
| 31 | Future public signup / abuse / launch boundary | **100** | Public RSVP is not public project signup; abuse controls, provider eligibility, quotas and future SaaS tenant-provider choices are separately specified. |
| 32 | Privacy / external content / files | **100** | Phone/email contact points are purpose-limited; internal priority/probability/notes never reach the portal; provider payload retention is minimized. |
| 33 | Testing / quality strategy | **100** | 60 dedicated guest-communication acceptance scenarios plus security/provider/idempotence/offline/mobile tests are assigned to implementation gates. |
| 34 | Operations / recovery / free-tier awareness | **100** | Provider outage, retries, suppressions, deliverability, cost caps and diagnostics are specified; free link/QR remains fallback even when paid channels are unavailable. |
| 35 | Development anti-drift governance | **100** | AGENTS/START-HERE/INDEX/manifest/task routing now expose the 120-feature baseline and force provider abstraction, QIF and security contracts. |
| 36 | Lot / checkpoint sequencing | **100** | Lot 1 establishes foundations, Lot 6 owns end-to-end guest communications, Lot 11 hardens real providers, Lot 12 validates real contacts/cutover; Checkpoints B/D include explicit gates. |

## Result

**36 / 36 criteria = 100/100 each = 100% pre-Lot 0 design readiness for the expanded V1.**

Arithmetic mean: **100.0 / 100**.

This certification is valid only while:

- `docs/V1-FROZEN-MANIFEST.md` remains the canonical frozen-set map;
- no unresolved BLOCKING/MAJOR design finding is introduced;
- final sentry/public-repository hygiene remains clean;
- the reviewed guest-communications scope-change HEAD is merged unchanged into `main`;
- Lot 0 remains NOT_STARTED until an explicit kickoff.

## Runtime evidence intentionally outside this certification

Not yet claimable before code:

- actual provider connectivity/deliverability;
- real WhatsApp template approval;
- real SMS/email sending;
- webhook signature verification execution;
- real RLS/RPC/capability endpoint tests;
- rendered mobile/accessibility evidence;
- CI/typecheck/coverage/mutation execution;
- Service Worker behavior;
- production monitoring;
- V1→V2 migration rehearsal.

Those remain tracked by future lot/checkpoint evidence and the 300-control maturity framework.

## Gate rule

This certificate **does not start Lot 0**. After the scope-change review is merged and the main-branch Final Design Review is re-sealed PASS, Lot 0 may return to `READY / NOT_STARTED` only.