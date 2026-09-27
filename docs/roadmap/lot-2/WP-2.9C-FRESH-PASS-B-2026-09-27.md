# WP-2.9C — fresh full Pass B after ADR 0013 provider evidence

Date: 2026-09-27

Review target: evidence-bound head `bd5ca22` / CI `36344835905` — **5/5
SUCCESS**, including full verification from clean checkout.
The review examines the seven assigned WP-2.9C responsibilities and historical
`WP29C-AR-001..007` against ADR 0009/0010/0012/0013, the current packet,
file-security, secret, CI and release contracts. Earlier Pass A and targeted
reviews are evidence to challenge, not accepted conclusions for this pass.

## Verdict

**REVIEW_FAILED — one new MAJOR finding, `WP29C-AR-008`.** No Pass C or
WP-2.9A resumption is permitted. The finding is a release-contract defect,
not a reason to rerun the successful exact-size provider campaign.

## WP29C-AR-008 — MAJOR — production release contracts retain superseded Pages ingress

ADR 0013 accepted Workers Static Assets as the current and required future
browser ingress for `/api/private-document-promote`, with Worker-first `/api/*`,
persisted Workers Logs and an external binding to the private lifecycle Durable
Object. The deployed provider proof validates this exact topology. However:

- `CI-CD.md` still directs candidate and production deployment to Pages
  Functions, states the Pages binding is the required production route, and
  warns to ship `functions/api/private-document-promote.ts` as the runtime
  artifact;
- `RELEASE-PROCESS.md` explicitly describes a Pages Function release gate,
  Pages deployment/smoke, rollback and monitoring;
- `SECRET-MANAGEMENT.md` locates rotation/smoke behind a Pages caller, even
  though the secret correctly remains only on the private DO host;
- `FREE-TIER.md` still describes Pages Functions as the final CPU envelope;
- the AR-007 regression test asserts ADR 0012 presence but not the ADR 0013
  production routing consequence.

A future release following those normative instructions could deploy static
Pages plus an obsolete Pages function while omitting the Worker ingress whose
CPU/log identity was accepted. The ordinary CI is green because it does not
check this architecture drift. This reopens AR-007 for the superseding ADR 0013
topology. It conflicts with ADR 0013's explicit production-deployment gate and
the packet's operational/deployment responsibility.

Required remediation: add a RED regression control for the final ingress;
reconcile CI/CD, release, secret and Free-tier contracts (and release-plan
metadata) to Workers Static Assets plus the private DO host; preserve the
generic Pages rules only for independently approved Pages routes; require
Worker-first `/api/*`, exact candidate/deployment identities, private-host-only
secret, deny/static smoke, absence of the legacy Supabase route and fail-closed
rollback. Then run exact-head CI/clean checkout and a fresh review of the
remediation before retrying the complete Pass B.

## Other responsibilities and findings checked

1. C1 text parity remains implemented in the document domain and SQL tests.
2. Trusted actual-byte PDF proof still checks authoritative Storage MIME/size,
   `%PDF-`, exact reserved SHA-256 and bounded 25,000,000-byte reads before
   canonical attestation.
3. Staging remains private and provider-bounded. Source and DB backstop keep
   ordinary clients from canonical mutation or staging cleanup, and trusted
   abandon proves object absence before metadata deletion.
4. Live `documents.write`, exact reservation and project/document identity are
   checked at both ingress/executor trust boundaries and before privileged
   mutation; the per-document DO serial gate covers POST/DELETE interleaving.
5. ADR 0013 provider artifact `10940276677` provides ten exact-size successful
   synthetic flows and 10+10 per-invocation exact-version CPU measurements on
   Workers Free. Historical ADR 0011 CPU failure remains adverse only for the
   rejected stateless topology.
6. The deployed isolated Worker route and two-surface telemetry are evidenced;
   production release instructions are the MAJOR omission above.
7. The application service preserves the independent `pending -> ready`
   finalization and accepted WP-2.9A/2.8 Media boundaries; no new product UI,
   permission or private-data fixture is introduced here.

Historical `AR-001..004` remain implementation-remediated; `AR-005` cleanup and
race controls and `AR-006` deployed CPU feasibility are evidenced on the
current design. Their formal closure waits for a clean full Pass B. No separate
BLOCKING finding was identified in this pass.

State consequence: `REVIEW_PENDING -> REVIEW_FAILED -> IN_PROGRESS` as AR-008
RED-first remediation begins. The regression test failed in both ADR 0013
release-routing and secret/Free CPU contract cases against the old documents.
Affected verification must be rerun. This review does not authorize a new
provider campaign.
