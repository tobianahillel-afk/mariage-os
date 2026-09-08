from pathlib import Path
import re


def require_once(text: str, needle: str, label: str) -> None:
    count = text.count(needle)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")


c_path = Path("docs/roadmap/lot-2/WP-2.6C.md")
old_c = c_path.read_text()
require_once(old_c, "# WP-2.6C — Venue contacts and interactions", "WP-2.6C identity")
require_once(old_c, "- State: `PLANNED`", "WP-2.6C state")
require_once(old_c, "- applicable `SEC-VAL-*`, `SEC-VER-*`, `SEC-DATA-*` controls;", "WP-2.6C stale security refs")

c_path.write_text("""# WP-2.6C — Venue contacts

## Identity

- Work Packet ID: `WP-2.6C`
- Lot: `2`
- Name: Venue contacts
- State: `READY`
- Current pass: `PLAN`
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
- Downstream packet blocked by this packet: `WP-2.6D`; WP-2.7 remains blocked until C and D are accepted.
- Shared interfaces/contracts relied on: both Venue commercial workflow addenda, repository/service contracts, RLS matrix and runtime input validation.

## Specification gates

- Core commercial workflow freeze through `cf46c731bd45b77feaa514b22036096301280755`; CI `34170253114`: **5/5 SUCCESS**.
- Canonical phone/WhatsApp and mutable-contact boundaries frozen by `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50`; CI `34171320200`: **5/5 SUCCESS**.
- Activation revalidation found that the former combined C packet's 10-point estimate depended on direct ordinary RLS contact mutation. Accepted Lot-2 revisioned mutation precedent instead uses atomic RPC command boundaries. Keeping contacts plus interaction append/replay would therefore exceed 10 points and violate the mandatory split rule.
- Split decision: **CONTACTS / INTERACTIONS**, product scope unchanged; no unresolved material contact specification blocker remains.

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

Not started. Entry requires exact full CI success on this READY/split-governance head, followed by a durable `READY → IN_PROGRESS / A-IMPLEMENT` transition for WP-2.6C only.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `READY`
- Current/next pass: `PLAN`
- WP-2.6B acceptance-governance verification: `8911f1523d96b95cf1329c4b144bfec2356a4a47` / `34275967235` — **5/5 SUCCESS**
- Split finding: combined contacts/interactions packet would exceed 10 points once real contact command/revision boundaries are counted; **RESOLVED by decomposition before production code**
- Remaining blocker/finding: none; exact split-governance CI is the only gate before implementation activation
- Next permitted action: verify this exact READY/split-governance HEAD, then transition WP-2.6C only to `IN_PROGRESS / A-IMPLEMENT`. Do not start WP-2.6D or WP-2.7 concurrently.
""")

d_path = Path("docs/roadmap/lot-2/WP-2.6D.md")
if d_path.exists():
    raise SystemExit("WP-2.6D already exists; refusing to overwrite")
