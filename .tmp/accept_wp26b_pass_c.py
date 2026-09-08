from pathlib import Path
import re


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one replacement target, found {count}: {old!r}")
    path.write_text(text.replace(old, new, 1))


def replace_regex_once(path: Path, pattern: str, replacement: str) -> None:
    text = path.read_text()
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f"{path}: regex replacement count={count}: {pattern!r}")
    path.write_text(updated)


wp = Path("docs/roadmap/lot-2/WP-2.6B.md")
status = Path("docs/roadmap/IMPLEMENTATION-STATUS.md")
matrix = Path("docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md")

# Packet state only changes after the exact corrected Pass-C entry head is 5/5 green.
replace_once(wp, "- State: `ACCEPTANCE_PENDING`", "- State: `ACCEPTED`")
replace_once(wp, "- Current pass: `C-ACCEPTANCE`", "- Current pass: `COMPLETE`")

pass_c_and_handoff = r'''## Pass C — ACCEPTANCE / RECONCILIATION

Entry head/run `6e091cc5088fece027f13c6764092453da18f418` / `34274455248`: **5/5 SUCCESS**, including Core quality/security, Local Supabase DB/RLS, Browser E2E + mutation, privacy-safe preview and Full verify from clean checkout.

### Entry gate

- [x] packet entered Pass C from `ACCEPTANCE_PENDING`
- [x] current pass was `C-ACCEPTANCE`
- [x] no unresolved BLOCKING/MAJOR Pass B finding exists
- [x] exact corrected Pass-C governance head is 5/5 green

| Responsibility | Expected | Implemented evidence | Verified evidence | Result |
|---|---|---|---|---|
| Availability identity and immutable history | Multiple observations may coexist for one Venue/date; caller UUID is stable retry identity; historical rows are not ordinarily rewritten/deleted | `venue_availabilities`, domain/service/ports/adapter, append RPC and immutability triggers | domain/service tests + direct DB append/history/update/delete tests + `34274455248` | PASS |
| Date/date-option and instant semantics | exact civil date; optional same-project date option must match `event_date`; strict observed/expiry instants; referenced candidate date cannot drift away from immutable history | TS normalizers, strict SQL instant/date parsing/checks, composite `(project_id,date_option_id,event_date)` FK | invalid date/instant/expiry tests, date-option mismatch/cross-project tests, adversarial referenced-date `23503` regression | PASS |
| Source provenance/history | optional source is same-project; source breakage/URL removal never erases the availability observation | same-project source FK and immutable cited `source_id` | source-history pgTAP + cross-project source denial | PASS |
| Replay/idempotency/non-disclosure | same ID + same payload is idempotent; same ID + different payload is typed conflict; foreign-project UUID collision discloses nothing | caller-owned UUID, canonical payload equality, append RPC conflict/non-disclosure branches | domain/service/adapter replay tests + pgTAP replay/conflict + cross-project collision `42501` adversarial proof | PASS |
| Latest/effective read model | latest uses `observed_at DESC, created_at DESC, id ASC`; no observation remains distinct from explicit `unknown`; elapsed hold derives `expired` without history mutation | ordered Supabase query, validated provider order, service first same-date selection, pure effective-status derivation | domain/service/adapter tests + microsecond-order adversarial regression | PASS |
| Authorization/isolation | reads require `venues.read`; writes require live `venues.write`; direct table mutation is denied; project/revocation isolation is preserved | SELECT-only authenticated grant + RLS + writer-authorized RPC + project lock before permission check | owner/editor/viewer/anon/outsider/project-B/revoked matrix + authorization-concurrency regression | PASS |
| Provider trust boundary | malformed, duplicated or identity/payload-substituted provider responses fail closed | strict row parser, expected project/Venue/id checks, duplicate-ID rejection and exact receipt payload verification | parser/adapter/provider-time adversarial unit tests | PASS |
| Scope boundaries | no contacts/interactions, Task, Budget, Vendor, Document, offline queue or Venue UI authority is introduced | WP-2.6B-only domain/application/adapter/migrations/tests | packet diff review + architecture/static/dead-code gates on exact Pass-C entry head | PASS |

### Acceptance checks

- [x] all packet responsibilities reconciled
- [x] FIR-equivalent durable packet fields and links are complete for the WP-2.6B-owned slice
- [x] required automated evidence is green on the exact Pass-C entry head
- [x] no BLOCKING/MAJOR finding remains
- [x] architecture/complexity/static gates are green
- [x] documentation/status/coverage are synchronized for acceptance
- [x] downstream prerequisites remain explicit

Requirements/control reconciliation for the WP-2.6B-owned slice of `FTR-025` / `VEN-009`, applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`, and the explicit applicable `SEC-*` controls listed above: **PASS**.

Global Feature scenarios `ACC-031` (candidate dates / atomic selection) and `ACC-049` (historical quote under scenario change) remain whole-feature/cross-lot evidence tied to date/Budget responsibilities; WP-2.6B does **not** falsely claim them as availability-packet acceptance evidence. The direct packet requirement is `VEN-009` plus the frozen availability/replay/security invariants and their dedicated evidence.

Whole `FTR-025` remains **IN_PROGRESS**, not ACCEPTED: WP-2.6A and WP-2.6B Lot-2 responsibilities are accepted, while Budget/scenario integration continues in Lot 5.

Required WP-2.6B responsibilities minus accepted/evidenced WP-2.6B responsibilities: **∅**.

Deferred ownership remains explicit and is not claimed by this acceptance: contacts/interactions/FTR-026 → WP-2.6C; Budget/scenario truth → Lot 5; Vendor availability/commercial workflow → Lot 7; quote-document relationship → WP-2.9; local/offline integration → WP-2.10/2.12; Venue presentation/UI → WP-2.11.

**Pass C decision: PASS — WP-2.6B ACCEPTED.**

## Handoff

- Current state: `ACCEPTED`
- Current/next pass: `COMPLETE`
- WP-2.6A acceptance-governance verification: `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**
- Last green specification verification: `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903` — **5/5 SUCCESS**
- WP-2.6B READY/governance verification: `1ff69cd2e599a72a6cf703a658b836b2b3431619` / `34242853512` — **5/5 SUCCESS**
- WP-2.6B Pass-A verification: `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**
- Pass-B findings `WP2.6B-B-001..005`: **RESOLVED / VERIFIED**
- Final fresh Pass-B reviewed head/run: `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532` — **5/5 SUCCESS**
- Corrected Pass-C entry head/run: `6e091cc5088fece027f13c6764092453da18f418` / `34274455248` — **5/5 SUCCESS**
- Required responsibilities minus accepted/evidenced responsibilities: **∅**
- Remaining blocker/finding: **∅** for WP-2.6B
- Next permitted action: verify the exact acceptance-governance HEAD containing this decision, then activate/revalidate WP-2.6C. Do not start WP-2.7 concurrently.
'''
replace_regex_once(
    wp,
    r"## Pass C — ACCEPTANCE / RECONCILIATION\n\n.*\Z",
    pass_c_and_handoff,
)

