# Critical V1 Acceptance Scenarios

Status: **Normative behavioral acceptance-suite outline**

These Given/When/Then scenarios are end-to-end acceptance contracts. Implementation converts them to automated tests and/or documented manual evidence at the appropriate layer. They supplement, not replace, lower-level unit/property/database/RLS/security tests.

## Identity, project isolation and local safety

### ACC-001 — Controlled first-owner bootstrap
**Requirements:** IAM-011, OPS-008

Given production has no initialized project and bootstrap is explicitly open, when the intended authenticated owner performs bootstrap, then exactly one project and one active owner membership are created atomically and bootstrap closes according to policy.

### ACC-002 — Public outsider cannot create arbitrary production project
**Requirements:** IAM-011, OPS-008

Given the static website is publicly reachable and the couple project already exists, when an unrelated authenticated/anonymous user attempts project creation directly through backend APIs, then creation is denied and no free-tier resource-consuming project is created.

### ACC-003 — Secure partner invitation
**Requirements:** IAM-007, IAM-012

Given owner A creates an invitation for partner B, when B authenticates with the intended verified identity and submits the unexpired token, then one owner membership is created and invitation becomes accepted without storing the raw token server-side.

### ACC-004 — Invitation replay/wrong identity/expiry denied
**Requirements:** IAM-012

Given an invitation is accepted, expired, revoked or presented by a different verified identity, when acceptance is attempted, then no duplicate/unauthorized membership is created and safe typed outcome is returned.

### ACC-005 — Cross-project direct API access denied
**Requirements:** IAM-002, IAM-004, SEC-003

Given user C is not member of project A, when C requests/updates a known project-A UUID through direct API, then project data is not disclosed or mutated independent of frontend route hiding.

### ACC-006 — Cross-project relational injection denied
**Requirements:** SEC-011

Given owner A can write project A and knows a project-B venue UUID, when A tries inserting a child/link with project A `project_id` referencing project-B parent, then DB constraint/validation rejects it.

### ACC-007 — Member cannot impersonate partner rating/approval
**Requirements:** PRD-004, DEC-002

Given A and B are owners, when A submits a rating/preference/decision approval row using B's user ID, then backend denies the write.

### ACC-008 — Session expiry preserves pending work
**Requirements:** SYN-008, IAM-013

Given an edit is durably pending locally and cloud session expires, when the app reloads, then the edit remains available/pending and sync resumes only after successful reauthentication/membership validation.

### ACC-009 — Safe logout with pending work
**Requirements:** IAM-013

Given pending work exists, when owner requests logout, then app does not silently purge it; user must sync, safely export/recover or explicitly discard where allowed before private cache purge completes.

### ACC-010 — Project/account switch never flashes old cache
**Requirements:** SYN-011

Given cached project A data exists, when user/project context changes to project B, then A's visible context clears before B renders and B cannot read A cache through application state.

## Local-first, sync and PWA

### ACC-011 — Durable optimistic edit
**Requirements:** SYN-001, SYN-003

Given an offline-capable edit, when UI indicates locally saved/pending success, then operation already exists in durable local queue; process restart cannot erase it.

### ACC-012 — Duplicate retry is idempotent
**Requirements:** SYN-004

Given operation ID X was already accepted remotely, when X is retried after lost acknowledgement, then side effect occurs once and client receives/reconstructs prior result.

### ACC-013 — Independent concurrent edits merge
**Requirements:** SYN-006

Given both owners start at same revision, when A adds photo and B changes their own rating, then both changes survive without unnecessary conflict.

### ACC-014 — Same shared field conflict remains explicit
**Requirements:** SYN-005

Given both devices edit same shared due date from same base to different values, when reconnect occurs, then no silent last-write winner occurs; conflict remains until domain resolution.

### ACC-015 — Observation-preserving factual conflict
**Requirements:** FAC-002, FAC-006

Given two devices/imports record different credible room areas, when reconciled, then both observations/sources are preserved and fact becomes conflict/retained-value review rather than silently dropping one.