d_path.write_text("""# WP-2.6D — Venue interaction history

## Identity

- Work Packet ID: `WP-2.6D`
- Lot: `2`
- Name: Venue interaction history
- State: `PLANNED`
- Current pass: `PLAN`
- Primary bounded context: Venue interaction and quote-follow-up history
- Branch/PR: `lot-2/venues-core` / PR not opened yet
- Parent responsibility: original matrix packet `WP-2.6`, split from former WP-2.6C at activation sizing review

## Scope

### Primary Feature IDs

- `FTR-026` — Lot-2 Venue interaction responsibility only

### Current-lot responsibilities covered

- Venue-owned append-oriented interaction history;
- strict `occurred_at` and optional `next_follow_up_at` instant boundaries;
- bounded non-empty interaction type and required plain-text summary;
- optional same-project source link;
- optional contact link that must belong to the same Venue parent;
- stable caller-generated UUID replay identity for ambiguous retries;
- same-ID/same-payload idempotent replay and same-ID/different-payload typed conflict;
- append immutability, project-scoped read/write authorization and fail-closed provider parsing;
- interaction list/read model for later WP-2.11 presentation without creating Tasks or provider messages.

### Requirements / Acceptance / Security IDs

- Lot-2 interaction slice of `FTR-026`;
- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`;
- applicable `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..005`, `SEC-AUTHZ-007..009`, `SEC-VAL-001..006`, `SEC-VAL-008`, `SEC-VAL-010`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-LOG-002`, `SEC-LOG-004`, `SEC-ABUSE-004`, `SEC-VER-001`, `SEC-VER-005` controls;
- interaction/replay rules frozen by the two commercial workflow addenda.

### Explicitly out of scope for this packet

- contact create/update (`WP-2.6C`);
- offers/components (`WP-2.6A`);
- availability (`WP-2.6B`);
- Email/SMS/WhatsApp sending or delivery-provider semantics;
- automatic Tasks/reminders (Lot 3); `next_follow_up_at` remains metadata only;
- Vendor contacts/interactions (Lot 7);
- offline queue (WP-2.10/2.12);
- Venue UI presentation (WP-2.11).

## Dependency / sequencing

- Required prior packets/features: WP-2.1, WP-2.6A and WP-2.6B **ACCEPTED**; `WP-2.6C` must be **ACCEPTED** before activation so contact-parent integrity can be implemented against stable contact semantics.
- Downstream packet blocked by this packet: WP-2.7 until the decomposed WP-2.6 responsibility is fully accepted.
- Shared interfaces/contracts relied on: both Venue commercial workflow addenda, strict instant contract, contact contract from WP-2.6C, repository/service contracts, RLS matrix and runtime input validation.

## Specification gates

- Core commercial workflow freeze through `cf46c731bd45b77feaa514b22036096301280755`; CI `34170253114`: **5/5 SUCCESS**.
- Stable interaction UUID replay and same-Venue contact boundaries frozen by `6dce81a49ccdbb7bc9da54b2491a0c8746e12e50`; CI `34171320200`: **5/5 SUCCESS**.
- Activation remains intentionally deferred until WP-2.6C is accepted; revalidate exact history ordering/provider precision and shared contact interfaces before `READY`.

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

The append-only interaction table, same-Venue contact/source integrity, stable UUID replay command, strict instant/text validation, immutability, RLS and provider boundary form one historical-event vertical slice. Splitting replay from persistence would weaken review.

## Expected vertical slice

- UI/route: none.
- application command/query/service: append/replay interaction and list/read history.
- domain rules/invariants: strict instants, bounded text, same-Venue contact/source integrity, immutable replay equality.
- ports/interfaces: Venue interaction command/query port.
- infrastructure adapters: project-scoped Supabase interaction adapter with fail-closed parsing.
- cloud persistence/RLS: staged `interactions` with `parent_type='venue'`, immutable historical rows, atomic replay and project isolation.
- local/offline behavior: none; later packets preserve stable UUID identity.
- import/export/backup/versioning impact: versioned schema only.
- UX/QIF/accessibility impact: none in this packet.

## Pass A — IMPLEMENT

Not started.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / RECONCILIATION

Not started.

## Handoff

- Current state: `PLANNED`
- Current/next pass: `PLAN`
- Dependency blocker: WP-2.6C must be accepted first
- Remaining activation review: revalidate exact history ordering/provider timestamp precision and shared contact interface after WP-2.6C
- Next permitted action: none while WP-2.6C is current. Do not start WP-2.7 concurrently.
""")

