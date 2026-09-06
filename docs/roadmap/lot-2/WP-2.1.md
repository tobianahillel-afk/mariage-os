# WP-2.1 — Venue identity, authorized persistence and lifecycle-history foundation

## Identity

- Work Packet ID: `WP-2.1`
- Lot: `2`
- Name: Venue identity, authorized persistence and lifecycle-history foundation
- State: `ACCEPTED`
- Current pass: `COMPLETE`
- Primary bounded context: `venues`
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Reviewed implementation head: `3418659d94d35f61183f0a20c367c74e38e86802`
- Exact implementation CI: run `34039296392` — **5/5 SUCCESS**, including clean-checkout `npm run verify`

## Scope

### Primary Feature IDs

- `FTR-013` — packet responsibility: canonical venue identity/persistence and minimal quick-add command foundation.
- `FTR-014` — packet responsibility: pre-contractual lifecycle transition, rejection/restore and durable status-history foundation.

The whole Feature IDs remain broader than this packet. In particular, duplicate-warning/UI/local-first responsibilities are completed by later Lot 2 packets, so feature-level status is not equated with this packet acceptance.

### Current-lot responsibilities accepted here

- project-scoped `venues` persistence with stable UUID, human code/name/location/contact core and revision/audit metadata;
- deterministic natural human-code sorting without JavaScript integer-precision loss;
- minimal canonical venue creation without unrelated required detail fields;
- no ordinary hard-delete path;
- canonical stored Venue lifecycle vocabulary, including the reconciled non-contractual `reserve` state;
- reversible rejection with mandatory reason and retained history;
- narrow generic pre-contractual lifecycle command rather than arbitrary status mutation;
- protected commitment/terminal statuses unavailable through the generic lifecycle command;
- meaningful lifecycle events in the generic `activity_log` rather than a parallel audit architecture;
- explicit `venues.read` / `venues.write` grants/RLS behavior;
- direct anon/outsider/project-B/revoked denial and permitted owner/editor behavior;
- expected-revision stale-write protection for ordinary edits and lifecycle transitions;
- provider-neutral application ports and Supabase infrastructure adapters reusable by downstream local-first/UI packets.

### Requirements / Acceptance / Security IDs

- `VEN-001`, `VEN-002`, `VEN-006`, `VEN-012`;
- `PRD-007`;
- `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-004`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;
- `ACC-005`, `ACC-006` security/isolation behavior as applicable to the new Venue resource;
- `ACC-032` rejection/history/restore packet responsibility;
- `ACC-021` minimal-creation side only. Explicit `Unknown/To verify` fact rendering remains WP-2.3/WP-2.11 responsibility and is not falsely claimed here.

### Explicitly out of scope

- spaces/capacity;
- partner ratings/favorites;
- facts/criteria/observations/sources;
- offers/availability/access routes;
- media/documents/tags;
- Venue local cache/pending-mutation semantics beyond reusable cloud command/repository contracts;
- gallery/table/detail/compare/visit UI;
- fuzzy duplicate matching/import external identifiers;
- selection/contract/payment/confirmation/completion/archive commands whose stronger workflow semantics are not yet implemented;
- Tasks/Map/Budget/Vendor functionality.

## Dependency / sequencing

- Lot 0: `ACCEPTED`.
- Lot 1: `ACCEPTED`, promoted to `main` through PR #7 before Lot 2 kickoff.
- Downstream prerequisite unlocked by this acceptance: WP-2.2 through WP-2.12 may rely on canonical Venue identity/persistence.
- Shared accepted foundations reused: `has_project_permission`, permission catalog, project tenancy/RLS, protected project shell, migration conventions and provider/application layering.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/changed bounded domain | 1 | 3 | 3 |
| persistent entity/table | 2 (`venues`, `activity_log`) | 1 | 2 |
| migration family | 1 | 1 | 1 |
| RPC/capability command family | 1 | 2 | 2 |
| RLS/privileged authorization boundary | 1 | 2 | 2 |
| **Total** |  |  | **10** |

Cohesion rationale: Venue identity, lifecycle history and protected mutation authorization were reviewed together so no intermediate generic status/update bypass could be accepted.

## Pass A — IMPLEMENT

### Implementation evidence

Domain/application:

- `src/domain/venues/venue-status.ts` + tests — canonical vocabulary, rejection semantics and protected-target guard;
- `src/domain/venues/venue-code.ts` + tests — deterministic natural sorting using string-safe numeric comparison;
- `src/domain/venues/venue-quick-add.ts` + tests — centralized minimal validation, length limits and standards-aware URL parsing;
- `src/domain/venues/venue-revision.ts` + tests — expected revision validation;
- `src/application/venues/venue-command-port.ts`, `quick-add-venue.ts`, `change-venue-status.ts` + tests — provider-neutral create/lifecycle boundary;
- `src/application/venues/venue-repository-port.ts`, `update-venue-core.ts` + tests — project-scoped list/get/ordinary-edit boundary.