### ACC-016 — PWA update preserves pending mutations
**Requirements:** PWA-002, PWA-007

Given pending local mutations exist and new app/service worker is ready, when update/reload occurs, then queue/drafts survive compatible local migration and old incompatible code does not continue indefinitely.

### ACC-017 — Map/provider outage does not block venue records
**Requirements:** PWA-005

Given venue data is cached, when map tiles/routing provider fails, then venue list/detail/access text remains usable and map presents fallback state.

### ACC-018 — Offline financial mutation is not falsely confirmed
**Requirements:** FIN-007, SYN-002

Given device is offline, when owner records a payment, then UI labels it pending/projected; confirmed shared financial totals distinguish it until server validates mutation.

### ACC-019 — Offline approval cannot finalize joint decision
**Requirements:** DEC-002

Given B's approval is queued offline, when decision requires both owners, then app cannot represent decision finalized until current approvals/revision are atomically validated online.

### ACC-020 — Offline import can preview but not apply
**Requirements:** IMP-001, IMP-012

Given file can be parsed locally while offline, when preview completes, then canonical project is unchanged and Apply/Rollback requires connectivity/current canonical validation.

## Venue, criteria, evidence and access

### ACC-021 — Quick-add venue keeps unknown unknown
**Requirements:** VEN-012, FAC-001

Given only venue name is entered, when record is created, then missing criteria show Unknown/To verify, never default No/false.

### ACC-022 — Blocking criterion overrides score
**Requirements:** VEN-011, FAC-011

Given excellent weighted aesthetic/logistic ratings but `external_caterer_allowed=false` under blocking expected-true rule, when compatibility renders, then blocking status is FAIL regardless of weighted score.

### ACC-023 — Negative-desirability criterion uses evaluation rule
**Requirements:** FAC-011

Given `exclusive_caterer=true` with blocking expected-false rule, when evaluated, then it fails without inventing a `blocking-negative` priority state.

### ACC-024 — Fact value type rejects malformed canonical value
**Requirements:** FAC-012

Given a boolean fact definition, when client/import attempts object/string value incompatible with type, then canonical mutation is rejected/preview error before retained value is stored.

### ACC-025 — Multi-source observation is preserved
**Requirements:** FAC-002

Given one factual observation is supported by official page and written email, when stored, then both source links remain attached to one observation and same-project integrity holds.

### ACC-026 — Strong contractual evidence resists weaker import
**Requirements:** FAC-004, IMP-010

Given signed contract confirms external caterer allowed, when old unsourced CSV says false, then preview flags discrepancy and contract retained truth is not silently replaced.

### ACC-027 — Broken source does not delete evidence
**Requirements:** FAC-005

Given official source URL later becomes broken, when health changes, then historical observation remains and may become stale/revalidation-needed.

### ACC-028 — Changing criterion rule recomputes without rewriting facts
**Requirements:** FAC-011, FAC-013

Given project changes criterion priority/expected value, when saved, then compatibility recomputes from same fact observations and facts are not mutated.

### ACC-029 — Partner ratings remain independent
**Requirements:** VEN-017, PRD-004

Given A rates venue 9 and B rates 6, when either later edits their rating, then other member's rating remains unchanged and shared factual score is separate.

### ACC-030 — Origin switch preserves route history
**Requirements:** VEN-016

Given venue has Paris and home driving observations, when default origin changes, then summary changes to new origin while both observations/history remain.

### ACC-031 — Candidate dates coexist until atomic selection
**Requirements:** VEN-018

Given several candidate wedding dates, when one is selected, then exactly one becomes selected atomically and prior candidate/status/history is preserved.

### ACC-032 — Rejected venue remains searchable/history-visible
**Requirements:** PRD-007, VEN-006

Given venue is rejected with reason, when removed from active shortlist, then it remains queryable under rejected/history and can be restored without duplicate creation.

## Import/export identities and mapping

