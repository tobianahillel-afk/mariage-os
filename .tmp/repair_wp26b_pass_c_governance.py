from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one replacement target, found {count}: {old!r}")
    path.write_text(text.replace(old, new, 1))


wp = Path("docs/roadmap/lot-2/WP-2.6B.md")
status = Path("docs/roadmap/IMPLEMENTATION-STATUS.md")
matrix = Path("docs/roadmap/lot-2/LOT-2-COVERAGE-MATRIX.md")
ledger = Path("docs/FEATURE-LEDGER.md")

# Canonical Pass-C state/pass alignment.
replace_once(wp, "- State: `IN_PROGRESS`", "- State: `ACCEPTANCE_PENDING`")
replace_once(wp, "- Current state: `IN_PROGRESS`", "- Current state: `ACCEPTANCE_PENDING`")
replace_once(
    wp,
    "- applicable `SEC-VAL-*`, `SEC-VER-*`, `SEC-DATA-*` controls;",
    "- applicable `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..005`, `SEC-AUTHZ-007..009`, `SEC-VAL-001..006`, `SEC-VAL-008`, `SEC-INJ-001`, `SEC-INJ-002`, `SEC-ABUSE-004`, `SEC-VER-001`, `SEC-VER-005` controls;",
)
replace_once(
    wp,
    "**IN PROGRESS.** This governance transition activates `C-ACCEPTANCE`. Acceptance reconciliation must use the exact governance HEAD only after its own CI is **5/5 SUCCESS**; WP-2.6B is not ACCEPTED yet.",
    "**ACCEPTANCE_PENDING / C-ACCEPTANCE.** The prior Pass-C entry head `cd3d62121687baca1f8deb34915b58baf115427d` / CI `34264925852` is **5/5 SUCCESS**. This repair restores the canonical state/pass pair required by the Work Packet state machine; WP-2.6B remains not ACCEPTED until mechanical Pass C reconciliation and acceptance governance are green.",
)
replace_once(
    wp,
    "- Next permitted action: verify the exact Pass-C governance HEAD, then perform WP-2.6B acceptance/reconciliation. Do not start WP-2.6C or WP-2.7 concurrently.",
    "- Next permitted action: verify the exact corrected Pass-C governance HEAD, then perform WP-2.6B acceptance/reconciliation. Do not start WP-2.6C or WP-2.7 concurrently.",
)

# Living status board must use the same canonical state/pass pair.
replace_once(
    status,
    "| WP-2.6B | Venue availability observations | **IN_PROGRESS — C-ACCEPTANCE** |",
    "| WP-2.6B | Venue availability observations | **ACCEPTANCE_PENDING — C-ACCEPTANCE** |",
)
replace_once(
    status,
    "- `WP-2.6B` — append-oriented Venue availability observations — **IN_PROGRESS / C-ACCEPTANCE**, estimated 9 points with evidence-history/replay cohesion rationale;",
    "- `WP-2.6B` — append-oriented Venue availability observations — **ACCEPTANCE_PENDING / C-ACCEPTANCE**, estimated 9 points with evidence-history/replay cohesion rationale;",
)
replace_once(status, "Packet State: IN_PROGRESS", "Packet State: ACCEPTANCE_PENDING")
replace_once(
    status,
    "Current packet: WP-2.6B — IN_PROGRESS / C-ACCEPTANCE",
    "Current packet: WP-2.6B — ACCEPTANCE_PENDING / C-ACCEPTANCE",
)
replace_once(
    status,
    "- Pass B decision: **PASS**; WP-2.6B transitions to `C-ACCEPTANCE` but is not ACCEPTED until Pass C reconciliation and acceptance governance are green;",
    "- Pass B decision: **PASS**; WP-2.6B transitions to `ACCEPTANCE_PENDING / C-ACCEPTANCE` but is not ACCEPTED until Pass C reconciliation and acceptance governance are green;",
)
replace_once(
    status,
    "Next permitted action: verify the exact C-ACCEPTANCE governance HEAD, then perform WP-2.6B Pass C reconciliation. Do not start WP-2.6C or WP-2.7 concurrently.",
    "Next permitted action: verify the exact corrected C-ACCEPTANCE governance HEAD, then perform WP-2.6B Pass C reconciliation. Do not start WP-2.6C or WP-2.7 concurrently.",
)
replace_once(
    status,
    "Next permitted action: verify the exact C-ACCEPTANCE governance HEAD, then reconcile WP-2.6B Pass C. WP-2.6C and WP-2.7 remain prohibited concurrently.",
    "Next permitted action: verify the exact corrected C-ACCEPTANCE governance HEAD, then reconcile WP-2.6B Pass C. WP-2.6C and WP-2.7 remain prohibited concurrently.",
)

# Coverage matrix and Feature Ledger must no longer advertise pre-implementation state.
replace_once(
    matrix,
    "Status: **IN_PROGRESS — WP-2.1..WP-2.6A ACCEPTED; WP-2.6B READY / NEXT**",
    "Status: **IN_PROGRESS — WP-2.1..WP-2.6A ACCEPTED; WP-2.6B ACCEPTANCE_PENDING / C-ACCEPTANCE**",
)
replace_once(
    matrix,
    "Accepted/evidenced packet responsibilities so far: **WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5 and WP-2.6A**. Required WP-2.6A responsibilities minus accepted/evidenced WP-2.6A responsibilities: **∅**. The original WP-2.6 responsibility remains fully assigned after orchestration decomposition: offers/components → WP-2.6A, availability → WP-2.6B, contacts/interactions → WP-2.6C; only the A-owned slice is accepted so far.",
    "Accepted/evidenced packet responsibilities so far: **WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5 and WP-2.6A**. Required WP-2.6A responsibilities minus accepted/evidenced WP-2.6A responsibilities: **∅**. WP-2.6B Pass A and Pass B are complete with no open BLOCKING/MAJOR finding; its acceptance remains pending Pass C. The original WP-2.6 responsibility remains fully assigned after orchestration decomposition: offers/components → WP-2.6A, availability → WP-2.6B, contacts/interactions → WP-2.6C; only the A-owned slice is accepted so far.",
)
replace_once(
    ledger,
    "| FTR-025 | Venue offers/date pricing/availability context | 2/5 | VENUES, BUDGET | SPECIFIED |",
    "| FTR-025 | Venue offers/date pricing/availability context | 2/5 | VENUES, BUDGET | IN_PROGRESS |",
)
