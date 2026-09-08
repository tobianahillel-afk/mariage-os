from pathlib import Path
import re


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one replacement target, found {count}")
    path.write_text(text.replace(old, new, 1))


wp = Path("docs/roadmap/lot-2/WP-2.6B.md")
status = Path("docs/roadmap/IMPLEMENTATION-STATUS.md")

replace_once(
    wp,
    "- Current pass: `B-ADVERSARIAL REVIEW`",
    "- Current pass: `C-ACCEPTANCE`",
)

wp_text = wp.read_text()
wp_pattern = re.compile(
    r"## Pass B — ADVERSARIAL REVIEW\n\n.*?\n## Pass C — ACCEPTANCE / RECONCILIATION\n\nNot started\.",
    re.S,
)
wp_replacement = """## Pass B — ADVERSARIAL REVIEW

**COMPLETE / PASS.** Fresh independent review was executed against the Pass-A implementation and every remediation candidate. Green CI was not treated as sufficient evidence: five MAJOR mismatches were reproduced red-first, remediated, and re-reviewed.

- `WP2.6B-B-001` — provider `timestamptz` parsing required textual `.000Z` identity instead of accepting/canonicalizing the frozen strict instant grammar: **RESOLVED / VERIFIED**.
- `WP2.6B-B-002` — referenced candidate wedding dates could move after append and leave immutable availability history inconsistent: **RESOLVED / VERIFIED** with durable relational protection.
- `WP2.6B-B-003` — a foreign-project UUID collision could surface a typed replay conflict and violate cross-project non-disclosure: **RESOLVED / VERIFIED**.
- `WP2.6B-B-004` — append authorization was not serialized with the accepted project membership downgrade/revocation boundary: **RESOLVED / VERIFIED**.
- `WP2.6B-B-005` — PostgreSQL preserves microsecond `observed_at` precision while TypeScript canonicalizes instants to milliseconds; re-sorting parsed rows could therefore select an older observation by UUID when two observations fell inside the same millisecond: **RESOLVED / VERIFIED**. Red-first `f9150897084d9485e97bffe0b1d9b45dac9287a5` / `34262386054` failed exactly the adversarial ordering test. The adapter now requests the frozen full order `observed_at DESC`, `created_at DESC`, `id ASC` from Supabase and preserves that validated order; the service consumes the first same-date record rather than re-sorting timestamps after precision loss.
- Explicit Source-history evidence now proves that a linked Source may become `broken` and lose its URL without destroying the immutable availability observation, while physical Source deletion remains restricted while cited.
- Final fresh reviewed remediation head/run: `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532` — **5/5 SUCCESS**, including clean-checkout `npm run verify`.
- Core quality/security: **107 test files / 1022 tests PASS** at **100% statements / branches / functions / lines**; format, lint, architecture, dead-code, negative controls, dependency policy and build PASS.
- Local Supabase DB/RLS, Browser E2E + mutation, privacy-safe preview and Full verify from clean checkout all **SUCCESS** on the same exact head.
- Fresh post-remediation rereview found no additional BLOCKING/MAJOR mismatch; provider rows remain fail-closed for shape/identity/domain validity and the remediation introduced no migration, RPC or cross-packet authority.
- Open BLOCKING/MAJOR findings: **∅**.
- Pass B decision: **PASS**.

## Pass C — ACCEPTANCE / RECONCILIATION

**IN PROGRESS.** This governance transition activates `C-ACCEPTANCE`. Acceptance reconciliation must use the exact governance HEAD only after its own CI is **5/5 SUCCESS**; WP-2.6B is not ACCEPTED yet."""
wp_text, count = wp_pattern.subn(wp_replacement, wp_text, count=1)
if count != 1:
    raise SystemExit(f"{wp}: Pass B/C section replacement count={count}")
wp.write_text(wp_text)

replace_once(wp, "- Current/next pass: `B-REMEDIATION`", "- Current/next pass: `C-ACCEPTANCE`")
replace_once(
    wp,
    "- Open Pass-B findings: `WP2.6B-B-001`, `WP2.6B-B-002`, `WP2.6B-B-003`, `WP2.6B-B-004` — MAJOR — remediation pending exact-head verification",
    "- Pass-B findings `WP2.6B-B-001..005`: **RESOLVED / VERIFIED**\n- Final fresh Pass-B reviewed head/run: `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532` — **5/5 SUCCESS**\n- Open Pass-B BLOCKING/MAJOR findings: **∅**",
)
replace_once(
    wp,
    "- Next permitted action: verify the exact WP-2.6B remediation head, then perform a fresh Pass B adversarial rereview. Do not start WP-2.6C or WP-2.7 concurrently.",
    "- Next permitted action: verify the exact Pass-C governance HEAD, then perform WP-2.6B acceptance/reconciliation. Do not start WP-2.6C or WP-2.7 concurrently.",
)

replace_once(
    status,
    "| WP-2.6B | Venue availability observations | **REVIEW_FAILED — B-REMEDIATION** |",
    "| WP-2.6B | Venue availability observations | **IN_PROGRESS — C-ACCEPTANCE** |",
)
replace_once(
    status,
    "- `WP-2.6B` — append-oriented Venue availability observations — **REVIEW_FAILED / B-REMEDIATION**, estimated 9 points with evidence-history/replay cohesion rationale;",
    "- `WP-2.6B` — append-oriented Venue availability observations — **IN_PROGRESS / C-ACCEPTANCE**, estimated 9 points with evidence-history/replay cohesion rationale;",
)

