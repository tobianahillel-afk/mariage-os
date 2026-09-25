# WP-2.9C ADR 0013 — Structured ingress/DO provider preflight review

Status: **PASS — ONE EXACT-SIZE CAMPAIGN AUTHORIZED AFTER RESULT-SEAL CI**

Review date: 2026-09-25  
Trigger commit: `a83d76ec5b824096cfe1435e20613b813a6892c7`  
Workflow: `36154744823`  
Provider job: `108139347246` — **SUCCESS**  
Artifact: `10873203218`  
Artifact digest: `sha256:81b74ac40f270be773fc8f2f83cfd970f6783decb63e684bbe6513c1cf2167ed`

## Preconditions

The parent review/status seal `b8e076399fc6e35a31c9a4c7aa3397c90fa17656` passed all five ordinary repository jobs, including clean-checkout verification. The preflight trigger used the exact same repository tree. The exact-size provider evidence job was skipped.

## Deployment review

- private lifecycle host deployed successfully;
- private host version: `794000b1-9b1b-43ad-a12c-01bbd47875eb`;
- `PrivateDocumentLifecycle` export verified as SQLite Durable Object;
- private host admin-secret presence verified by metadata only;
- Static Assets ingress deployed successfully;
- ingress deployment: `c4346f61-ad43-4a58-8b90-91e2a25bc5f7`;
- ingress version: `11eb9e2f-9056-48ad-93ee-2ed0095d699a`;
- exact external `PRIVATE_DOCUMENT_LIFECYCLE` binding verified;
- `PRIVATE_DOCUMENT_ADMIN_KEY` verified absent from ingress;
- deny-oriented production smoke passed.

## Application-mutation review

The only authenticated lifecycle call used a fresh random unreserved document UUID. Route readiness passed on attempt 1 with generic HTTP 409. No reservation, Storage upload, promotion, finalization or exact-size PDF occurred.

The retained preflight record explicitly states `documentMutation:false` and `exactSizeMutation:false`.

## Observability review

Attempts 1 and 2 returned successful, complete provider pages with zero matching events. They did not pass. Attempt 3 returned:

- ingress query HTTP 200 / API success / complete page / event count 6;
- DO query HTTP 200 / API success / complete page / event count 2;
- expected marker count 2;
- attributed invocation count 2;
- failures `[]`;
- `pass:true`.

The result therefore demonstrates persisted structured marker availability and strict provider attribution on both exact deployed script versions after bounded persistence delay. There is no missing/duplicate/malformed marker or attribution ambiguity in the accepted attempt.

## Findings

No BLOCKING/MAJOR finding is present in the preflight result. The earlier empty pages are not treated as evidence success; acceptance occurred only when the strict exact-version discovery passed.

The artifact is sanitized and contains no bearer token, password, admin credential, PDF bytes, raw provider event payload or real wedding data.

## Authorization

This review does not close AR-006. It proves only that ADR 0013's final provider evidence channel is deployable, unprivileged at ingress, persisted and attributable.

Exactly one `[AR006-INGRESS-EVIDENCE]` ten-flow exact-`25,000,000`-byte campaign is authorized **only after the commit containing this review/status/runbook reconciliation passes ordinary exact-head CI and `Full verify from clean checkout`**.

The campaign must run the existing reviewed marker/route preflight before document mutation, use the exact captured script versions for attribution, require ten distinct DO identities and retain only sanitized evidence. If it fails, do not auto-repeat. Return to review with AR-006 OPEN.

No Workers Paid entitlement, wall-time substitute, dashboard aggregate or lower file limit is authorized.
