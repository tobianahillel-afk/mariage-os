from pathlib import Path

path = Path("docs/roadmap/IMPLEMENTATION-STATUS.md")
text = path.read_text()


def replace_one(old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"expected exactly one match, found {count}: {old[:120]!r}"
        )
    text = text.replace(old, new, 1)


replace_one(
    "| WP-2.6B | Venue availability observations | **READY — PLAN** |",
    "| WP-2.6B | Venue availability observations | **IN_PROGRESS — B-ADVERSARIAL REVIEW** |",
)

replace_one(
    "- `WP-2.6B` — append-oriented Venue availability observations — **READY / PLAN**, estimated 9 points with evidence-history/replay cohesion rationale;",
    "- `WP-2.6B` — append-oriented Venue availability observations — **IN_PROGRESS / B-ADVERSARIAL REVIEW**, estimated 9 points with evidence-history/replay cohesion rationale;",
)

old_readiness = """### WP-2.6B readiness

- dependency gate: WP-2.6A final acceptance-governance `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**;
- deterministic availability read-model repair `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903` — **5/5 SUCCESS**;
- activation revalidation found no WP-2.6A shared-interface incompatibility and sizing remains 9 points;
- no unresolved material specification blocker remains;
- WP-2.6C and WP-2.7 remain blocked while B is current.
"""
new_readiness = """### WP-2.6B Pass A / Pass B transition

- dependency gate: WP-2.6A final acceptance-governance `186933ed0af8c45ddaa1b5c883bfd3f70086c6fe` / `34238484533` — **5/5 SUCCESS**;
- deterministic availability read-model repair `9f5c8af30c58c146d89b1464cad96cb8e43dbc7b` / `34239745903` — **5/5 SUCCESS**;
- READY/governance baseline `1ff69cd2e599a72a6cf703a658b836b2b3431619` / `34242853512` — **5/5 SUCCESS**;
- Pass-A implementation head/run `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / `34253821826` — **5/5 SUCCESS**, including clean-checkout `npm run verify`;
- Core on the exact Pass-A head: 105 unit files / 1019 tests PASS at **100% statements / branches / functions / lines**; static quality/security and build PASS;
- Local Supabase DB/RLS, Browser E2E + mutation, privacy-safe preview and Full verify all **SUCCESS** on the same head;
- Pass A decision: **COMPLETE / VERIFIED**; fresh Pass B adversarial review is now in progress from that exact implementation head;
- open WP-2.6B BLOCKING/MAJOR findings at Pass-B entry: **∅**;
- WP-2.6C and WP-2.7 remain blocked while B is current.
"""
replace_one(old_readiness, new_readiness)