### ACC-033 — Repeat canonical import is idempotent
**Requirements:** IMP-003, IMP-006

Given canonical venue external ID already applied, when identical import repeats, then no duplicate semantic entities are created and preview reports no-op/unchanged as appropriate.

### ACC-034 — Nested external IDs are parent-scoped
**Requirements:** IMP-019

Given venue A and venue B each have child space external ID `main`, when both import under same namespace, then both spaces coexist under correct parents without collision/mis-match.

### ACC-035 — Missing import row never means delete
**Requirements:** IMP-002

Given 200 guests exist and import contains 180, when ordinary import is applied, then absent 20 remain unchanged unless separate explicitly destructive reconciliation flow is chosen.

### ACC-036 — Ambiguous same-name guest is never auto-merged
**Requirements:** GST-011, IMP-009

Given two possible Alex Example matches and incoming row lacks stable evidence, when import matches, then human resolution is required/no name-only auto-merge occurs.

### ACC-037 — Mapping profile reuse remains user/project scoped
**Requirements:** IMP-020

Given owner saves a spreadsheet mapping profile, when reused in same authorized context, then mappings prefill safely; another unrelated project/user cannot access it by guessed ID.

### ACC-038 — Stale import preview revalidates before apply
**Requirements:** IMP-001, IMP-010

Given preview was computed then another owner changes affected canonical data, when Apply is attempted, then commit detects stale/current conflicts and revalidates/reviews rather than applying old plan blindly.

### ACC-039 — Rollback protects later legitimate edit
**Requirements:** IMP-012

Given import set price then later owner manually updates price from stronger new quote, when import rollback runs, then later edit is not overwritten silently; reconciliation is surfaced.

### ACC-040 — CSV export neutralizes formula payload
**Requirements:** IMP-015

Given user-controlled text begins with spreadsheet formula-control characters, when CSV export is opened in spreadsheet software, then output encoding prevents unintended formula execution according to security policy.

## Guests and seating

### ACC-041 — Guest statistics reproduce reference fixture
**Requirements:** GST-003, GST-004, GST-005

Given known 0/25/75/100% probabilities and priorities, when expected/cumulative statistics calculate, then values exactly match independent fixture and are derived from source rows.

### ACC-042 — RSVP precedence is explicit
**Requirements:** GST-004, GST-006

Given guest probability 75% then RSVP `attending`, when operational confirmed count renders, then RSVP rule is applied without overwriting probability field as unrelated source truth.

### ACC-043 — One active seating assignment per guest
**Requirements:** GST-012

Given guest already assigned table 1, when another concurrent assignment to table 2 is applied without move semantics, then invariant prevents two active assignments/produces conflict.

### ACC-044 — Seating cannot cross project
**Requirements:** GST-013

Given owner knows table UUID from another project, when assigning own guest to it, then DB/domain rejects relationship.

### ACC-045 — Table capacity warning is derived
**Requirements:** GST-012

Given table capacity 8 and 9 active assignments, when Seating renders, then over-capacity warning appears; capacity is not silently increased and guest assignment history remains.

### ACC-046 — RSVP change marks seating review, not silent deletion
**Requirements:** GST-012

Given attending guest has table assignment then RSVP changes to not attending, when data recalculates, then seating is marked/reviewable according to rule; assignment is not silently destroyed without explicit command.

## Budget/scenarios/payments

### ACC-047 — Multiple named scenarios coexist independently
**Requirements:** FIN-011

Given scenarios S29/175/date A and S32/195/date B, when one assumption changes in S32, then S29 and historical actuals remain unchanged.

### ACC-048 — Only one active scenario
**Requirements:** FIN-011

Given scenario A active, when owner activates B through protected command, then B becomes active and A inactive atomically; no two active operational scenarios remain.

### ACC-049 — Scenario change never rewrites historical quote
**Requirements:** FIN-005

Given quote document for 175 guests and scenario changes to 185, when calculated, then variable planning total changes while original quote/document/terms remain unchanged.

