# Mariage OS — Lot Acceptance Addendum: Invitations / RSVP / Communications

Status: **NORMATIVE V1 LOT-ACCEPTANCE ADDENDUM**

This addendum extends the existing lot acceptance criteria. It does not replace base quality/security/DoD requirements.

## Lot 1 additions — foundation hooks

Exit requires:

- public guest-capability route/shell can exist without becoming project-member auth;
- Settings/onboarding data model has Invitations & RSVP intent hooks;
- route/security architecture can distinguish `/app/p/:projectId/**` from `/rsvp/:token`;
- no provider SDK/credentials implemented in UI/domain;
- no guest capability grants project membership;
- synthetic multi-tenant tests include capability boundary placeholders/fixtures.

No outbound provider implementation is required/allowed as a shortcut in Lot 1.

## Lot 6 additions — functional Invitations / RSVP / Communications

### Data/domain

- FTR-105..119 have FIRs and appropriate states;
- contact points/invitation links/submissions/templates/campaigns/recipients/events schema implemented with same-project integrity;
- raw invitation token hash-at-rest behavior proven;
- guest-safe DTO endpoint/command boundary implemented;
- campaign/audience/preflight domain uses provider-neutral ports;
- dependency invalidation for RSVP/contact/link/campaign changes proven.

### UX/QIF

- Guests contains discoverable `Invitations & RSVP` workspace;
- Household detail includes Communication & RSVP section;
- campaign flow follows Purpose → Audience → Channel/Message → Preflight → Send/Schedule → Result;
- manual link/QR path works with zero automatic providers configured;
- guest RSVP mobile-first flow works without account;
- QIF review passes for couple and guest flows;
- no mega-table/provider-debug UI in primary path.

### Security

- cross-household capability tests deny;
- expired/revoked/rotated token tests deny;
- guest payload cannot inject other household/project ids;
- +1/child allowance enforced server-side;
- XSS/oversized/input validation tests pass;
- send permission checked at dispatch;
- campaign audience frozen/revalidated;
- idempotent send/retry tests pass;
- forged/replayed webhook contract tests pass against fake/test adapters;
- provider secrets absent from browser/test fixtures.

### Communications

- deterministic fake providers cover Email/SMS/WhatsApp port contracts;
- sandbox/test adapters may be used where available;
- canonical delivery states/errors work independently of provider;
- selective retry works;
- suppression works;
- scheduled-send model exists even if real scheduler hardening finishes Lot 11;
- no automatic real guest send occurs in Lot acceptance.

### Integration

- guest RSVP updates statistics;
- seating readiness reacts correctly;
- guest-count-dependent budget outputs react correctly without rewriting contractual truth;
- Dashboard/next actions receive correct high-level RSVP signals;
- import contacts does not send;
- export/backup excludes raw tokens/provider secrets.

## Checkpoint B additions

Checkpoint B cannot PASS unless:

- FTR-105..119 reconciled;
- all P0 `RSVP-*` / `COM-*` / `QIF-*` requirements applicable by this phase have evidence;
- GC-001..GC-040, GC-047..GC-056 and GC-058..GC-060 applicable non-production scenarios pass;
- manual link/QR fallback demonstrated;
- QIF usability review with representative first-time couple/guest flow passes;
- architecture review confirms provider SDKs are infrastructure adapters only;
- no new MAJOR/BLOCKING data/privacy/security finding remains.

Real provider production DNS/account/callback evidence may remain Lot 11.

## Lot 11 additions — production provider hardening

For each automatic channel enabled in production:

- provider choice/adapter reviewed;
- production credentials securely configured;
- sender identity/domain/number requirements satisfied;
- webhook signature/authentication verified with real provider/test event;
- retry/idempotency/replay behavior verified;
- send/cost caps configured;
- monitoring/diagnostics available;
- provider outage mode tested;
- synthetic/test-recipient send status path verified;
- no production secret appears in client bundle/log/repo.

Email additionally requires sending-domain authentication readiness evidence.

WhatsApp additionally requires official Business-compatible platform/provider/template eligibility evidence.

If a channel is intentionally not production-enabled, UI must mark it unavailable and secure link/QR fallback must remain operational.

## Lot 12 / Checkpoint D additions

- guest contact migration/reconciliation reviewed;
- representative real owner can find and prepare Invitations & RSVP from supported devices;
- representative guest can complete RSVP on supported mobile browser;
- controlled synthetic/test-recipient real-channel smoke run performed for each enabled automatic channel before real guest campaign;
- real production send caps reviewed;
- QIF cutover review PASS;
- no real guest campaign is required as a software cutover test if couple is not ready to send invitations yet.

## Evidence naming

Feature evidence should reference:
- `FTR-105..120`
- `RSVP-*`
- `COM-*`
- `QIF-*`
- `COMMOPS-*`
- `GC-*`
- applicable `SEC-*`/`AUTHZ-*`.

A lot may not mark communications “done” merely because one provider successfully sent one message.