old_cursor = """Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.6B
Packet State: READY
Current Pass: PLAN
Last completed packet: WP-2.6A — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A
Planned commercial subpacket after current: WP-2.6C
WP-2.6 base freeze head/run: cf46c731bd45b77feaa514b22036096301280755 / 34170253114 — 5/5 SUCCESS
WP-2.6 boundary freeze head/run: 6dce81a49ccdbb7bc9da54b2491a0c8746e12e50 / 34171320200 — 5/5 SUCCESS
WP-2.6A final acceptance-governance head/run: 186933ed0af8c45ddaa1b5c883bfd3f70086c6fe / 34238484533 — 5/5 SUCCESS
WP-2.6B deterministic availability spec head/run: 9f5c8af30c58c146d89b1464cad96cb8e43dbc7b / 34239745903 — 5/5 SUCCESS
Open WP-2.6B BLOCKING/MAJOR findings: ∅
Next permitted action: verify the exact WP-2.6B READY/governance HEAD, then transition WP-2.6B only to IN_PROGRESS / A-IMPLEMENT. Do not start WP-2.6C or WP-2.7 concurrently."""
new_cursor = """Current Lot: 2 — Venues core
Lot State: IN_PROGRESS
Branch: lot-2/venues-core
Current Packet: WP-2.6B
Packet State: IN_PROGRESS
Current Pass: B-ADVERSARIAL REVIEW
Last completed packet: WP-2.6A — ACCEPTED
Accepted packets: WP-2.1, WP-2.2, WP-2.3, WP-2.4, WP-2.5, WP-2.6A
Planned commercial subpacket after current: WP-2.6C
WP-2.6 base freeze head/run: cf46c731bd45b77feaa514b22036096301280755 / 34170253114 — 5/5 SUCCESS
WP-2.6 boundary freeze head/run: 6dce81a49ccdbb7bc9da54b2491a0c8746e12e50 / 34171320200 — 5/5 SUCCESS
WP-2.6A final acceptance-governance head/run: 186933ed0af8c45ddaa1b5c883bfd3f70086c6fe / 34238484533 — 5/5 SUCCESS
WP-2.6B deterministic availability spec head/run: 9f5c8af30c58c146d89b1464cad96cb8e43dbc7b / 34239745903 — 5/5 SUCCESS
WP-2.6B READY/governance head/run: 1ff69cd2e599a72a6cf703a658b836b2b3431619 / 34242853512 — 5/5 SUCCESS
WP-2.6B Pass-A head/run: 1c1dd4db875e5253fc9affdcf498991c4c6a5f64 / 34253821826 — 5/5 SUCCESS
Open WP-2.6B BLOCKING/MAJOR findings at Pass-B entry: ∅
Next permitted action: perform fresh WP-2.6B Pass B adversarial review only. Do not start WP-2.6C or WP-2.7 concurrently."""
replace_one(old_cursor, new_cursor)

repair_line = "- WP-2.6B deterministic availability selection/effective-expiry semantics: **CLOSED** by `9f5c8af...` / CI `34239745903` — **5/5 SUCCESS**."
replace_one(
    repair_line,
    repair_line
    + "\n- WP-2.6B Pass A implementation: **COMPLETE / VERIFIED** on `1c1dd4db...` / CI `34253821826` — **5/5 SUCCESS**, including 100% measured statements/branches/functions/lines and clean-checkout `npm run verify`.",
)

replace_one(
    "- Original WP-2.6 product responsibility remains execution-mapped to WP-2.6A/B/C; B/C are not claimed by A acceptance.",
    "- Original WP-2.6 product responsibility remains execution-mapped to WP-2.6A/B/C; WP-2.6B is implemented and under adversarial review, while WP-2.6C remains not started.",
)

old_handoff = """Last completed packet: WP-2.6A — ACCEPTED / COMPLETE
Current packet: WP-2.6B — READY / PLAN
Next commercial packet: WP-2.6C — PLANNED / PLAN
WP-2.6 specification gates: cf46c731... / 34170253114, 6dce81a4... / 34171320200 and 9f5c8af... / 34239745903 — all 5/5 SUCCESS
WP-2.6A acceptance governance: 186933ed... / 34238484533 — 5/5 SUCCESS
Next permitted action: verify the exact WP-2.6B READY/governance HEAD, then transition WP-2.6B only to IN_PROGRESS / A-IMPLEMENT. WP-2.6C and WP-2.7 remain prohibited concurrently."""
new_handoff = """Last completed packet: WP-2.6A — ACCEPTED / COMPLETE
Current packet: WP-2.6B — IN_PROGRESS / B-ADVERSARIAL REVIEW
Next commercial packet: WP-2.6C — PLANNED / PLAN
WP-2.6 specification gates: cf46c731... / 34170253114, 6dce81a4... / 34171320200 and 9f5c8af... / 34239745903 — all 5/5 SUCCESS
WP-2.6A acceptance governance: 186933ed... / 34238484533 — 5/5 SUCCESS
WP-2.6B Pass A: 1c1dd4db... / 34253821826 — 5/5 SUCCESS
Next permitted action: perform fresh WP-2.6B Pass B adversarial review only. WP-2.6C and WP-2.7 remain prohibited concurrently."""
replace_one(old_handoff, new_handoff)

path.write_text(text)
