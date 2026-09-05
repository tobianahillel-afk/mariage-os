# Lot 1 — Coverage Matrix and Work Packet Plan

Status: **IN_PROGRESS — user explicitly kicked off Lot 1 on 2026-09-03**

Purpose: decompose Lot 1 into bounded, dependency-aware Work Packets before production implementation, as required by `docs/engineering/AI-LOT-ORCHESTRATION.md`.

## Lot 1 goal

Establish identity, project tenancy and secure collaboration foundations that every later feature must reuse: Supabase Auth, controlled private bootstrap, partner invitation, permission-based authorization, RLS/same-project integrity, protected/public route separation, local project partitioning, sync/session primitives, Storage isolation and security/onboarding hooks.

Lot 1 must remain multi-project/public-ready by construction even though the first real deployment is one couple.

## Required Feature/current-lot responsibilities

| Required item | Owning Feature/control | Packet(s) | Dependencies | Final evidence |
|---|---|---|---|---|
| centralized migration-controlled permission catalog and role mapping | FTR-002..012 cross-cutting, AUTHZ-002/003/004 | WP-1.1 | Lot 0 DB harness | direct SQL catalog/helper tests |
| permission helper fails closed and never trusts client role | AUTHZ-001..004 | WP-1.1 | permission catalog | direct allow/deny SQL tests |
| profiles/projects/project_members schema and active membership foundation | FTR-002, FTR-003, FTR-004 | WP-1.2 | WP-1.1 | clean migration + RLS allow/deny |
| project isolation and same-project relational integrity baseline | AUTHZ-001/005/006/007/008/018/020, Lot acceptance | WP-1.2, WP-1.5, WP-1.9 | WP-1.1 | cross-project CRUD/reference denial tests |
| controlled first-owner private provisioning | FTR-002 | WP-1.3 | WP-1.2 | one-time atomic bootstrap + unrelated-user deny |
| verified Supabase Auth/session integration and recovery-compatible boundary | FTR-003 | WP-1.3, WP-1.8 | WP-1.2 | auth/session tests + protected route E2E |
| MFA/recent-auth foundation for privileged operations, production enrollment deferred to cutover evidence where specified | FTR-005 Lot 1 responsibility | WP-1.3, WP-1.8 | Auth integration | assurance/guard tests and setup diagnostics |
| secure identity-bound partner invitation and idempotent acceptance | FTR-004 | WP-1.4 | WP-1.2, WP-1.3 | wrong identity/replay/expiry/revoke tests |
| final active owner invariant and protected membership mutation | FTR-004, AUTHZ-014 | WP-1.4 | WP-1.2 | direct DB/RPC tests |
| project locale/timezone/currency/settings foundation | FTR-006 | WP-1.5 | WP-1.2 | persistence/RLS tests |
| candidate wedding dates with atomic selected date | FTR-007 | WP-1.5 | WP-1.2 | invariant/transaction tests |
| reference origins foundation | FTR-008 Lot 1 responsibility | WP-1.5 | WP-1.2 | structured persistence + project isolation |
| personal cross-device preferences foundation | FTR-012 Lot 1 responsibility | WP-1.5, WP-1.7 | WP-1.2 | author-only/project-scoped tests |
| Invitations & RSVP onboarding/settings intent hooks only | FTR-119 Lot 1 responsibility | WP-1.5, WP-1.6 | WP-1.2 | settings model + defer/manual intent UI tests |
| protected `/app/p/:projectId/**` shell/navigation/deep-link trust boundary | FTR-009 | WP-1.6 | WP-1.3 | route E2E member/outsider/session states |
| distinct public `/rsvp/:token` shell/capability boundary without project membership/provider implementation | FTR-119 cross-cutting addendum | WP-1.6 | WP-1.3 | route/security boundary tests |
| repository/service/domain boundaries for project-scoped data | Lot acceptance, architecture controls | WP-1.7 | WP-1.2 | architecture/static tests + repository contract tests |
| local account+project partitioning and no cross-project cache display | FTR-010, FTR-011, FTR-012, AUTHZ-017 | WP-1.7 | WP-1.2 | local partition tests |
| operation IDs/revisions/sync indicator primitives | FTR-010 | WP-1.7 | Lot 0 harness | unit/property/integration tests |
| session-expiry preserves pending work but blocks cloud sync until reauth+membership validation | FTR-003, FTR-011 | WP-1.8 | WP-1.7 | session-expiry/pending-work tests |
| safe explicit logout resolves pending work then purges private cache | FTR-011 | WP-1.8 | WP-1.7 | logout/purge E2E/integration tests |
| diagnostics/security setup shell | Lot acceptance, FTR-005 | WP-1.8 | WP-1.3 | diagnostics/setup UI tests |
| project-scoped Storage isolation foundation | AUTHZ-013, Lot acceptance | WP-1.9 | WP-1.2 | direct Storage allow/deny tests |
| Realtime/project subscription isolation foundation where exposed | AUTHZ-013 | WP-1.9 | WP-1.2 | direct subscription/policy evidence or explicit non-exposure proof |
| synthetic public-ready matrix: projects A/B/C, multi-project user, outsider, revoked member, owner/editor/viewer | AUTHZ-018 | WP-1.1, WP-1.2, WP-1.9 | Lot 0 seed harness | deterministic direct security tests |
| synthetic two-owner end-to-end identity/project flow | Lot acceptance | WP-1.3, WP-1.4, WP-1.6, WP-1.8 | prior packets | Playwright E2E |
| no provider SDK/secret introduced into UI/domain; no guest capability grants membership | Lot 1 guest-communications addendum | WP-1.6, WP-1.9 | architecture gates | static/security negative evidence |
| Lot reconciliation + separate integration pass | AI-LOT-ORCHESTRATION | after WP-1.1..1.9 | all packets | required - evidenced = ∅ + full verify/integration PASS |

