# WP-2.6C — Venue contacts

## Identity

- Work Packet ID: `WP-2.6C`
- Lot: `2`
- Name: Venue contacts
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: Venue contact identity/reference data
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Parent responsibility: original matrix packet `WP-2.6`, split again at activation because the combined contacts/interactions packet exceeded the hard complexity threshold once its real command surfaces were revalidated

## Scope

### Primary Feature IDs

- `FTR-026` — Lot-2 Venue contact responsibility only

### Current-lot responsibilities covered

- Venue-owned contact identity/details with expected-revision collaborative updates;
- canonical phone/WhatsApp numeric value grammar and frozen contact text bounds;
- immutable project/Venue parent identity across updates;
- caller-generated canonical UUID contact identity;
- one atomic contact save command family covering create/update while preserving explicit expected-revision conflict semantics;
- project-scoped read/write authorization and fail-closed provider parsing;
- contact list/read model for later WP-2.6D same-Venue interaction links and WP-2.11 presentation.

### Requirements / Acceptance / Security IDs

- Lot-2 contact slice of `FTR-026`;
- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`;
- applicable `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..005`, `SEC-AUTHZ-007..009`, `SEC-VAL-001..006`, `SEC-VAL-008`, `SEC-VAL-010`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-LOG-002`, `SEC-LOG-004`, `SEC-VER-001`, `SEC-VER-005` controls;
- Venue contact rules frozen by the two commercial workflow addenda.

### Explicitly out of scope for this packet

- interaction append/history (`WP-2.6D`);
- offers/components (`WP-2.6A`);
- availability (`WP-2.6B`);
- Email/SMS/WhatsApp sending or provider semantics;
- automatic Tasks/reminders (Lot 3);
- Vendor contacts/interactions (Lot 7);
- offline queue (WP-2.10/2.12);
- Venue UI presentation (WP-2.11).

No ordinary contact hard-delete command is introduced by this packet. The frozen implementation slice specifies create/update/list with optimistic revision but no contact deletion lifecycle, and later immutable interactions may retain a contact relationship. If a later governing contract requires deletion semantics, this packet must be re-sized before that scope is added.

## Dependency / sequencing

- Required prior packets/features: WP-2.1, WP-2.6A and WP-2.6B **ACCEPTED**.
- WP-2.6B final acceptance-governance verification: `8911f1523d96b95cf1329c4b144bfec2356a4a47` / `34275967235` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- WP-2.6C split-governance entry head/run: `caa01a39c73a68a9f03df8a6d4a2c7ec6d12fd84` / `34278672342` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Downstream packet blocked by this packet: `WP-2.6D`; WP-2.7 remains blocked until C and D are accepted.
- Shared interfaces/contracts relied on: both Venue commercial workflow addenda, repository/service contracts, RLS matrix and runtime input validation.

## Specification gates

- Core commercial workflow freeze through `cf46c731bd45b77feaa514b22036096301280755`; CI `34170253114`: **5/5 SUCCESS**.
- Canonical phone/WhatsApp and mutable-contact boundaries frozen by `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50`; CI `34171320200`: **5/5 SUCCESS**.
- Activation revalidation found that the former combined C packet's 10-point estimate depended on direct ordinary RLS contact mutation. Accepted Lot-2 revisioned mutation precedent instead uses atomic RPC command boundaries. Keeping contacts plus interaction append/replay would therefore exceed 10 points and violate the mandatory split rule.
- Split decision: **CONTACTS / INTERACTIONS**, product scope unchanged; no unresolved material contact specification blocker remains.
- Exact READY/split-governance gate `caa01a39c73a68a9f03df8a6d4a2c7ec6d12fd84` / `34278672342`: **5/5 SUCCESS**. Pass A entry is open.

## Sizing review

| Complexity source | Count | Points each | Total |
|---|---:|---:|---:|
| new/meaningfully changed bounded domain | 1 | 3 | 3 |
| new persistent entity/table | 1 | 1 | 1 |
| new migration family | 1 | 1 | 1 |
| new RPC/public endpoint/capability command | 1 | 2 | 2 |
| new/changed RLS or privileged authorization boundary | 1 | 2 | 2 |
| major UI route/workflow | 0 | 1 | 0 |
| public/unauthenticated capability surface | 0 | 2 | 0 |
| external provider integration | 0 | 3 | 0 |
| offline/sync semantics | 0 | 2 | 0 |
| security-sensitive token/crypto boundary | 0 | 2 | 0 |
| financial/calculation critical engine | 0 | 3 | 0 |
| backup/import/version migration semantics | 0 | 2 | 0 |
| **Total** |  |  | **9** |

### 9-point cohesion rationale

The contact table, canonical value grammar, one atomic save command, expected-revision conflict semantics, parent immutability, RLS and provider validation form one mutable-reference vertical slice. Splitting those concerns would weaken independent review. Interaction append/replay/history is independent and is now `WP-2.6D`.

## Expected vertical slice

- UI/route: none.
- application command/query/service: one atomic contact save command for create/update plus list/read.
- domain rules/invariants: UUID/project/Venue identity, text/phone normalization, expected revision and immutable parent identity.
- ports/interfaces: Venue contact command/query port.
- infrastructure adapters: project-scoped Supabase contact adapter with fail-closed parsing.
- cloud persistence/RLS: staged `contacts` with `parent_type='venue'`, revision/audit protection and project isolation.
- local/offline behavior: none.
- import/export/backup/versioning impact: versioned schema only.
- UX/QIF/accessibility impact: none in this packet.

## Pass A — IMPLEMENT

**IN_PROGRESS.** Entry gate `caa01a39c73a68a9f03df8a6d4a2c7ec6d12fd84` / `34278672342` is 5/5 SUCCESS. Implement only the Venue-contact vertical slice. Start with an explicit red-first proof before migration/domain/adapter remediation; do not activate WP-2.6D concurrently.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `IN_PROGRESS`
- Current/next pass: `A-IMPLEMENT`
- WP-2.6C split-governance entry: `caa01a39c73a68a9f03df8a6d4a2c7ec6d12fd84` / `34278672342` — **5/5 SUCCESS**
- Split finding: combined contacts/interactions packet would exceed 10 points once real contact command/revision boundaries are counted; **RESOLVED by decomposition before production code**
- Remaining blocker/finding: none at Pass-A entry
- Next permitted action: execute WP-2.6C Pass A with red-first evidence, then verify the exact implementation head. Do not start WP-2.6D or WP-2.7 concurrently.