# Living status board acceptance state and evidence.
replace_once(
    status,
    "| WP-2.6B | Venue availability observations | **ACCEPTANCE_PENDING — C-ACCEPTANCE** |",
    "| WP-2.6B | Venue availability observations | **ACCEPTED** |",
)
replace_once(
    status,
    "- `WP-2.6B` — append-oriented Venue availability observations — **ACCEPTANCE_PENDING / C-ACCEPTANCE**, estimated 9 points with evidence-history/replay cohesion rationale;",
    "- `WP-2.6B` — append-oriented Venue availability observations — **ACCEPTED / COMPLETE**, estimated 9 points with evidence-history/replay cohesion rationale;",
)
wp26a_evidence = "- WP-2.6A ACCEPTED; `WP2.6A-B-001..006` resolved/verified; final fresh reviewed head `c7339227126e0df6969809644b5d0eb2512d350c`, CI `34233201350` 5/5; Pass-C entry `d348abdb42a2ca8319fb6711c08551cfb3bcfbae` / `34235598936` 5/5; final acceptance-governance head `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` 5/5; responsibility gap **∅**."
replace_once(
    status,
    wp26a_evidence,
    wp26a_evidence + "\n- WP-2.6B ACCEPTED; `WP2.6B-B-001..005` resolved/verified; final fresh reviewed head `e92af194f774895b3b397d3be60350d09d42d8ff`, CI `34263468532` 5/5; corrected Pass-C entry `6e091cc5088fece027f13c6764092453da18f418` / `34274455248` 5/5; responsibility gap **∅**.",
)

