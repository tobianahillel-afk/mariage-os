# WP-2.9C / AR-008 — targeted remediation review

Date: 2026-09-28

Target: `a94a7b9` / CI `36395904397` (**5/5 SUCCESS**, clean checkout included), after the ADR 0013 production-contract
correction at `a819947` / CI `36346460133` (5/5 SUCCESS including clean
checkout). This review is limited to AR-008; it is not the complete packet
Pass B.

## Verdict

**PASS for the AR-008 remediation scope.** Exact-head CI passed all five
ordinary jobs, including clean checkout. No provider campaign is authorized
by this narrow review.

The release, CI, versioning, secret, Free-tier and release-plan contracts now
require the ADR 0013 Workers Static Assets ingress, private Durable Object host,
Worker-first `/api/*`, exact candidate/binding identity, host-only admin secret,
deny/static smoke and fail-closed rollback. The smoke rejects unknown API paths
as JSON 404 and requires static HTML 200. Targeted local tests pass 13/13.

The repository retains a historical Pages `onRequest` module, which the
Worker ingress imports for shared fail-closed logic. Presence in source does
not establish a production Pages deployment. The release contract explicitly
forbids serving this route from Pages on the production origin, and the ADR
0013 architecture test pins the Worker config and route. Production routing
must be checked at release time; no production deployment is claimed here.

Next: a complete fresh Pass B over all seven C responsibilities and all
findings. Only that review can decide whether C enters acceptance.
