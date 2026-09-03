# Mariage OS — Frozen V1 Requirements Catalog

Status: **Normative V1 requirements index**

Purpose: stable requirement IDs for implementation, tests, security verification and cutover evidence.

Priority:
- **P0** release-blocking/security/data-integrity/source-of-truth requirement.
- **P1** required for V1 cutover.
- **P2** desirable but deferrable only where V1 scope explicitly allows it.

Every P0/P1 requirement must eventually map to objective verification evidence.

---

## Product and collaboration — PRD

- **PRD-001 P0** Both authorized partners access the same project data from supported phone/tablet/desktop devices.
- **PRD-002 P0** Real wedding data is never required or committed in the public source repository.
- **PRD-003 P1** Dashboard exposes state, blockers, waiting items, joint decisions, obligations and next useful action.
- **PRD-004 P1** Individual partner opinions/ratings/favorites remain distinct.
- **PRD-005 P1** Joint decisions can require both partners.
- **PRD-006 P1** Meaningful partner activity can be surfaced without raw audit noise.
- **PRD-007 P1** Rejected alternatives remain searchable with reason/history.
- **PRD-008 P1** Important entities support linked tasks, decisions, documents and evidence.
- **PRD-009 P0** Product data remains exportable/recoverable independently from cloud provider.
- **PRD-010 P0** Normal operation targets €0/month and must not silently trigger paid usage.
- **PRD-011 P1** Inbox supports low-friction capture and idempotent conversion without losing original provenance.
- **PRD-012 P1** Global search finds authorized project entities without bypassing privacy/archive/RLS rules.
- **PRD-013 P1** V1 stores a structured wedding-day timeline; advanced live day-of operations remain post-V1.
- **PRD-014 P1** V1 stores structured seating sections/tables/assignments; graphical drag/drop optimization remains post-V1.

## Identity/project isolation — IAM

- **IAM-001 P0** Production project data requires authenticated access.
- **IAM-002 P0** Database authorization is enforced with RLS, not only frontend checks.
- **IAM-003 P0** Storage authorization is enforced by private-bucket policies/RLS.
- **IAM-004 P0** Non-member users cannot SELECT/INSERT/UPDATE/DELETE another project's data.
- **IAM-005 P0** Browser code never contains service-role/secret credentials.
- **IAM-006 P0** Final project owner cannot be removed through ordinary flows.
- **IAM-007 P1** Partner membership is invitation-based.
- **IAM-008 P1** Production owners support MFA/TOTP according to rollout policy.
- **IAM-009 P0** Critical destructive/admin actions can require recent strong authentication.
- **IAM-010 P0** Public previews/test environments never connect to production wedding data by default.
- **IAM-011 P0** V1 production is a controlled single-couple deployment: unrelated users cannot self-create projects and consume free-tier resources.
- **IAM-012 P0** Invitation tokens are one-time, non-guessable, stored server-side only as hashes, identity-bound and replay-safe.
- **IAM-013 P0** Logout/session removal never silently destroys unsynchronized work; private local project cache follows the frozen purge policy after safe completion.

## Local-first/sync — SYN

- **SYN-001 P0** Eligible user edits are durably persisted locally before network acknowledgement.
- **SYN-002 P0** Sync state is visible: synced, syncing, offline-pending, conflict or error.
- **SYN-003 P0** Confirmed local edits are never silently discarded on reconnect.
- **SYN-004 P0** Retried mutation with same operation ID is idempotent/safely detected.
- **SYN-005 P0** Unsafe same-field concurrent edits become explicit conflicts.
- **SYN-006 P1** Independent additive changes merge automatically where safe.
- **SYN-007 P1** Structured-data synchronization is prioritized ahead of nonessential media.
- **SYN-008 P1** Session expiry while editing does not lose local work.
- **SYN-009 P1** Cached essentials remain readable during temporary backend/network failure.
- **SYN-010 P1** Pending mutations survive application restart.
- **SYN-011 P0** Cross-project cache/sync queues are isolated and never displayed under another project/account.

