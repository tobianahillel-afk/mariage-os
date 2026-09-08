from pathlib import Path


def replace_one(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:120]!r}")
    target.write_text(text.replace(old, new, 1))


def replace_count(path: str, old: str, new: str, expected: int) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{path}: expected {expected} matches, found {count}: {old[:120]!r}")
    target.write_text(text.replace(old, new))


replace_one(
    "supabase/tests/venue_availability_test.sql",
    "  '23505',\n  'cross-project UUID collision is the same generic replay conflict'",
    "  '42501',\n  'cross-project UUID collision is unavailable and does not surface a same-project replay conflict'",
)

wp = "docs/roadmap/lot-2/WP-2.6B.md"
replace_one(
    wp,
    "- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-020`;",
    "- applicable `AUTHZ-001..008`, `AUTHZ-009`, `AUTHZ-012`, `AUTHZ-017`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020`;",
)
replace_one(
    wp,
    """## Pass B — ADVERSARIAL REVIEW\n\n**IN PROGRESS.**\n\nFresh independent review starts from exact Pass-A head `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / run `34253821826`. The review must challenge persistence/RLS, retry identity and cross-project non-disclosure, date-option/source integrity, timestamp parity, provider parsing, effective-expiry/latest ordering and negative-test completeness before any Pass-C transition.\n\nOpen BLOCKING/MAJOR findings at Pass-B entry: **∅**.\n""",
    """## Pass B — ADVERSARIAL REVIEW\n\n**REVIEW FAILED — REMEDIATION IN PROGRESS.**\n\nFresh independent review started from exact Pass-A head `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / run `34253821826`. Three MAJOR findings were reproduced red-first on test-only head `4d4ba74be7810bf28a8887a5e2a2d09b04bf18c6`, run `34257531367`:\n\n- `WP2.6B-B-001` — provider `timestamptz` parsing required textual `.000Z` identity instead of accepting and canonicalizing the frozen strict instant grammar. Core red control: 1/1020 unit tests failed exactly on strict PostgreSQL offset/microsecond provider representations.\n- `WP2.6B-B-002` — date-option/event-date equality was checked only when availability was appended. A referenced `candidate` wedding date could later move, leaving immutable history inconsistent. DB red control: update returned `00000` where durable integrity requires `23503`.\n- `WP2.6B-B-003` — a foreign-project UUID collision surfaced `23505` and therefore a typed same-project `replay_conflict`. This violates the cross-project non-disclosure boundary / `AUTHZ-019`. DB red control: `23505` observed where the foreign identity must remain unavailable (`42501`).\n\nRemediation is restricted to these findings. Pass B cannot pass until the remediation is green on an exact head and a fresh adversarial rereview finds no BLOCKING/MAJOR issue.\n""",
)
replace_one(
    wp,
    "- Current/next pass: `B-ADVERSARIAL REVIEW`",
    "- Current/next pass: `B-REMEDIATION`",
)
replace_one(
    wp,
    "- Remaining blocker/finding at Pass-B entry: none",
    "- Open Pass-B findings: `WP2.6B-B-001`, `WP2.6B-B-002`, `WP2.6B-B-003` — MAJOR — remediation pending exact-head verification",
)
replace_one(
    wp,
    "- Next permitted action: perform fresh WP-2.6B Pass B adversarial review only. Do not start WP-2.6C or WP-2.7 concurrently.",
    "- Next permitted action: verify the exact WP-2.6B remediation head, then perform a fresh Pass B adversarial rereview. Do not start WP-2.6C or WP-2.7 concurrently.",
)

status = "docs/roadmap/IMPLEMENTATION-STATUS.md"
replace_one(
    status,
    "| WP-2.6B | Venue availability observations | **IN_PROGRESS — B-ADVERSARIAL REVIEW** |",
    "| WP-2.6B | Venue availability observations | **REVIEW_FAILED — B-REMEDIATION** |",
)
replace_one(
    status,
    "- `WP-2.6B` — append-oriented Venue availability observations — **IN_PROGRESS / B-ADVERSARIAL REVIEW**, estimated 9 points with evidence-history/replay cohesion rationale;",
    "- `WP-2.6B` — append-oriented Venue availability observations — **REVIEW_FAILED / B-REMEDIATION**, estimated 9 points with evidence-history/replay cohesion rationale;",
)
replace_one(
    status,
    "- open WP-2.6B BLOCKING/MAJOR findings at Pass-B entry: **∅**;",
    "- Pass-B red-first head/run `4d4ba74be7810bf28a8887a5e2a2d09b04bf18c6` / `34257531367`: expected Core and DB failures reproduced `WP2.6B-B-001..003`;\n- open WP-2.6B BLOCKING/MAJOR findings: `WP2.6B-B-001`, `WP2.6B-B-002`, `WP2.6B-B-003` — **MAJOR / remediation pending exact-head verification**;",
)
replace_one(
    status,
    "Packet State: IN_PROGRESS\nCurrent Pass: B-ADVERSARIAL REVIEW",
    "Packet State: REVIEW_FAILED\nCurrent Pass: B-REMEDIATION",
)
replace_one(
    status,
    "Open WP-2.6B BLOCKING/MAJOR findings at Pass-B entry: ∅",
    "Open WP-2.6B BLOCKING/MAJOR findings: WP2.6B-B-001, WP2.6B-B-002, WP2.6B-B-003 — MAJOR",
)
replace_count(
    status,
    "Next permitted action: perform fresh WP-2.6B Pass B adversarial review only. Do not start WP-2.6C or WP-2.7 concurrently.",
    "Next permitted action: verify the exact WP-2.6B remediation head, then perform a fresh Pass B adversarial rereview. Do not start WP-2.6C or WP-2.7 concurrently.",
    1,
)
replace_one(
    status,
    "Current packet: WP-2.6B — IN_PROGRESS / B-ADVERSARIAL REVIEW",
    "Current packet: WP-2.6B — REVIEW_FAILED / B-REMEDIATION",
)
replace_one(
    status,
    "Next permitted action: perform fresh WP-2.6B Pass B adversarial review only. WP-2.6C and WP-2.7 remain prohibited concurrently.",
    "Next permitted action: verify the exact WP-2.6B remediation head, then perform a fresh Pass B adversarial rereview. WP-2.6C and WP-2.7 remain prohibited concurrently.",
)