Infrastructure:

- `src/infrastructure/supabase/supabase-venue-command-adapter.ts` + tests — safe-field insert, exact expected-project response binding, protected lifecycle RPC;
- `src/infrastructure/supabase/parse-venue-core-row.ts` + tests — runtime validation of UUID/project/status/rejection/revision response state;
- `src/infrastructure/supabase/supabase-venue-repository-adapter.ts` + tests — project-filtered reads and expected-revision ordinary update RPC.

Migrations/schema:

- `supabase/migrations/20260906114000_create_venue_core.sql` — canonical `venues`, generic `activity_log`, base grants/RLS/audit revision trigger;
- `supabase/migrations/20260906115400_harden_activity_log_event_time.sql` — wall-clock event timestamp for meaningful intra-transaction ordering;
- `supabase/migrations/20260906132000_harden_venue_mutation_boundaries.sql` — expected-revision RPCs, direct UPDATE revocation, database URL-scheme guard and removal of premature operation-ID transition overload;
- `supabase/migrations/20260906141500_harden_venue_lifecycle_authorization.sql` — authorization-before-lock + post-lock recheck and protected lifecycle target/current-state guard.

Narrow specification repair:

- `docs/domain/STATE-MACHINES-VENUE-LIFECYCLE-ADDENDUM.md` — reconciles `reserve`, generic pre-contractual transitions, protected statuses and privileged authorization/locking order without changing feature scope.

DB/security tests:

- `supabase/tests/venue_core_rls_test.sql` — 54 direct assertions after remediation;
- `supabase/tests/venue_lifecycle_hardening_test.sql` — 11 additional assertions for authorization-before-lock, null/protected targets, `reserve`, retained history and protected-current-state denial.

## Pass B — ADVERSARIAL REVIEW

### Original findings and remediation

| Severity | Finding | Resolution | Final state |
|---|---|---|---|
| MAJOR `WP2.1-B-001` | Ordinary/lifecycle mutation lacked expected revision and allowed stale overwrite/replay intent. | Added `expectedRevision` through domain/application/adapter/RPC boundaries; DB compares locked current revision and raises stale failure; direct stale tests added. | **RESOLVED** |
| MAJOR `WP2.1-B-002` | Lifecycle exposed `operationId` without the later receipt/replay contract. | Removed the premature operation-ID RPC overload/surface. WP-2.10/Lot 10 remain owners of durable operation receipts/idempotent retry orchestration. | **RESOLVED** |
| MAJOR `WP2.1-B-003` | Direct API could persist unsupported `website_url` schemes. | Added DB `http/https` scheme constraint and direct bypass test; application keeps standards-aware `URL` parsing. | **RESOLVED** |
| MAJOR `WP2.1-B-004` | Quick-add response accepted a valid UUID from another project. | Creation response parser now requires returned `project_id === requested projectId`; cross-project response regression test added. | **RESOLVED** |
| MODERATE `WP2.1-B-005` | Numeric code comparison could lose precision through JS `Number`. | Replaced numeric conversion with arbitrary-length string-safe significant-digit comparison and regression tests. | **RESOLVED** |

### Fresh re-review findings and remediation

| Severity | Finding | Resolution | Final state |
|---|---|---|---|
| MAJOR `WP2.1-B-006` | Generic lifecycle command could assert commitment/terminal truth such as `selected` or `confirmed`. | Generic command now targets only pre-contractual planning states; TypeScript and DB both reject protected targets, and a Venue already in a protected state cannot leave through the generic command. | **RESOLVED** |
| MAJOR `WP2.1-B-007` | `SECURITY DEFINER` Venue commands acquired the target row lock before checking `venues.write`. | Both privileged commands now fail closed on live permission before lock and re-check after lock before mutation. pgTAP verifies ordering and behavior. | **RESOLVED** |
| MAJOR `WP2.1-B-008` | Normative docs disagreed over whether `reserve` is a Venue state. | Added the narrow state-machine addendum: `reserve` is a viable backup candidate only and carries no contractual/availability implication. | **RESOLVED** |

### Final adversarial re-review

Fresh review was performed against the final implementation head `3418659d94d35f61183f0a20c367c74e38e86802`, not against the original Pass-A intent. It re-read the packet contract, FTR-013/FTR-014, VEN-001/002/006/012, ACC-005/006/021/032, Venue/domain/state-machine/invariant contracts, runtime validation, ports/adapters, migrations and DB tests.

Checks performed:

- [x] missing requirement/acceptance behavior searched
- [x] direct API/RLS/project-B/outsider/revoked abuse searched
- [x] stale revision/race/retry paths searched
- [x] status/rejection/history consistency searched
- [x] protected contractual-state bypass searched
- [x] authorization-before-lock and post-lock revocation boundary searched
- [x] provider-response trust/project binding searched
- [x] URL direct-API bypass searched
- [x] natural-code precision/ordering searched
- [x] architecture/provider/layer drift searched
- [x] local/offline/UI responsibilities checked for false completion claims
- [x] import/backup/later-Lot leakage searched
- [x] real wedding/private data leakage searched
- [x] weak/mirroring test evidence searched

Fresh Pass B decision: **PASS** — no unresolved BLOCKING or MAJOR finding.

Packet entered `ACCEPTANCE_PENDING` for Pass C after this decision.

## Pass C — ACCEPTANCE / RECONCILIATION

### Entry gate

- [x] packet entered Pass C from fresh Pass B PASS
- [x] no unresolved BLOCKING/MAJOR finding exists
- [x] exact reviewed implementation head has full CI evidence

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| venue identity/persistence | project-scoped canonical Venue row, safe minimal create/edit core, stable UUID/revision | Venue schema, quick-add domain/application, repository/command ports and Supabase adapters | unit/adversarial suite + 54 Venue DB assertions + exact-head full verify | **PASS** |
| lifecycle/reject/restore | explicit pre-contractual transitions, mandatory rejection reason, reversible restore, protected-state guard | status domain, state-machine addendum, `transition_venue_status` hardening | domain tests + `venue_core_rls_test.sql` + 11 lifecycle-hardening assertions | **PASS** |
| lifecycle history | retain previous/current status and rejection semantics without duplicate same-state history | `activity_log`, lifecycle RPC metadata and event-time hardening | reject/restore/history/idempotence DB assertions | **PASS** |
| authorization/isolation | `venues.read/write`, no ordinary hard delete/direct status update, project isolation | grants/RLS + narrow `SECURITY DEFINER` commands with pre/post-lock authorization | anon/viewer/outsider/revoked/project-B/owner/editor direct pgTAP matrix | **PASS** |
| architecture/trust boundaries | domain/application/infra layering, provider-neutral ports, fail-closed response parsing | Venue ports, Supabase adapters, project-bound parsers | dependency-cruiser/Knip/typecheck + adapter/unit tests | **PASS** |

### Exact reviewed-head evidence

GitHub Actions run `34039296392` on `3418659d94d35f61183f0a20c367c74e38e86802`:

- **Core quality and security: SUCCESS**
  - 39 test files / **350 tests PASS**;
  - measured in-scope unit coverage **100% statements / branches / functions / lines**;
  - typecheck, Prettier, ESLint, dependency-cruiser, Knip, marker and negative controls PASS;
- **Local Supabase DB and RLS: SUCCESS**
  - **17 files / 359 pgTAP tests PASS**;
  - includes `venue_core_rls_test.sql` and `venue_lifecycle_hardening_test.sql`;
- **Browser and mutation harnesses: SUCCESS**
  - **40/40 Playwright E2E PASS** across Chromium, Firefox, WebKit and mobile Chromium;
  - mutation harness is globally green but currently targets `start-application.ts`; it is deliberately **not** claimed as Venue mutation evidence for WP-2.1;
- **Privacy-safe preview artifact: SUCCESS**;
- **Full verify from clean checkout: SUCCESS** with `npm run verify`.

Known dependency-audit output remains the previously reviewed two Moderate transitive `qs` development-tool advisories. No Critical/High accepted-known vulnerability is introduced by WP-2.1.

### Acceptance checks

- [x] all packet responsibilities reconciled
- [x] FIR-equivalent durable record complete
- [x] automated/security evidence green
- [x] no BLOCKING/MAJOR finding open
- [x] architecture/complexity/static gates green
- [x] no false claim of UI/offline/duplicate-detection completion
- [x] downstream prerequisites clearly recorded

Required WP-2.1 responsibilities minus accepted/evidenced WP-2.1 responsibilities: **∅**.

Final packet decision: **`ACCEPTED`**.

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `COMPLETE`
- Reviewed implementation head: `3418659d94d35f61183f0a20c367c74e38e86802`
- Exact implementation verification: run `34039296392` — **5/5 SUCCESS**, clean-checkout verify PASS
- Open WP-2.1 BLOCKING/MAJOR findings: **none**
- Accepted responsibility gap: **∅**
- Next permitted packet: **WP-2.2 — Spaces, capacity and member ratings/preferences**
- WP-2.2 must not reinterpret the protected lifecycle boundary; it consumes canonical Venue identity from this packet.