Required current-lot responsibilities minus assigned packet responsibilities: **∅**.

## Work Packet plan

### WP-1.1 — Permission catalog and authorization helper foundation

State: **ACCEPTED**

Acceptance evidence: run `33809855993` on `f0b1e46c46bc3ad5d15bf2191c63ec4e85473507`, all five jobs SUCCESS; Pass B repaired and closed two MAJOR findings before Pass C acceptance.

### WP-1.2 — Core tenancy schema, membership and RLS baseline

State: **ACCEPTED**

Acceptance evidence: run `33811568440` on `fa96228bcd8a0b7671fcb561f8f7668eaf5851dc`, all five jobs SUCCESS; Pass B expanded direct grant/RLS denial evidence and closed `WP12-AR-001` before acceptance.

### WP-1.3 — Supabase Auth/session and controlled first-owner provisioning

State: **ACCEPTED**

Acceptance evidence: run `33817932867` on `707b1384fbd370fe88ef7a87ac191aa9645f6db3`, all five jobs SUCCESS including clean-checkout `npm run verify`; `WP13-AR-001` and `WP13-AR-002` closed.

### WP-1.4 — Partner invitation and protected membership lifecycle

State: **ACCEPTED**

Acceptance evidence: run `33859207161` on `bf0046dc45c318875d349edc2b6327292e2894ea`, all five jobs SUCCESS including clean-checkout `npm run verify`; DB 133/133; `WP14-AR-001..003` closed.

### WP-1.5 — Project configuration, dates, origins, preferences and RSVP-intent data hooks

State: **ACCEPTED**

Scope:
- protected project settings updates;
- `wedding_date_options` zero-or-one selected invariant and atomic selection/history;
- `project_reference_origins` including one-default invariant;
- `user_project_preferences` author-scoped persistence;
- provider-neutral Invitations & RSVP intent/settings fields only, with no guest/domain/provider implementation.

Acceptance evidence: run `33866160626` on implementation HEAD `15e477a9ca75efbc98594000c190180e24226229`, all five jobs SUCCESS including clean-checkout `npm run verify`; DB 13 files / 239 tests PASS; `WP15-AR-001` and `WP15-AR-002` closed; Pass C required-minus-evidenced = ∅.