matrix = Path("docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md")
text = matrix.read_text()
old_header = "Status: **IN_PROGRESS — WP-2.1..WP-2.6B ACCEPTED; WP-2.6C NEXT AFTER ACCEPTANCE-GOVERNANCE VERIFICATION**"
require_once(text, old_header, "matrix header")
text = text.replace(old_header, "Status: **IN_PROGRESS — WP-2.1..WP-2.6B ACCEPTED; WP-2.6C READY AFTER MANDATORY SIZING SPLIT; WP-2.6D PLANNED**", 1)
old_row = "| venue contacts/interactions/quote-follow-up data basics without Task workflow | FTR-026 (Lot 2 responsibility) | WP-2.6C, WP-2.11 | WP-2.1, WP-2.6A/B accepted by default sequence | contact revision, interaction append/replay, same-project/parent tests + later detail UI |"
require_once(text, old_row, "matrix FTR-026 row")
text = text.replace(old_row, "| venue contacts/interactions/quote-follow-up data basics without Task workflow | FTR-026 (Lot 2 responsibility) | WP-2.6C, WP-2.6D, WP-2.11 | WP-2.1, WP-2.6A/B accepted; C before D | contact revision + interaction append/replay + same-project/parent tests + later detail UI |", 1)
old_recon = "The original WP-2.6 responsibility remains fully assigned after orchestration decomposition: offers/components → WP-2.6A, availability → WP-2.6B, contacts/interactions → WP-2.6C; A+B are accepted and C remains planned."
require_once(text, old_recon, "matrix reconciliation")
text = text.replace(old_recon, "The original WP-2.6 responsibility remains fully assigned after orchestration decomposition: offers/components → WP-2.6A, availability → WP-2.6B, contacts → WP-2.6C, interactions → WP-2.6D; A+B are accepted, C is READY after mandatory sizing split and D remains planned.", 1)
replace_pairs = [
    ("Boundary retained: availability → WP-2.6B; contacts/interactions → WP-2.6C; Budget/Vendor/Documents/offline/UI remain downstream/out of scope.", "Boundary retained: availability → WP-2.6B; contacts → WP-2.6C; interactions → WP-2.6D; Budget/Vendor/Documents/offline/UI remain downstream/out of scope."),
    ("Boundary retained: contacts/interactions → WP-2.6C; Budget/scenario integration → Lot 5; Documents/offline/UI remain downstream/out of scope; whole `FTR-025` stays **IN_PROGRESS**.", "Boundary retained: contacts → WP-2.6C; interactions → WP-2.6D; Budget/scenario integration → Lot 5; Documents/offline/UI remain downstream/out of scope; whole `FTR-025` stays **IN_PROGRESS**."),
    ("Next permitted action: verify the exact WP-2.6B acceptance-governance HEAD, then activate/revalidate WP-2.6C. WP-2.7 remains blocked until the decomposed WP-2.6 sequence is complete.", "Next permitted action: verify the exact WP-2.6C split/READY governance HEAD, then transition WP-2.6C only to `IN_PROGRESS / A-IMPLEMENT`. WP-2.6D and WP-2.7 remain blocked concurrently."),
]
for old, new in replace_pairs:
    require_once(text, old, f"matrix replacement {old[:40]}")
    text = text.replace(old, new, 1)

pattern = re.compile(r"### WP-2\.6C — Venue contacts and interactions\n.*?(?=\n### WP-2\.7)", re.S)
replacement = """### WP-2.6C — Venue contacts

State: **READY**
Current pass: **PLAN**

Primary Feature: FTR-026 Lot-2 contact responsibility.
Dependencies: WP-2.1, WP-2.6A and WP-2.6B **ACCEPTED**.
Acceptance record: `WP-2.6C.md`.
Estimated size after activation revalidation: **9 points** — one contact table, one migration family, one atomic save command family and one RLS/authorization boundary.
Split rationale: the former combined 10-point packet assumed direct ordinary RLS contact mutation; accepted revisioned mutation precedent requires a real command boundary, which would push contacts + interaction append/replay above 10. The hard split occurred before production code.
Scope: caller-owned Venue contact identity, canonical phone/text validation, create/update with expected revision, immutable parent identity, RLS and fail-closed provider parsing. Interaction history is now WP-2.6D.
Next permitted action: exact full CI on this READY/split-governance head, then transition WP-2.6C only to `IN_PROGRESS / A-IMPLEMENT`.

### WP-2.6D — Venue interaction history

State: **PLANNED**
Current pass: **PLAN**

Primary Feature: FTR-026 Lot-2 interaction responsibility.
Dependencies: WP-2.6C **ACCEPTED** plus prior WP-2.6A/B acceptance.
Acceptance record: `WP-2.6D.md`.
Estimated size: **9 points** — one append-only interaction table, one migration family, one atomic append/replay command and one RLS/authorization boundary.
Scope: immutable interaction history, strict occurred/follow-up instants, same-Venue optional contact, same-project source, stable UUID replay, project isolation and fail-closed provider parsing. Automatic Task/reminder workflow remains Lot 3.
Activation review retained: revalidate deterministic history ordering/provider timestamp precision and the accepted contact interface before READY.

#### Fragmentation review — PASS

The Lot now contains one additional execution unit because the normative `>10` hard split rule was triggered by real command-boundary revalidation. This is not file-level fragmentation: WP-2.6C is the mutable contact/revision slice and WP-2.6D is the immutable interaction/replay slice, each independently reviewable at 9 points with distinct persistence and failure modes. Product Feature scope is unchanged, `FTR-026` remains cross-lot/unfinished, and required Lot-2 responsibilities minus assigned packet responsibilities remains **∅**.
"""
text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f"matrix WP-2.6C section: expected one match, found {count}")
matrix.write_text(text)