status_closure = r'''### WP-2.6B — accepted packet closure

- dependency gate: WP-2.6A final acceptance-governance `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**;
- deterministic availability read-model repair `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903` — **5/5 SUCCESS**;
- READY/governance baseline `1ff69cd2e599a72a6cf703a658b836b2b3431619` / `34242853512` — **5/5 SUCCESS**;
- Pass-A implementation head/run `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**;
- Pass-B findings `WP2.6B-B-001..005`: **RESOLVED / VERIFIED**; final fresh Pass-B reviewed head/run `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532` — **5/5 SUCCESS**;
- corrected canonical Pass-C entry head/run `6e091cc5088fece027f13c6764092453da18f418` / `34274455248` — **5/5 SUCCESS**;
- exact Pass-C entry evidence: 107 unit files / 1022 tests PASS at 100% measured statements/branches/functions/lines; 44 DB files / 902 pgTAP tests PASS; Browser E2E + mutation, privacy-safe preview and Full verify from clean checkout PASS;
- Pass C reconciled immutable history, date/date-option and strict instant boundaries, source history, stable-UUID replay/non-disclosure, deterministic latest/effective selection, live authorization/RLS and fail-closed provider parsing: **PASS**;
- `VEN-009`, applicable AUTHZ IDs and explicit applicable SEC IDs: **PASS** for the WP-2.6B-owned responsibility;
- `ACC-031` / `ACC-049` remain whole-feature/cross-lot date/Budget scenarios and are not claimed as packet-owned evidence;
- required WP-2.6B responsibilities minus accepted/evidenced WP-2.6B responsibilities: **∅**;
- whole `FTR-025` remains **IN_PROGRESS** because Budget/scenario integration continues in Lot 5;
- deferred ownership remains explicit: contacts/interactions → WP-2.6C; Documents/offline/UI and later Budget/Vendor responsibilities remain downstream;
- Pass C decision: **PASS — WP-2.6B ACCEPTED**.

## Durable cursor'''
replace_regex_once(
    status,
    r"### WP-2\.6B Pass A / Pass B transition\n\n.*?\n## Durable cursor",
    status_closure,
)

durable_cursor = r'''## Durable cursor

```text
Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.6B
Packet State: ACCEPTED
Current Pass: COMPLETE
Last completed packet: WP-2.6B — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A, WP-2.6B
Planned commercial subpacket after current: WP-2.6C
WP-2.6 base freeze head/run: cf46c731bd45b77feaa514b22036096301280755 / 34170253114 — 5/5 SUCCESS
WP-2.6 boundary freeze head/run: 6dce81a49ccdbb7bc9da54b2491a0c8746e12e50 / 34171320200 — 5/5 SUCCESS
WP-2.6A final acceptance-governance head/run: 186933ed0af8c45ddaa1b5c883bfd3f70086c6fe / 34238484533 — 5/5 SUCCESS
WP-2.6B deterministic availability spec head/run: 9f5c8af30c58c146d89b1464cad96cb8e43dbc7b / 34239745903 — 5/5 SUCCESS
WP-2.6B READY/governance head/run: 1ff69cd2e599a72a6cf703a658b836b2b3431619 / 34242853512 — 5/5 SUCCESS
WP-2.6B Pass-A head/run: 1c1dd4db875e5253fc9affdcf498991c4c6a5f64 / 34253821826 — 5/5 SUCCESS
WP-2.6B final Pass-B reviewed head/run: e92af194f774895b3b397d3be60350d09d42d8ff / 34263468532 — 5/5 SUCCESS
WP-2.6B corrected Pass-C entry head/run: 6e091cc5088fece027f13c6764092453da18f418 / 34274455248 — 5/5 SUCCESS
Open WP-2.6B BLOCKING/MAJOR findings: ∅
Required WP-2.6B responsibilities minus accepted/evidenced responsibilities: ∅
Next permitted action: verify the exact WP-2.6B acceptance-governance HEAD containing this decision, then activate/revalidate WP-2.6C. Do not start WP-2.7 concurrently.
```
'''
replace_regex_once(
    status,
    r"## Durable cursor\n\n```text\n.*?```\n",
    durable_cursor,
)
replace_once(
    status,
    "- WP-2.6B `WP2.6B-B-001..B-005`: **RESOLVED / VERIFIED**; final fresh Pass B reviewed head `e92af194...` / CI `34263468532` — **5/5 SUCCESS**; Pass B decision **PASS**, Pass C active.",
    "- WP-2.6B `WP2.6B-B-001..B-005`: **RESOLVED / VERIFIED**; final fresh Pass B reviewed head `e92af194...` / CI `34263468532` — **5/5 SUCCESS**; corrected Pass-C entry `6e091cc...` / CI `34274455248` — **5/5 SUCCESS**; Pass C decision **PASS — ACCEPTED**.",
)
replace_once(
    status,
    "- WP-2.6A commercial offer/component responsibility for the Lot-2 slice of `FTR-025` / `VEN-008` is **ACCEPTED**. Whole FTR-025 remains intentionally incomplete because availability is WP-2.6B and Budget/scenario integration continues in Lot 5.\n- Original WP-2.6 product responsibility remains execution-mapped to WP-2.6A/B/C; WP-2.6B passed adversarial review and is in acceptance/reconciliation, while WP-2.6C remains not started.",
    "- WP-2.6A commercial offer/component responsibility for the Lot-2 slice of `FTR-025` / `VEN-008` is **ACCEPTED**.\n- WP-2.6B availability responsibility for the Lot-2 slice of `FTR-025` / `VEN-009` is **ACCEPTED**. Whole `FTR-025` remains **IN_PROGRESS** because Budget/scenario integration continues in Lot 5.\n- Original WP-2.6 product responsibility remains execution-mapped to WP-2.6A/B/C; A+B are accepted while WP-2.6C remains not started.",
)