### ACC-050 — Tax unknown is never assumed TTC/HT
**Requirements:** FIN-012

Given offer tax treatment unknown, when budget comparison renders, then total/label exposes uncertainty and app does not silently assume included/excluded tax.

### ACC-051 — Refundable security deposit is not final cost
**Requirements:** FIN-004

Given €2,000 refundable caution, when budget/cash flow renders, then outgoing cash requirement is visible but expected final wedding cost excludes it per refundable semantics until outcome changes.

### ACC-052 — Partial payment/refund math is exact
**Requirements:** FIN-001, FIN-013

Given €9,500 contract, payments €2,000 + €1,500 and later €500 refund, when summary computes, then movements/remainder are exact minor-unit values and refund remains explicit linked movement.

## Documents, contracts and external media

### ACC-053 — Revised contract preserves old version
**Requirements:** MED-011

Given contract v1 reviewed, when v2 arrives, then v2 links as superseding document, v1 remains historical and v2 does not inherit version-specific reviewed status silently.

### ACC-054 — Contract readiness preserves unresolved items
**Requirements:** MED-012

Given cancellation terms not found and tax contradictory, when checklist reviewed, then readiness shows open/contradictory items and can link follow-up task/evidence; app never labels legal validity.

### ACC-055 — Interrupted upload never appears committed
**Requirements:** MED-009

Given binary upload/metadata transaction fails midway, when user opens documents/media, then incomplete object is not shown Ready and retry/orphan cleanup path exists.

### ACC-056 — Original media remains immutable
**Requirements:** MED-004, MED-005

Given archived original photo, when thumbnail regenerated, then original bytes/hash remain unchanged and derivative relationship/version updates separately.

### ACC-057 — External image request protects privacy
**Requirements:** MED-013

Given remote marketing image URL, when displayed, then request does not append private project/guest/token data and uses privacy-preserving referrer policy/fallback; remote failure does not block venue record.

### ACC-058 — Storage path does not expose private filename
**Requirements:** SEC-010, MED-010

Given uploaded `Contrat_NomPrive.pdf`, when stored, then object path uses opaque IDs; original filename remains authorized metadata rather than publicly observable path identity.

## Planning/timeline/search/Inbox

### ACC-059 — Milestone relative date vs fixed deadline
**Requirements:** PLN-003

Given milestone J-30 and fixed contractual payment date, when wedding date moves, then J-30 recalculates while fixed payment date remains unchanged unless edited from new evidence.

### ACC-060 — After-midnight timeline sorts correctly
**Requirements:** PLN-004, PLN-005

Given dinner 22:00 day 0 and music end 01:30 day 1, when timeline sorts/validates, then music appears after dinner and duration is not treated negative.

### ACC-061 — Timeline dependency cycle is rejected
**Requirements:** PLN-004

Given A depends on B and B would depend on A, when second link is created, then cycle is rejected and existing timeline remains valid.

### ACC-062 — Frozen timeline snapshot is immutable
**Requirements:** PLN-006

Given timeline snapshot exported at revision X, when live timeline changes later, then distributed snapshot content remains unchanged and UI can indicate live data differs.

### ACC-063 — Vendor timeline export is privacy allowlisted
**Requirements:** SEC-010

Given vendor-specific timeline packet, when generated, then only relevant schedule/access/contact data is included and unrelated guest PII/private budget/notes are excluded.

### ACC-064 — Inbox conversion is idempotent
**Requirements:** CAP-001, CAP-002

Given Inbox venue hint converted to venue UUID V, when conversion is retried after lost acknowledgement, then V is reused/recognized and no duplicate venue is created; original capture remains linked.

### ACC-065 — Search respects authorization and archive state
**Requirements:** CAP-003

Given project contains active/rejected/private guest data, when authorized owner searches, then results follow configured archive/deletion scope; outsider direct search returns no project data.

### ACC-066 — Search URL does not leak guest PII
**Requirements:** CAP-004

