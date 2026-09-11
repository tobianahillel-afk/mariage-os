# WP-2.8B — Pass C acceptance reconciliation

Status: **PASS — packet responsibility gap ∅**

This record is the mechanical `EXPECTED ↔ IMPLEMENTED ↔ VERIFIED` reconciliation for `WP-2.8B — Private Venue image archive lifecycle`.

## Gate evidence

- Activation freeze: `dd2b03c736210f5145ece58ef8b4f55918c43b00` / CI `34421686462` — **5/5 SUCCESS**.
- READY governance: `3e6fe6683cccb21ffa0ef96b87911280ab07737f` / CI `34423597208` — **5/5 SUCCESS**.
- Pass-A implementation checkpoint: `150c10c07452748e3092e316a3cb9a26f272ff3e` / CI `34555183344` — **5/5 SUCCESS**, clean-checkout included.
- First fresh Pass-B review: `a23e6925f4d95e5d49cdea5b4e62b899cdd7a605` / CI `34555832894` — **5/5 SUCCESS**.
- Pass-C MED-006 diagnostic: `4eddca8aa94a2ed95d37bac47b8f3efeb3b4faf4` / CI `34556856411` — expected RED proving the duplicate-original receipt gap.
- MED-006 remediation: `f815844d9f4a2c62575ee91530af94febf78dab0` / CI `34605466532` — **5/5 SUCCESS**, clean-checkout included.
- Fresh affected Pass-B review after remediation: **PASS**, unresolved BLOCKING/MAJOR = **∅**, no MINOR carried into acceptance.
- Pass-C entry governance: `70c251fee7a54bf1f5de9e3fca4dee6ce067d778` / CI `34614442341` — **5/5 SUCCESS**, including `npm run verify` from clean checkout.

## Feature / requirement / acceptance reconciliation

| Responsibility | EXPECTED | IMPLEMENTED | VERIFIED | Result |
|---|---|---|---|---|
| `FTR-024` Lot-2 private-archive slice | private Venue image archive coexists with accepted remote references without pulling gallery UI/offline/soft-delete forward | private original/derivative metadata + private Storage lifecycle under existing Documents/Media boundary; A remote provider filters private/pending rows | domain/application/provider tests; DB lifecycle/adversarial tests; mixed-mode compatibility evidence; exact CI | PASS |
| `FTR-092` Lot-2 slice | original/derivative/orphan lifecycle, immutable ready media, recovery and detect-only hash identity | `pending → ready` / clean abandon lifecycle, versioned derivatives, exact Storage reservation/finalization, typed recovery | `venue_private_media_lifecycle_test.sql`, `venue_private_media_acceptance_test.sql`, adversarial/RLS tests, clean verify | PASS |
| `VEN-013` | private/archive media is distinguishable from remote references | mutually exclusive `remote_url` vs `storage_path` storage modes and private lifecycle metadata | migration constraints + lifecycle/provider regression tests | PASS |
| `MED-004` | archived original photo bytes preserved | ready original path/hash immutable; ready direct Storage update/delete denied | `ACC-056` acceptance evidence + Storage RLS tests | PASS |
| `MED-005` | thumbnails/previews are distinct derivatives | separate derivative rows/objects with parent, kind and version; regeneration appends | `ACC-056` v1/v2 acceptance assertions and derivative adversarial tests | PASS |
| `MED-006` | exact duplicate binaries detectable by hash | `finalize_original` returns deterministic same-project ready-original `duplicateOriginalMediaIds`; detect-only, no merge/delete/reuse; replay snapshot durable | `venue_private_media_dedup_receipt_red_test.sql`, wrapper security test, adapter tests; remediation CI + Pass-B review | PASS |
| `MED-009` | incomplete/orphan upload recoverable/cleanable and never committed | pending reservation is recovery journal; retry finalize or exact-path delete + abandon; pending excluded from ordinary reads | `ACC-055` before-upload and post-Storage interruption tests; Storage RLS cleanup tests | PASS |
| `MED-010` | private files do not rely on obscurity | `project-private`, live permission/RLS, exact reservation binding, opaque object paths, no public URL/path authority | Storage RLS allow/deny tests + `ACC-058` + adversarial review | PASS |
| `ACC-055` | interrupted upload never appears Ready; retry/cleanup exists | pending visibility + recovery/abandon lifecycle | `venue_private_media_acceptance_test.sql` covers interruption before upload and after Storage success, viewer invisibility and recovery | PASS |
| `ACC-056` | original remains immutable when derivative regenerated | v1/v2 derivative rows/objects append while original path/hash stays unchanged | dedicated acceptance assertions retain original, v1 and v2 on distinct paths | PASS |
| `ACC-058` | private filename not observable in Storage object path | canonical `<project>/media/<media_uuid>/<variant>` path; filename remains private metadata | dedicated acceptance assertions compare filename metadata and opaque path | PASS |

