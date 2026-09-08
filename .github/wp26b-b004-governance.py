from pathlib import Path


def replace_one(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one match, found {count}: {old[:140]!r}")
    target.write_text(text.replace(old, new, 1))


wp = "docs/roadmap/lot-2/WP-2.6B.md"
replace_one(
    wp,
    "Fresh independent review started from exact Pass-A head `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / run `34253821826`. Three MAJOR findings were reproduced red-first on test-only head `4d4ba74be7810bf28a8887a5e2a2d09b04bf18c6`, run `34257531367`:",
    "Fresh independent review started from exact Pass-A head `1c1dd4db875e5253fc9affdcf498991c4c6a5f64` / run `34253821826`. Three initial MAJOR findings were reproduced red-first on test-only head `4d4ba74be7810bf28a8887a5e2a2d09b04bf18c6`, run `34257531367`:",
)
replace_one(
    wp,
    "- `WP2.6B-B-003` — a foreign-project UUID collision surfaced `23505` and therefore a typed same-project `replay_conflict`. This violates the cross-project non-disclosure boundary / `AUTHZ-019`. DB red control: `23505` observed where the foreign identity must remain unavailable (`42501`).",
    "- `WP2.6B-B-003` — a foreign-project UUID collision surfaced `23505` and therefore a typed same-project `replay_conflict`. This violates the cross-project non-disclosure boundary / `AUTHZ-019`. DB red control: `23505` observed where the foreign identity must remain unavailable (`42501`).\n- `WP2.6B-B-004` — availability append authorization evaluated live `venues.write` without first taking the project serialization lock used by accepted membership-revocation/downgrade boundaries. Test-only red-first head `12ea6aca2341b9a9006a036df706dc8b8388af42`, run `34258715277`: DB/RLS failed exactly the 1/1 authorization-concurrency contract test, while the pre-existing availability adversarial and functional DB tests remained green.",
)
replace_one(
    wp,
    "- Open Pass-B findings: `WP2.6B-B-001`, `WP2.6B-B-002`, `WP2.6B-B-003` — MAJOR — remediation pending exact-head verification",
    "- Open Pass-B findings: `WP2.6B-B-001`, `WP2.6B-B-002`, `WP2.6B-B-003`, `WP2.6B-B-004` — MAJOR — remediation pending exact-head verification",
)

status = "docs/roadmap/IMPLEMENTATION-STATUS.md"
replace_one(
    status,
    "- Pass-B red-first head/run `4d4ba74be7810bf28a8887a5e2a2d09b04bf18c6` / `34257531367`: expected Core and DB failures reproduced `WP2.6B-B-001..003`;",
    "- Pass-B red-first head/run `4d4ba74be7810bf28a8887a5e2a2d09b04bf18c6` / `34257531367`: expected Core and DB failures reproduced `WP2.6B-B-001..003`;\n- authorization-serialization red-first head/run `12ea6aca2341b9a9006a036df706dc8b8388af42` / `34258715277`: expected DB failure reproduced `WP2.6B-B-004` while the existing availability DB suites remained green;",
)
replace_one(
    status,
    "- open WP-2.6B BLOCKING/MAJOR findings: `WP2.6B-B-001`, `WP2.6B-B-002`, `WP2.6B-B-003` — **MAJOR / remediation pending exact-head verification**;",
    "- open WP-2.6B BLOCKING/MAJOR findings: `WP2.6B-B-001`, `WP2.6B-B-002`, `WP2.6B-B-003`, `WP2.6B-B-004` — **MAJOR / remediation pending exact-head verification**;",
)
replace_one(
    status,
    "Open WP-2.6B BLOCKING/MAJOR findings: WP2.6B-B-001, WP2.6B-B-002, WP2.6B-B-003 — MAJOR",
    "Open WP-2.6B BLOCKING/MAJOR findings: WP2.6B-B-001, WP2.6B-B-002, WP2.6B-B-003, WP2.6B-B-004 — MAJOR",
)