## PWA/offline — PWA

- **PWA-001 P1** App is installable as a PWA where supported.
- **PWA-002 P0** Service-worker update cannot leave incompatible stale app code active against newer schema semantics.
- **PWA-003 P1** Users can identify selected/critical venue data available offline.
- **PWA-004 P1** Offline venue-visit workflow supports cached detail, checklist/notes/measurements and queued edits.
- **PWA-005 P1** Map failure/offline state never blocks venue-record access.
- **PWA-006 P1** Unsupported advanced browser capability has explicit fallback.
- **PWA-007 P0** App update cannot silently destroy pending IndexedDB mutations/drafts.

## Venue management — VEN

- **VEN-001 P1** Venue has stable UUID independent from human code.
- **VEN-002 P1** Human codes such as S32/P10 support natural numeric sorting.
- **VEN-003 P1** Venue contains multiple spaces with independent dimensions/capacities.
- **VEN-004 P1** Commercial maximum capacity is distinct from couple-specific suitability.
- **VEN-005 P1** Criteria represent external caterer, shared room, two dance areas, chuppah, mehitsa, rain/weather, aesthetics, panorama, access/TGV, parking, accommodation, music and inclusions.
- **VEN-006 P1** Venue lifecycle/rejection history is retained.
- **VEN-007 P1** Missing critical venue information is surfaced.
- **VEN-008 P1** Multiple date-dependent offers/prices are supported.
- **VEN-009 P1** Availability observations are tied to date and observation time/source.
- **VEN-010 P1** Comparison prioritizes blockers and supports differences-only view.
- **VEN-011 P1** Aggregate compatibility never hides failed blocking criterion.
- **VEN-012 P1** Minimal venue quick-add does not require giant form completion.
- **VEN-013 P1** Venue photos distinguish remote refs, archived copies and private visit media.
- **VEN-014 P1** Venue details are deep-linkable after authorization.
- **VEN-015 P2** Personal list/table display preferences may be saved.
- **VEN-016 P1** Access routes can be stored per reference origin and transport mode without overwriting historical observations.
- **VEN-017 P1** Personal venue ratings/favorites are member-scoped and never shared-fact replacements.
- **VEN-018 P1** Multiple wedding-date candidates can coexist before final selection.

## Facts/provenance/criteria — FAC

- **FAC-001 P0** `unknown`, `false`, `not_applicable` and `conflict` are distinct.
- **FAC-002 P1** Important facts can have multiple observations and multiple sources per observation.
- **FAC-003 P1** Retained value may differ from one observation without destroying evidence.
- **FAC-004 P0** Weaker imported evidence cannot silently replace stronger contractual/confirmed evidence.
- **FAC-005 P1** Facts carry verification/freshness semantics where applicable.
- **FAC-006 P1** Conflicting evidence remains visible/actionable.
- **FAC-007 P1** Contract/written/quote/official/verbal/third-party/estimate evidence classes are distinguishable.
- **FAC-008 P1** Stale critical facts can be flagged for revalidation.
- **FAC-009 P0** Imported fact provenance is retained.
- **FAC-010 P1** Missing/stale/conflicting facts may suggest review tasks without uncontrolled silent mutation.
- **FAC-011 P0** Criteria used in compatibility define explicit evaluation rules; priority and desirability direction are separate concepts.
- **FAC-012 P0** Fact retained/observed values validate against their declared value type/shape.
- **FAC-013 P1** Compatibility output separates blocking status, weighted score, completeness/evidence readiness and explanation.

## Vendors/caterers — VND

- **VND-001 P1** Vendors use generic model with typed specialization.
- **VND-002 P1** Vendors support multiple contacts/interactions/offers/documents.
- **VND-003 P1** Quote request/reply/clarification/follow-up state is tracked.
- **VND-004 P1** Caterers support per-person pricing and detailed inclusions/exclusions.
- **VND-005 P1** Venue-vendor compatibility is representable.
- **VND-006 P1** Waiting-on-vendor work is distinguished from couple action.
- **VND-007 P1** Packages represent included, mandatory-extra and optional components.
- **VND-008 P2** Reliability/communication assessment may be stored subjectively.