status = Path("docs/roadmap/IMPLEMENTATION-STATUS.md")
text = status.read_text()
old_table = "| WP-2.6C | Venue contacts and interactions | PLANNED |"
require_once(text, old_table, "status packet table")
text = text.replace(old_table, "| WP-2.6C | Venue contacts | **READY** |\n| WP-2.6D | Venue interaction history | PLANNED |", 1)
old_c_line = "- `WP-2.6C` — Venue contacts + interactions — **PLANNED / PLAN**, estimated 10 points with same-Venue contact/interaction parent-integrity cohesion rationale. If actual privileged command count raises C above 10, split contacts/interactions before code."
require_once(text, old_c_line, "status decomposition")
text = text.replace(old_c_line, "- `WP-2.6C` — Venue contacts — **READY / PLAN**, revalidated at 9 points with one contact table, one atomic save command family and one RLS boundary;\n- `WP-2.6D` — Venue interaction history — **PLANNED / PLAN**, estimated 9 points with append/replay/history cohesion.\n\nActivation sizing review: **MANDATORY SPLIT PERFORMED BEFORE PRODUCTION CODE**. The former combined C packet's 10-point estimate assumed direct ordinary-RLS contact mutation; accepted revisioned mutation precedent requires a real command boundary, so keeping contact mutation plus interaction append/replay would exceed 10. Fragmentation review: **PASS** — C and D are distinct mutable-reference vs immutable-history slices, not file-level fragments.", 1)
old_parent = "Required original WP-2.6 responsibilities minus assigned A/B/C responsibilities: **∅**. WP-2.6A-owned responsibility is accepted/evidenced with gap **∅**; the original parent responsibility remains incomplete until B/C are accepted."
require_once(text, old_parent, "status parent reconciliation")
text = text.replace(old_parent, "Required original WP-2.6 responsibilities minus assigned A/B/C/D responsibilities: **∅**. WP-2.6A and WP-2.6B responsibilities are accepted/evidenced with gap **∅**; the original parent responsibility remains incomplete until C/D are accepted.", 1)
old_b_evidence = "- WP-2.6B ACCEPTED; `WP2.6B-B-001..005` resolved/verified; final fresh reviewed head `e92af194f774895b3b397d3be60350d09d42d8ff`, CI `34263468532` 5/5; corrected Pass-C entry `6e091cc5088fece027f13c6764092453da18f418` / `34274455248` 5/5; responsibility gap **∅**."
require_once(text, old_b_evidence, "status B evidence")
text = text.replace(old_b_evidence, old_b_evidence[:-1] + "; final acceptance-governance verification `8911f1523d96b95cf1329c4b144bfec2356a4a47` / `34275967235` 5/5.", 1)

handoff_pairs = [
    ("Current Packet: WP-2.6B", "Current Packet: WP-2.6C"),
    ("Packet State: ACCEPTED", "Packet State: READY"),
    ("Current Pass: COMPLETE", "Current Pass: PLAN"),
    ("Planned commercial subpacket after current: WP-2.6C", "Planned commercial subpacket after current: WP-2.6D"),
    ("Next permitted action: verify the exact WP-2.6B acceptance-governance HEAD containing this decision, then activate/revalidate WP-2.6C. Do not start WP-2.7 concurrently.", "Next permitted action: verify the exact WP-2.6C split/READY governance HEAD, then transition WP-2.6C only to IN_PROGRESS / A-IMPLEMENT. Do not start WP-2.6D or WP-2.7 concurrently."),
    ("Next commercial packet: WP-2.6C — PLANNED / PLAN", "Current commercial packet: WP-2.6C — READY / PLAN\nFollowing commercial packet: WP-2.6D — PLANNED / PLAN"),
    ("Next permitted action: verify the exact corrected C-ACCEPTANCE governance HEAD, then reconcile WP-2.6B Pass C. WP-2.6C and WP-2.7 remain prohibited concurrently.", "Next permitted action: verify the exact WP-2.6C split/READY governance HEAD, then transition WP-2.6C only to IN_PROGRESS / A-IMPLEMENT. WP-2.6D and WP-2.7 remain prohibited concurrently."),
]
for old, new in handoff_pairs:
    require_once(text, old, f"status handoff {old[:40]}")
    text = text.replace(old, new, 1)
marker = "WP-2.6B corrected Pass-C entry head/run: 6e091cc5088fece027f13c6764092453da18f418 / 34274455248 — 5/5 SUCCESS"
require_once(text, marker, "status B handoff marker")
text = text.replace(marker, marker + "\nWP-2.6B final acceptance-governance head/run: 8911f1523d96b95cf1329c4b144bfec2356a4a47 / 34275967235 — 5/5 SUCCESS\nWP-2.6C split decision: mandatory >10 prevention; contacts → C (9 points), interactions → D (9 points); fragmentation review PASS", 1)
status.write_text(text)