# Coverage matrix: remove every stale READY/PLAN handoff for B and record acceptance evidence.
replace_once(
    matrix,
    "Status: **IN_PROGRESS — WP-2.1..WP-2.6A ACCEPTED; WP-2.6B ACCEPTANCE_PENDING / C-ACCEPTANCE**",
    "Status: **IN_PROGRESS — WP-2.1..WP-2.6B ACCEPTED; WP-2.6C NEXT AFTER ACCEPTANCE-GOVERNANCE VERIFICATION**",
)
replace_once(
    matrix,
    "Accepted/evidenced packet responsibilities so far: **WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5 and WP-2.6A**. Required WP-2.6A responsibilities minus accepted/evidenced WP-2.6A responsibilities: **∅**. WP-2.6B Pass A and Pass B are complete with no open BLOCKING/MAJOR finding; its acceptance remains pending Pass C. The original WP-2.6 responsibility remains fully assigned after orchestration decomposition: offers/components → WP-2.6A, availability → WP-2.6B, contacts/interactions → WP-2.6C; only the A-owned slice is accepted so far.",
    "Accepted/evidenced packet responsibilities so far: **WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A and WP-2.6B**. Required WP-2.6A responsibilities minus accepted/evidenced WP-2.6A responsibilities: **∅**. Required WP-2.6B responsibilities minus accepted/evidenced WP-2.6B responsibilities: **∅**. The original WP-2.6 responsibility remains fully assigned after orchestration decomposition: offers/components → WP-2.6A, availability → WP-2.6B, contacts/interactions → WP-2.6C; A+B are accepted and C remains planned.",
)

matrix_wp26b = r'''### WP-2.6B — Venue availability observations

State: **ACCEPTED**  
Current pass: **COMPLETE**

Primary Feature: FTR-025 Venue availability responsibility.  
Dependency: WP-2.6A **ACCEPTED**, final acceptance governance `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**.  
Packet record: `WP-2.6B.md`.  
Specification gates: commercial workflow `cf46c731...` / `34170253114`, append replay `6dce81a4...` / `34171320200`, deterministic latest/effective availability `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903`; all **5/5 SUCCESS**.  
Verified Pass-A implementation head/run: `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**.  
Resolved/verified fresh-review findings: `WP2.6B-B-001..B-005`; final fresh Pass-B reviewed head/run `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532` — **5/5 SUCCESS**, review **PASS**.  
Corrected Pass-C entry head/run: `6e091cc5088fece027f13c6764092453da18f418` / `34274455248` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.  
Pass C reconciliation: **PASS**.  
Required WP-2.6B responsibilities minus accepted/evidenced WP-2.6B responsibilities: **∅**.  
Boundary retained: contacts/interactions → WP-2.6C; Budget/scenario integration → Lot 5; Documents/offline/UI remain downstream/out of scope; whole `FTR-025` stays **IN_PROGRESS**.  
Next permitted action: verify the exact WP-2.6B acceptance-governance HEAD, then activate/revalidate WP-2.6C. WP-2.7 remains blocked until the decomposed WP-2.6 sequence is complete.

### WP-2.6C — Venue contacts and interactions'''
replace_regex_once(
    matrix,
    r"### WP-2\.6B — Venue availability observations\n\n.*?\n### WP-2\.6C — Venue contacts and interactions",
    matrix_wp26b,
)
replace_once(matrix, "WP-2.6B [READY / NEXT]", "WP-2.6B [ACCEPTED]")
replace_once(
    matrix,
    "WP-2.6A is ACCEPTED; WP-2.6B is READY/NEXT after dependency, specification and sizing revalidation. WP-2.6C remains PLANNED and WP-2.7 must not start concurrently.",
    "WP-2.6A and WP-2.6B are ACCEPTED; after the exact WP-2.6B acceptance-governance HEAD is verified, WP-2.6C is the next packet to activate/revalidate. WP-2.7 must not start concurrently.",
)

# Guard the intended acceptance semantics before commit.
for path in (wp, status, matrix):
    text = path.read_text()
    if "WP-2.6B" not in text:
        raise SystemExit(f"{path}: WP-2.6B marker unexpectedly missing")
if "- State: `ACCEPTED`" not in wp.read_text() or "- Current pass: `COMPLETE`" not in wp.read_text():
    raise SystemExit("WP-2.6B acceptance state/pass not applied")
if "Required WP-2.6B responsibilities minus accepted/evidenced WP-2.6B responsibilities: **∅**." not in matrix.read_text():
    raise SystemExit("coverage matrix gap closure not applied")