## Guests/households/seating — GST

- **GST-001 P1** Active guest belongs to at most one active household.
- **GST-002 P1** Household invitation context and individual RSVP coexist.
- **GST-003 P1** Priority and attendance probability are independent.
- **GST-004 P1** Expected attendance is derived, not independently manually maintained.
- **GST-005 P1** Cumulative priority statistics are reproducible.
- **GST-006 P1** RSVP lifecycle follows domain state specification.
- **GST-007 P1** Partner/child relationships and age groups are representable.
- **GST-008 P1** Transport/accommodation/dietary/accessibility logistics are stored only when useful.
- **GST-009 P0** Guest PII is excluded from public fixtures/logs/repository.
- **GST-010 P1** Bulk import/export supports legacy spreadsheet migration.
- **GST-011 P0** Name similarity alone never auto-merges ambiguous guests.
- **GST-012 P1** Structured seating supports zones/tables/capacity/assignments/unassigned/over-capacity validation.
- **GST-013 P1** Seating assignment cannot reference guest/table from another project.

## Tasks/decisions — TSK/DEC

- **TSK-001 P1** Task has owner/status/due/priority/links.
- **TSK-002 P1** Waiting and blocked states are first-class.
- **TSK-003 P1** Dependencies can block impossible work and cycles are rejected.
- **TSK-004 P1** Next-action prioritization is deterministic/explainable.
- **TSK-005 P1** Completed/cancelled task history is retained per retention policy.
- **DEC-001 P1** Decisions retain options and final rationale.
- **DEC-002 P1** Decision can require both owners.
- **DEC-003 P1** Final critical decision lock/reopen is explicit.
- **DEC-004 P1** Alternatives remain historically available.
- **DEC-005 P1** `discuss together` items are separately queryable.

## Finance — FIN

- **FIN-001 P0** Authoritative money math uses exact minor units, not binary floating point.
- **FIN-002 P1** Estimate/quote/approved/contracted/paid/refunded remain distinct.
- **FIN-003 P1** Fixed/per-guest/per-adult/per-child/per-table/per-hour/quantity/minimum-variable calculation modes are supported.
- **FIN-004 P1** Refundable deposits/cautions are distinct from final expected cost.
- **FIN-005 P1** Guest/date scenario change recomputes derived costs without rewriting historical quote/contract truth.
- **FIN-006 P1** Cash-flow deadlines are represented independently from final cost.
- **FIN-007 P1** Paid/committed/remaining contractual totals are separately visible.
- **FIN-008 P0** Invalid impossible supported payment/refund states are rejected.
- **FIN-009 P1** Budget supports minimum/probable/high planning views where configured.
- **FIN-010 P1** Cost-per-guest is derived/explainable.
- **FIN-011 P1** Multiple named scenarios coexist with explicit date/venue/guest/package/component assumptions and one active operational scenario.
- **FIN-012 P0** Tax treatment is explicit (`included`,`excluded`,`unknown`,`not_applicable`) and never silently assumed.
- **FIN-013 P1** Partial refunds, credits, deposit returns and final balances retain explicit cash-movement semantics.

## Planning/timeline — PLN

- **PLN-001 P1** Planning supports phases and weighted milestones rather than raw task-count progress.
- **PLN-002 P1** Milestones support dependencies, completion rules and linked entities.
- **PLN-003 P1** Relative milestones recalculate from wedding date while fixed contractual deadlines remain fixed.
- **PLN-004 P1** Structured event timeline supports start/end times, day offsets, location/space, responsible party, vendors/contacts and dependencies.
- **PLN-005 P1** After-midnight timeline ordering follows project timezone/day-offset rules.
- **PLN-006 P1** Frozen timeline exports do not mutate when live timeline later changes.

## Documents/media/contracts — MED