## Security / authorization reconciliation

All controls listed by `WP-2.8B.md` were reviewed as applicable to this packet. They reconcile as follows.

| Control set | Implemented / verified evidence | Result |
|---|---|---|
| `AUTHZ-001`, `AUTHZ-002`, `AUTHZ-005`, `AUTHZ-006`, `AUTHZ-007`, `AUTHZ-008`, `AUTHZ-012`, `AUTHZ-018`, `AUTHZ-019`, `AUTHZ-020` | existing project membership/permission model reused; protected lifecycle command; same-project relationship validation; direct table writes revoked; live role downgrade/revocation and project-B/known-UUID deny evidence in pgTAP | PASS |
| `SEC-AUTH-012`, `SEC-AUTH-013`, `SEC-AUTHZ-001..009` | authenticated identity required; project row locked/validated; live `media.write` / `media.read`; outsider/project-B/revoked/viewer/anon deny cases; foreign identity remains non-disclosing | PASS |
| `SEC-VAL-001..004`, `SEC-VAL-008` | runtime/domain validation at file and provider boundaries; exact UUID/path/receipt/state checks; malformed/substituted receipts fail closed | PASS |
| `SEC-INJ-001`, `SEC-INJ-002` | RPC uses fixed trusted `search_path`, qualified objects and allowlisted action/state values; no dynamic SQL added | PASS |
| `SEC-FILE-001`, `SEC-FILE-002`, `SEC-FILE-003`, `SEC-FILE-004`, `SEC-FILE-008`, `SEC-FILE-009` | JPEG/PNG/WebP allowlist; MIME/signature agreement; 20,000,000-byte and decoded-dimension/pixel bounds; private Storage reservation binding; cross-project cleanup denied | PASS |
| `SEC-ABUSE-004` | explicit byte/dimension/pixel ceilings bound image resource consumption before reservation | PASS |
| `SEC-VER-001`, `SEC-VER-002`, `SEC-VER-005`, `SEC-VER-006` | direct allow+deny DB/Storage tests, adversarial SQL/file/auth tests, clean CI/security/secret/dependency/static checks and durable packet evidence | PASS |
| `SEC-SRV-001` | packet introduces no arbitrary server-side URL fetch/proxy path | PASS |

## Key adversarial invariants confirmed

- A valid-looking Storage path without an exact pending DB reservation is denied.
- A read-only viewer cannot read pending metadata/object; a ready object becomes readable only through live permission.
- Ready private originals/derivatives cannot be Storage-renamed, overwritten or directly deleted in WP-2.8B.
- Pending cleanup is constrained to the exact same-project reserved object.
- A pending or derivative media row cannot masquerade as an eligible duplicate original.
- Same SHA in another project is not disclosed.
- Duplicate detection is not authorization and never triggers automatic merge, object deletion or link/UUID reuse.
- Same-project lifecycle calls serialize through the project-row writer lock before duplicate receipt derivation.
- `finalize_original` replay returns the original stored duplicate snapshot rather than recomputing against later state.
- The public RPC wrapper keeps fixed trusted search-path semantics; its renamed internal core is not client-executable.
- Accepted WP-2.8A remote-reference semantics remain compatible with the widened media model.

## Mechanical result

```text
required WP-2.8B responsibilities
- implemented responsibilities
- verified responsibilities
= ∅

open BLOCKING findings = ∅
open MAJOR findings = ∅
open MINOR findings carried into acceptance = ∅
```

`WP-2.8B` therefore satisfies Pass C and is eligible for packet `ACCEPTED / COMPLETE` status, subject to the final acceptance-governance HEAD itself passing the complete exact-head CI pipeline.

This acceptance does **not** accept whole `FTR-024` or `FTR-092`: WP-2.8C metadata deletion/restore, WP-2.11 presentation, WP-2.12/offline work and later Lots 10/11 responsibilities remain downstream.
