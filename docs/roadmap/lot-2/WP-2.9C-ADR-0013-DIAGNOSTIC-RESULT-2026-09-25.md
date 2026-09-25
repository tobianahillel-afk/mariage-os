# WP-2.9C ADR 0013 — failed-window diagnostic result

Status: **DIAGNOSTIC COMPLETE / VERSION-MISMATCH REMEDIATION IN PROGRESS / AR-006 OPEN**

The one authorized no-content trigger `561aa6efa4e5f3d3e1ee5bfe5962bd84cf50060a`
ran CI `36167031612`. All five ordinary jobs passed, including full verification
from a clean checkout. The read-only diagnostic job `108179616464` succeeded.
Its sanitized artifact `10879110764` has ZIP SHA-256
`397734aeaf183c01463a8077ea0b19bae8eab9f87619eb3cd6a1e21a55218556`.

The requery was pinned to the historical failed UUID/window and exact script
names. Both provider queries returned HTTP 200, API success and complete pages:
six ingress events and two Durable Object events. Both expected markers were
present. One of the two invocations was fully attributable. The only rejection
was `script_version_mismatch` on `worker-ingress`:

| Field | Observed | Required for the failed campaign |
|---|---:|---:|
| ingress version | `11eb9e2f-9056-48ad-93ee-2ed0095d699a` | `8c48646c-c9a3-410b-98c4-b42a98e75244` |
| ingress CPU | `3 ms` | `<= 10 ms` |
| ingress outcome/model/event/status | `ok` / `stateless` / `fetch` / `409` | same |
| Durable Object attribution | valid | valid |

The Cloudflare deployment inventory read on 2026-09-25 showed the failed
campaign's ingress deployment `3d630376-22f6-4b5f-ae98-85d5c9a4622e`
configured at 100% on version `8c48646c...`; the previous deployment
`c4346f61-ad43-4a58-8b90-91e2a25bc5f7` was configured at 100% on
`11eb9e2f...`. Thus the tested request reached the previous version despite
the newer deployment record. This is **consistent with deployment propagation**;
the provider evidence does not establish the internal routing cause. Cloudflare
documents that a newly changed deployment may take a couple of seconds to be
available globally and that Observability can reveal the actually invoked
version. See [versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/)
and [version overrides](https://developers.cloudflare.com/workers/versions-and-deployments/version-overrides/).

The diagnostic performed no deployment, Supabase authentication, new marker,
PDF construction or document mutation. It is **not** a 25 MB CPU result.
`ADR13-EV-001` is now classified, but AR-006 remains OPEN and WP-2.9C is not
accepted.

## Bounded repository remediation

The evidence harness had queried one historical marker repeatedly. Once that
marker was proven to have run on the old ingress version, more queries of the
same marker could not establish readiness of the new version. The permitted
repository correction is to issue a fresh random-unreserved, non-document
marker only when a complete two-surface observation has exactly one failure:
the ingress script-version mismatch. The Durable Object must already be fully
attributed; CPU, outcome, model, event, status, identity and truncation checks
must all pass. Bound the number of such marker rounds, retain sanitized skew
history, and stop before exact-size setup if exact-version readiness is never
proved. Missing persisted logs may be re-read within the existing bounded
query window; other complete failures must stop immediately.

Next: finish the RED-first repository correction, run targeted/full local tests,
exact-head CI and clean checkout, then perform a fresh adversarial review of
the retry boundary and retained receipt. **No new provider preflight or
exact-size campaign is authorized by this diagnostic result.** A separate
reviewed authorization is required for any such run.