- **MED-001 P1** Documents and media have separate semantics.
- **MED-002 P0** Imported files are never executed as application code.
- **MED-003 P0** File type/size/MIME/signature validation follows security policy.
- **MED-004 P1** Archived original photo bytes are preserved.
- **MED-005 P1** Thumbnails/previews are distinct derivatives.
- **MED-006 P1** Duplicate binary files are detectable by hash.
- **MED-007 P1** Remote images may remain references to protect quota.
- **MED-008 P1** Media provenance/source URL can be retained.
- **MED-009 P0** Incomplete/orphan uploads are recoverable/cleanable and not treated as committed.
- **MED-010 P0** Sensitive files remain private and do not rely on obscurity.
- **MED-011 P1** Revised/superseded quote/contract/document versions remain linked and historically accessible.
- **MED-012 P1** Contract readiness checklist can record factual review before signature without representing legal advice.
- **MED-013 P0** External media requests must not expose private project data through URL/referrer metadata.

## Inbox/search — CAP

- **CAP-001 P1** Inbox captures text/link/file-reference with origin/time/author.
- **CAP-002 P1** Inbox conversion is idempotent and preserves origin/provenance.
- **CAP-003 P1** Search respects RLS, archive/deletion and offline availability.
- **CAP-004 P0** Search/query URLs must not expose unnecessary guest/private project PII.

## Import/export — IMP

- **IMP-001 P0** Import preview occurs before canonical production mutation.
- **IMP-002 P0** Missing rows/fields never imply deletion by default.
- **IMP-003 P0** Reimport does not create uncontrolled semantic duplicates.
- **IMP-004 P1** CSV/XLSX/canonical JSON/clipboard imports are supported in V1 scope.
- **IMP-005 P1** Canonical JSON is schema-versioned.
- **IMP-006 P1** Stable namespaced external IDs support idempotent updates.
- **IMP-007 P1** Mappings are previewable/correctable and optionally remembered.
- **IMP-008 P1** New categories/tags are previewed before creation.
- **IMP-009 P0** Ambiguous duplicates require human resolution.
- **IMP-010 P0** Protected/locked/stronger truth cannot be silently overwritten.
- **IMP-011 P1** Import history records file/hash/actor/change summary.
- **IMP-012 P0** Significant imports define rollback/recovery before commit.
- **IMP-013 P1** Raw files are parsed locally where practical and not automatically uploaded merely for parsing.
- **IMP-014 P0** Spreadsheet macros/active content are never executed.
- **IMP-015 P0** CSV export mitigates formula injection.
- **IMP-016 P1** Lossless formats have round-trip semantic tests.
- **IMP-017 P1** Missing/stale research fields can be exported for external completion.
- **IMP-018 P1** User can analyze a file without importing it.
- **IMP-019 P0** Nested external IDs are parent-scoped; two different parents may reuse child external IDs safely.
- **IMP-020 P1** Mapping profiles persist project-scoped reusable mappings safely.

## Backup/migration/recovery — BAK

- **BAK-001 P0** Complete `.mariage` export reconstructs structured project data.
- **BAK-002 P0** Full backup can optionally include media/documents.
- **BAK-003 P0** Backup/schema/app format versions are explicit.
- **BAK-004 P0** Integrity checks detect missing/corrupt included files.
- **BAK-005 P0** Supported historical fixtures migrate to current schema in CI.
- **BAK-006 P0** Unsupported future backup is rejected before mutation.
- **BAK-007 P1** Backup age/last successful external backup is visible.
- **BAK-008 P0** Destructive migrations/imports create required recovery point/checkpoint.
- **BAK-009 P0** Restore is tested, not assumed.
- **BAK-010 P1** Provider migration remains possible through open exports and adapter boundaries.
- **BAK-011 P0** Private full backup encryption uses authenticated client-side encryption with versioned KDF/algorithm parameters.
- **BAK-012 P0** Wrong password/tampered encrypted backup fails authentication before project mutation.

## Security/privacy — SEC