status_text = status.read_text()
status_pattern = re.compile(
    r"### WP-2\.6B Pass A / Pass B transition\n\n.*?\n## Durable cursor",
    re.S,
)
status_replacement = """### WP-2.6B Pass A / Pass B transition

- dependency gate: WP-2.6A final acceptance-governance `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**;
- deterministic availability read-model repair `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903` — **5/5 SUCCESS**;
- READY/governance baseline `1ff69cd2e599a72a6cf703a658b836b2b3431619` / `34242853512` — **5/5 SUCCESS**;
- Pass-A implementation head/run `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**, including clean-checkout `npm run verify`;
- Pass-B findings `WP2.6B-B-001..005`: **RESOLVED / VERIFIED**; B-005 microsecond-order red-first proof `f9150897084d9485e97bffe0b1d9b45dac9287a5` / `34262386054` failed exactly the expected unit assertion;
- final fresh Pass-B reviewed remediation head/run `e92af194f774895b3b397d3be60350d09d42d8ff` / `34263468532`: **5/5 SUCCESS**, including clean-checkout `npm run verify`;
- Core on the exact final reviewed head: **107 unit files / 1022 tests PASS at 100% statements / branches / functions / lines**; static quality/security and build PASS;
- Local Supabase DB/RLS, Browser E2E + mutation, privacy-safe preview and Full verify all **SUCCESS** on the same head; explicit Source mutation/deletion history proof is green;
- fresh post-remediation rereview found no additional BLOCKING/MAJOR mismatch and no migration/RPC/scope expansion was introduced by B-005;
- open WP-2.6B BLOCKING/MAJOR findings: **∅**;
- Pass B decision: **PASS**; WP-2.6B transitions to `C-ACCEPTANCE` but is not ACCEPTED until Pass C reconciliation and acceptance governance are green;
- WP-2.6C and WP-2.7 remain blocked while B is current.

## Durable cursor"""
status_text, count = status_pattern.subn(status_replacement, status_text, count=1)
if count != 1:
    raise SystemExit(f"{status}: WP-2.6B transition section replacement count={count}")
status.write_text(status_text)

replace_once(status, "Packet State: REVIEW_FAILED", "Packet State: IN_PROGRESS")
replace_once(status, "Current Pass: B-REMEDIATION", "Current Pass: C-ACCEPTANCE")
replace_once(
    status,
    "Open WP-2.6B BLOCKING/MAJOR findings: WP2.6B-B-001, WP2.6B-B-002, WP2.6B-B-003, WP2.6B-B-004 — MAJOR",
    "WP-2.6B final Pass-B reviewed head/run: e92af194f774895b3b397d3be60350d09d42d8ff / 34263468532 — 5/5 SUCCESS\nOpen WP-2.6B BLOCKING/MAJOR findings: ∅",
)
replace_once(
    status,
    "Next permitted action: verify the exact WP-2.6B remediation head, then perform a fresh Pass B adversarial rereview. Do not start WP-2.6C or WP-2.7 concurrently.",
    "Next permitted action: verify the exact C-ACCEPTANCE governance HEAD, then perform WP-2.6B Pass C reconciliation. Do not start WP-2.6C or WP-2.7 concurrently.",
)
replace_once(
    status,
    "- WP-2.6B Pass A implementation: **COMPLETE / VERIFIED** on `1c1dd4db...` / CI `34253821826` — **5/5 SUCCESS**, including 100% measured statements/branches/functions/lines and clean-checkout `npm run verify`.",
    "- WP-2.6B Pass A implementation: **COMPLETE / VERIFIED** on `1c1dd4db...` / CI `34253821826` — **5/5 SUCCESS**, including 100% measured statements/branches/functions/lines and clean-checkout `npm run verify`.\n- WP-2.6B `WP2.6B-B-001..B-005`: **RESOLVED / VERIFIED**; final fresh Pass B reviewed head `e92af194...` / CI `34263468532` — **5/5 SUCCESS**; Pass B decision **PASS**, Pass C active.",
)
replace_once(
    status,
    "- Original WP-2.6 product responsibility remains execution-mapped to WP-2.6A/B/C; WP-2.6B is implemented and under adversarial review, while WP-2.6C remains not started.",
    "- Original WP-2.6 product responsibility remains execution-mapped to WP-2.6A/B/C; WP-2.6B passed adversarial review and is in acceptance/reconciliation, while WP-2.6C remains not started.",
)
replace_once(
    status,
    "Current packet: WP-2.6B — REVIEW_FAILED / B-REMEDIATION",
    "Current packet: WP-2.6B — IN_PROGRESS / C-ACCEPTANCE",
)
replace_once(
    status,
    "WP-2.6B Pass A: 1c1dd4db... / 34253821826 — 5/5 SUCCESS\nNext permitted action: verify the exact WP-2.6B remediation head, then perform a fresh Pass B adversarial rereview. WP-2.6C and WP-2.7 remain prohibited concurrently.",
    "WP-2.6B Pass A: 1c1dd4db... / 34253821826 — 5/5 SUCCESS\nWP-2.6B final Pass B: e92af194... / 34263468532 — 5/5 SUCCESS; open BLOCKING/MAJOR findings ∅\nNext permitted action: verify the exact C-ACCEPTANCE governance HEAD, then reconcile WP-2.6B Pass C. WP-2.6C and WP-2.7 remain prohibited concurrently.",
)