Planning complexity: **9/10**.

### WP-1.6 — Protected app shell, navigation and public RSVP trust boundary

State: **ACCEPTED**

Scope:
- protected `/app/p/:projectId/**` shell and membership-aware routing;
- safe return/deep-link behavior;
- separate public `/rsvp/:token` shell boundary with placeholder capability resolution only;
- onboarding/settings UI hooks for RSVP intent/defer/manual-link plan;
- no guest domain CRUD, outbound provider SDK or provider secret.

Acceptance evidence: run `33880216335` on implementation HEAD `61dca0718f8ff7372609d208050aba6a50271743`, all five jobs SUCCESS including clean-checkout `npm run verify`; fresh Pass B PASS; `WP16-AR-001`/`002` closed; final recovery observation repaired/re-reviewed; Pass C required-minus-evidenced = ∅.

Planning complexity: **7/10**.

### WP-1.7 — Project-scoped repositories, local cache and sync primitives

State: **ACCEPTED**

Scope:
- application ports/repositories and infrastructure composition boundaries;
- local account+project partition key convention;
- durable operation ID/revision envelope primitives;
- global sync/local-durability indicator state;
- cross-project/account cache isolation tests.

Acceptance evidence: run `33895516028` on implementation/review HEAD `46548702f304dbabcf4bd673a33afb1c0ec96a3d`, all five jobs SUCCESS including 28/28 Playwright E2E, mutation and clean-checkout `npm run verify`; `WP17-AR-001..003` closed; fresh Pass B PASS; Pass C required-minus-evidenced = ∅.

Planning complexity: **7/10**.

### WP-1.8 — Session expiry, safe logout, MFA/security diagnostics

State: **ACCEPTED**

Scope:
- session-expired vs explicit signed-out state machine;
- reauth + membership revalidation before cloud resume;
- pending-work logout resolution contract;
- purge of private local state after safe logout;
- MFA/recovery readiness/security diagnostics shell.

Acceptance evidence: run `33994961610` on implementation/evidence HEAD `cb7201e2d6dc1a8ca7608bb236f1f79ac84d8d9d`, all five jobs SUCCESS including browser E2E + mutation and clean-checkout `npm run verify`; `WP18-AR-001..003` closed; final fresh Pass B PASS; Pass C required-minus-evidenced = ∅.

Planning complexity: **7/10**.

### WP-1.9 — Storage/Realtime isolation foundation and Lot-1 security matrix closure

State: `PLANNED`

Scope:
- project-scoped private Storage path/policy foundation where a Lot-1 test resource is required;
- direct Storage allow/deny evidence;
- Realtime isolation evidence for any exposed Lot-1 subscriptions, otherwise explicit proof that no client subscription surface is exposed yet;
- final cross-boundary adversarial fixtures for member vs guest-capability separation;
- no wedding-domain media/document implementation.

Planning complexity: **7/10**.

## Sequencing

```text
WP-1.1 [ACCEPTED]
  ↓
WP-1.2 [ACCEPTED]
  ├─→ WP-1.3 [ACCEPTED] → WP-1.4 [ACCEPTED]
  ├─→ WP-1.5 [ACCEPTED] → WP-1.6 [ACCEPTED]
  └─→ WP-1.7 [ACCEPTED] → WP-1.8 [ACCEPTED]
                              ↘
                                WP-1.9 [PLANNED]
```

Execution remains sequential by default. WP-1.9 is now the next permitted packet, subject to its bounded Work Packet record and normal Pass A → B → C protocol. Lot 2+ remains forbidden pending Lot 1 packet completion, reconciliation, Integration Pass and acceptance.

## Explicitly out of Lot 1

- venue/vendor/guest/budget/task domain implementation;
- actual household invitation links or RSVP submissions;
- outbound Email/SMS/WhatsApp provider adapters/credentials/sends;
- communication campaigns/templates/webhooks;
- real wedding/customer data;
- production provider cutover;
- arbitrary public SaaS self-service project provisioning;
- Lot 2+ product functionality.