- **SEC-001 P0** OWASP ASVS 5.0 applicability/evidence is tracked before production cutover.
- **SEC-002 P0** Known exploitable Critical/High vulnerabilities block release unless objectively adjudicated false positive/non-applicable.
- **SEC-003 P0** Cross-project authorization leak blocks release.
- **SEC-004 P0** User/import content uses safe output encoding/rendering.
- **SEC-005 P0** CSP and production security headers are defined/tested.
- **SEC-006 P0** No behavioral advertising/third-party tracking analytics by default.
- **SEC-007 P0** Logs/diagnostics minimize PII/secrets.
- **SEC-008 P0** Dependency/actions supply-chain controls are enforced.
- **SEC-009 P0** Secrets/private artifacts are prohibited/scanned in public Git history.
- **SEC-010 P0** Sensitive exports use allowlisted profiles.
- **SEC-011 P0** Same-project relational integrity is enforced by composite constraints/validated references, not trusted client `project_id` alone.
- **SEC-012 P0** Security-definer/database functions explicitly authorize callers and use safe search-path semantics.

## Quality/testing — QLT

- **QLT-001 P0** Required PR/release Quality Gates pass from a clean environment.
- **QLT-002 P0** Defined in-scope business code meets 100% lines/statements/functions/branches coverage policy.
- **QLT-003 P0** Coverage alone is insufficient; critical engines use meaningful assertions/property/mutation tests.
- **QLT-004 P0** RLS tests include allow and deny cases.
- **QLT-005 P0** Critical journeys have Playwright E2E coverage.
- **QLT-006 P0** Offline/reconnect/session-expiry behavior has automated coverage.
- **QLT-007 P0** Backup/restore/migration compatibility is automated.
- **QLT-008 P1** Supported browser/device profiles are defined/tested.
- **QLT-009 P1** Blocking accessibility violations fail required gate.
- **QLT-010 P1** Performance budgets use deterministic synthetic project sizes.
- **QLT-011 P0** Every final-review BLOCKING/MAJOR finding is closed before implementation gate opens.

## UX/accessibility — UX

- **UX-001 P1** Summary-first presentation hides unnecessary detail until requested.
- **UX-002 P1** Minimal entity creation does not require all optional fields.
- **UX-003 P1** Major screens define loading/empty/error/offline/permission/conflict states.
- **UX-004 P1** Status is never conveyed by color alone.
- **UX-005 P1** Mobile primary actions are touch-friendly and not hover-dependent.
- **UX-006 P1** Destructive confirmations are proportional to risk/reversibility.
- **UX-007 P1** Safe reversible actions prefer undo.
- **UX-008 P1** External navigation does not silently lose drafts.
- **UX-009 P1** User-facing errors avoid raw backend jargon/details.
- **UX-010 P1** Core desktop flows are keyboard/focus accessible.
- **UX-011 P1** Structured seating/timeline screens remain usable without drag/drop or pointer-only interaction.

## Operations/free tier — OPS

- **OPS-001 P0** App never automatically enables paid tier/overage behavior.
- **OPS-002 P1** Quota warnings appear before essential functionality is threatened.
- **OPS-003 P0** Storage pressure restricts nonessential media before essential structured data.
- **OPS-004 P1** Diagnostics expose app/schema/sync/backup/storage health without sensitive content.
- **OPS-005 P0** Potential data-loss/security incidents follow documented response process.
- **OPS-006 P1** Cloud outages degrade to cached/local behavior where capability permits.
- **OPS-007 P1** Soft-delete expiration means purge eligibility, not a promise of exact cron-time deletion.
- **OPS-008 P0** Production signup/project bootstrap cannot be abused to exhaust the couple's free tier.

---

## Traceability/change rule

Implementation PRs/issues must reference applicable requirement IDs. A material requirement change must assess product, data, migration, security, test and V1-cutover consequences.

No implementation lot starts until `docs/FINAL-DESIGN-REVIEW.md` declares the implementation gate **OPEN**.