Given owner searches private guest details, when navigating/results deep-link, then unnecessary PII is not serialized into externally visible/public URLs/history beyond safe bounded route state.

## Backup/recovery/security/operations

### ACC-067 — Full backup reconstructs golden project
**Requirements:** BAK-001, BAK-009

Given golden project includes all V1 domains, when full supported backup exported/restored into clean target, then semantic equality and included binary checksums pass modulo generated IDs/audit metadata allowed by contract.

### ACC-068 — Encrypted backup wrong password/tamper fails before mutation
**Requirements:** BAK-011, BAK-012

Given encrypted `.mariage`, when password is wrong or authenticated ciphertext altered, then decryption/authentication fails and target project remains unchanged.

### ACC-069 — Unsupported future backup is rejected safely
**Requirements:** BAK-006

Given app supports schema v1 and backup declares unsupported future version, when restore begins, then process stops before target mutation and explains upgrade incompatibility.

### ACC-070 — Offline cache cannot masquerade as full authoritative backup
**Requirements:** BAK-001, SYN-009

Given device is offline with incomplete cached project, when user requests full backup, then app refuses to label it verified complete; may offer clearly labeled local recovery export of available/pending data.

### ACC-071 — Storage quota pressure preserves essential edits
**Requirements:** OPS-001, OPS-003

Given storage near free-tier safety threshold, when large decorative upload attempted, then app warns/defer/blocks it while RSVP/task/payment structured edits remain functional.

### ACC-072 — Project deletion requires strong safeguards
**Requirements:** IAM-009

Given owner requests permanent project deletion, then recent strong auth + explicit high-impact confirmation + backup guidance are required and non-owner/stale session cannot execute purge.

### ACC-073 — Downloaded backup remains outside cloud deletion claim
**Requirements:** BAK-001

Given owner downloaded private backup then deletes project, when deletion completes, then app explicitly does not claim downloaded external copy was erased.

### ACC-074 — Repository/CI contains no private production data/secrets
**Requirements:** PRD-002, SEC-009, GST-009

Given public-repo safety checks/review run, then real wedding data, private backups/dumps and production secrets are absent; fixtures are synthetic.

## Architecture/no-context/readiness

### ACC-075 — Every offline-capable V1 screen has local representation
**Requirements:** QLT-011

Given frozen V1 route/feature matrix, when architecture review compares local schema, then each offline-capable durable entity/action has local cache/queue semantics or is explicitly online-required.

### ACC-076 — Every project-owned relationship has same-project integrity
**Requirements:** SEC-011

Given physical schema and addendum, when reviewed table-by-table, then no project-owned relational/polymorphic link relies only on separate client-provided project ID without DB same-project validation.

### ACC-077 — Every V1 feature belongs to a lot and route/workflow
**Requirements:** QLT-011

Given frozen V1 scope, when compared to screen contracts/user flows/LOTS, then no required feature is orphaned from implementation sequence or user navigation.

### ACC-078 — No-context developer can identify governing semantics
**Requirements:** QLT-011

Given only repository, when developer follows START-HERE/INDEX/final review, then they can determine V1 boundary, architecture, security constraints, next allowed lot, intentional deferred decisions and required tests without prior chat context.

### ACC-079 — Final design gate blocks premature Lot 0
**Requirements:** QLT-011

Given frozen product spec but unresolved final-review BLOCKING/MAJOR finding, when implementation is proposed, then documentation gate remains CLOSED until finding is resolved and Run 4 merged.

### ACC-080 — Source-of-truth cutover requires evidence package
**Requirements:** PRD-009, BAK-009

Given application code appears functional, when real-data cutover is proposed, then Mariage OS is not declared source of truth until required security/tests/reconciliation/real-device/backup evidence is complete and both owners accept cutover.

---

## Release use

P0/P1 scenarios must map to automated/manual objective evidence before applicable lot/V1 completion. New implementation-discovered failure modes add regression scenarios rather than weakening this baseline.
