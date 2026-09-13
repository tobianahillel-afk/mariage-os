# WP-2.8C — Pass C acceptance reconciliation

Status: **PASS — packet responsibility gap ∅**

This record is the mechanical `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation for `WP-2.8C — Recoverable Venue remote-media metadata lifecycle`.

## Gate evidence

- Activation specification freeze: `36ef31089dcbab50221b90a559480cc091d99fba` / CI `34618247634` — **5/5 SUCCESS**, clean-checkout included.
- READY governance: `5e6f3c02b97eaafa630d809debc9c09d94bfc40e` / CI `34620073715` — **5/5 SUCCESS**, clean-checkout included.
- Pass-A final implementation checkpoint: `e7510b64471a85b3894ba26345df7fe71533b1c3` / CI `34628542194` — **5/5 SUCCESS**, clean-checkout included.
- Pass-B AR-001 RED exposure: `ee1af0d2bf04503366db29b85dff9f810cb7fb6a` / CI `34630210996` — expected unit RED only, 2 failed / 1307 passed; static remained green.
- AR-001 remediation: `4db24a300282816e05e839e4b3ad132a89c5a167` / CI `34630386585` — **SUCCESS**.
- AR-002 adversarial evidence remediation / fresh reviewed head: `5e4246e6f63db899fb8a683d9381614a6ee75b11` / CI `34785068206` — **5/5 SUCCESS**, clean-checkout included.
- Fresh post-remediation Pass B: **PASS**; open BLOCKING = **∅**, open MAJOR = **∅**, MINOR carried into acceptance = **∅**.
- Pass-C entry governance: `fc2358a85cb367a7f3aa17cc9757a00c5888ed39` / CI `34785516861` — **5/5 SUCCESS**, including full `npm run verify` from clean checkout.

## Feature / requirement / packet-responsibility reconciliation

| Responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
|---|---|---|---|---|
| `FTR-024` Lot-2 recoverable remote-metadata slice | a retained Venue remote reference can leave ordinary active results without destroying its metadata/link identity, then return by restore | `media.deleted_at`; protected soft-delete/restore RPC; active-list filter; same media/link retained | lifecycle application/provider tests, lifecycle pgTAP, adversarial pgTAP, exact CI | PASS |
| `FTR-092` Lot-2 remote-metadata retention slice | recoverable metadata lifecycle is explicit and independent from B private binary lifecycle | C targets only accepted A-style remote rows; private B rows are typed conflicts; no Storage mutation path exists | lifecycle/private-target pgTAP, no-Storage adversarial assertion, A/B regression suites | PASS |
| `DELETION-RETENTION` media rule | soft-delete first, disappear from ordinary active views, remain recoverable | nullable `deleted_at`; active query and active parser both require null; restore clears marker on same row | active hide/restore pgTAP + provider fail-closed tests | PASS |
| `MED-007` applicable C behavior | remote image remains an external URL reference rather than becoming copied bytes | lifecycle preserves `remote_url` and `source_page_url`; no binary/archive conversion is introduced | mutation receipt/payload assertions; no Storage path evidence | PASS |
| `MED-008` regression invariant | source provenance survives lifecycle changes | lifecycle updates only deletion/audit/revision fields; source URL remains unchanged | pgTAP receipt/row assertions through delete/restore | PASS |
| `MED-010` applicable C behavior | lifecycle must not weaken private-media protection or use obscurity as authority | C rejects private rows, direct client mutation stays revoked, live `media.write` gates transition | private-row conflict test, direct UPDATE `42501`, viewer/outsider/project-B/revoked/downgrade denial evidence | PASS |
| `MED-013` applicable C behavior | C must not introduce remote-fetch/private-data leakage behavior | no server-side fetch/proxy/display path added; lifecycle stores/returns metadata only | code-path review + no Storage/server-fetch capability in C; accepted A URL validation remains regression-green | PASS |
| active read semantics | deleted metadata can never be surfaced as active merely because a provider returns an inconsistent row | Supabase active query adds `media.deleted_at IS NULL`; active parser independently requires `deleted_at === null` | AR-001 RED then remediation tests; CI `34630386585` and `34785068206` | PASS |
| retained identity and provenance | delete/restore preserves media UUID, Venue gallery-link UUID/target, remote/source URLs, category/caption and creation identity | RPC mutates only `deleted_at`, `updated_at`, `updated_by`, `revision`; link row is retained | lifecycle pgTAP and adversarial restore assertions | PASS |
| optimistic concurrency | real state change requires current revision and mutates revision/audit exactly once | stale real transition raises `40001`; successful transition increments revision once | lifecycle pgTAP + application conflict mapping tests | PASS |
| same-state retry replay | repeated delete/restore is successful no-op replay and may reconcile an older positive expected revision | same-state branch returns current row/link with `replayed=true` before revision-equality mutation path | lifecycle pgTAP snapshots prove no deleted_at/revision/audit change | PASS |
| authorization / non-disclosure | only live same-project `media.write` can mutate; foreign/missing identity remains generic | SECURITY DEFINER RPC, trusted search path, project writer helper before and after media lock, generic `42501` | viewer, outsider, project-B, revoked, downgraded and missing-ID pgTAP; direct grants assertions | PASS |
| fail-closed lifecycle receipt | wrong action/project/media/state/shape/revision/link/canonical values cannot cross provider boundary | dedicated lifecycle receipt parser + adapter mapping | parser matrix, adapter substituted-success tests, 100% unit coverage | PASS |
| direct mutation boundary | clients cannot bypass lifecycle semantics by setting `deleted_at` directly | table/column UPDATE grants absent; only protected RPC performs lifecycle update | adversarial pgTAP proves privilege absence and direct UPDATE SQLSTATE `42501` | PASS |
| scope containment | no trash UI, purge scheduler, offline lifecycle, generic trash service, physical remote-byte deletion or WP-2.11 rendering is pulled forward | no such routes/services/storage operations introduced | READY→accepted-delta review and architecture/static gates | PASS |

No standalone frozen `ACC-*` scenario exclusively owns this remote-reference soft-delete/restore behavior. WP-2.8C therefore uses the packet-specific acceptance evidence above and preserves the accepted A foundation toward `ACC-057`; it does **not** claim the later DOM/referrer/rendering responsibility.

## Security / authorization reconciliation

| Control set | Implemented / verified evidence | Result |
|---|---|---|
| `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020` as applicable | existing project membership and `media.write` permission model reused; project/media identity checked; direct mutation revoked; live role/membership changes honored | PASS |
| `SEC-AUTH-012`, `SEC-AUTH-013`, applicable `SEC-AUTHZ-001..009` | authenticated-only RPC; outsider/viewer/project-B/revoked/downgraded identities denied; missing/foreign identity non-disclosing | PASS |
| `SEC-VAL-001..004`, `SEC-VAL-008` | UUID/action/revision validation; A-style remote shape checks; positive revision; canonical receipt and active-provider fail-closed parsing | PASS |
| `SEC-INJ-001`, `SEC-INJ-002` | fixed trusted `search_path = pg_catalog`, fully qualified objects, exact action allowlist, no dynamic SQL | PASS |
| `SEC-SRV-001` regression | C adds no arbitrary server-side URL retrieval/proxying | PASS |
| `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006` | direct allow/deny pgTAP, malformed-provider tests, full static/security/unit/DB/browser/mutation and clean-checkout verification, durable FIR evidence | PASS |

## Key adversarial invariants confirmed

- A provider response containing a non-null `deleted_at` cannot cross the ordinary active-media parser, even if query filtering were inconsistent.
- An authenticated outsider cannot mutate a project media lifecycle.
- An authorized writer querying an absent media UUID receives generic `42501` rather than an existence oracle.
- A project-B / foreign media identity remains non-disclosing.
- A viewer, revoked member or same-session editor downgraded to viewer cannot perform a later transition.
- Authenticated clients have neither table UPDATE nor `deleted_at` column UPDATE authority; direct bypass receives `42501` and leaves state/revision unchanged.
- A same-project B private archived row is not a legal C target and remains untouched.
- C contains no `storage.*` access path and does not delete/copy/fetch third-party bytes.
- Soft-delete removes the row from the active predicate while retaining the media/link; restore returns the identical media/link identity.
- Same-state replay is no-op; a stale revision cannot authorize an opposite state change.
- Remote URL, source-page provenance, category/caption and creation identity survive both lifecycle transitions.

## Mechanical result

```text
required WP-2.8C responsibilities
- implemented WP-2.8C responsibilities
- verified WP-2.8C responsibilities
= ∅

open BLOCKING findings = ∅
open MAJOR findings = ∅
open MINOR findings carried into acceptance = ∅
```

`WP-2.8C` therefore satisfies Pass C and is eligible for packet `ACCEPTED / COMPLETE` status, subject to the final acceptance-governance HEAD itself passing the complete exact-head CI pipeline.

This acceptance does **not** accept whole `FTR-024` or `FTR-092`: gallery/detail rendering remains WP-2.11, Venue offline/visit behavior remains WP-2.12, and later Lots 10/11 retain their assigned lifecycle/offline/document responsibilities. It also does not introduce the deferred 30-day physical purge/trash UI.
