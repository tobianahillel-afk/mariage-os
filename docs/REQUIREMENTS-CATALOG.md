# Mariage OS — Requirements Catalog

Status: **Normative V1 requirements index**

Purpose: provide stable requirement IDs that can be linked to implementation, tests, threats and release evidence.

Priority legend:
- **P0** release-blocking / safety, privacy, data-integrity or source-of-truth requirement.
- **P1** required for V1 cutover.
- **P2** desirable V1 enhancement; may be deferred only if V1-SCOPE explicitly allows it.

Every P0/P1 requirement must eventually have at least one acceptance test or verification artifact.

---

## Product and collaboration — PRD

- **PRD-001 P0** The same project data is accessible to both authorized partners from supported phones, tablets and desktops.
- **PRD-002 P0** Real wedding data is never required in the public source repository.
- **PRD-003 P1** The dashboard lets a partner understand current state, blockers, joint decisions, upcoming obligations and next useful action without opening every module.
- **PRD-004 P1** Individual partner opinions/ratings remain distinct.
- **PRD-005 P1** Joint decisions can require both partner approvals.
- **PRD-006 P1** Meaningful activity by the other partner can be surfaced without exposing low-level audit noise.
- **PRD-007 P1** Rejected alternatives remain searchable with reason/history.
- **PRD-008 P1** Important entities support linked tasks, decisions, documents and notes.
- **PRD-009 P0** The product remains exportable/recoverable independently from the cloud provider.
- **PRD-010 P0** Normal operating design targets €0/month and must not silently trigger paid service usage.

## Identity and project isolation — IAM

- **IAM-001 P0** All production project data requires authenticated access.
- **IAM-002 P0** Database authorization is enforced by RLS, not only frontend checks.
- **IAM-003 P0** Storage authorization is enforced by private-bucket policies/RLS.
- **IAM-004 P0** A user who is not a member of project A cannot SELECT/INSERT/UPDATE/DELETE project A data.
- **IAM-005 P0** Client code never contains service-role/secret keys.
- **IAM-006 P0** The final project owner cannot be accidentally removed through ordinary UI flows.
- **IAM-007 P1** Project membership is invitation-based.
- **IAM-008 P1** Production owners support MFA/TOTP according to rollout policy.
- **IAM-009 P0** Critical destructive/admin actions can require recent strong authentication.
- **IAM-010 P0** Public previews/test environments never connect to production wedding data by default.

## Local-first and synchronization — SYN

- **SYN-001 P0** User edits are persisted locally before network confirmation where the local-first model applies.
- **SYN-002 P0** Sync state is explicitly visible: synced, syncing, offline-pending, conflict or error.
- **SYN-003 P0** Confirmed local edits are never silently discarded on reconnect.
- **SYN-004 P0** Replaying the same queued mutation must be idempotent or safely detected.
- **SYN-005 P0** Same-field concurrent edits that cannot safely merge become explicit conflicts.
- **SYN-006 P1** Independent additive changes such as separate media additions can merge automatically.
- **SYN-007 P1** Essential structured-data synchronization is prioritized before large non-essential media uploads.
- **SYN-008 P1** Session expiry while editing does not lose local work.
- **SYN-009 P1** Cached essential information remains readable during temporary backend/network failure.
- **SYN-010 P1** The app survives restart with pending local edits intact.

## Offline/PWA — PWA

- **PWA-001 P1** The application is installable as a PWA on supported platforms where browser capability permits.
- **PWA-002 P0** A service-worker update cannot leave incompatible stale application assets active against a newer schema.
- **PWA-003 P1** Users can identify whether selected/critical venue data is available offline.
- **PWA-004 P1** Offline visit workflows support cached venue details, checklist, notes and queued edits.
- **PWA-005 P1** Map failure/offline status never blocks access to venue records.
- **PWA-006 P1** Unsupported advanced browser capabilities have a documented fallback.

## Venue management — VEN

- **VEN-001 P1** A venue has a stable UUID independent from its human code.
- **VEN-002 P1** Human codes such as S32/P10 support natural numeric sorting.
- **VEN-003 P1** A venue can contain multiple spaces with independent dimensions/capacities.
- **VEN-004 P1** Commercial capacity is distinguishable from couple-specific suitability.
- **VEN-005 P1** Venue criteria can represent external caterer, two dance areas, chuppah, rain plan, climate, aesthetics, panorama/elevation, access, TGV, parking, accommodation, music and inclusions.
- **VEN-006 P1** Venue status/rejection history is retained.
- **VEN-007 P1** Venue-specific missing critical information is surfaced.
- **VEN-008 P1** Multiple date-dependent offers/prices are supported.
- **VEN-009 P1** Availability observations can be tied to dates and verification timestamps.
- **VEN-010 P1** Venue comparison prioritizes blocking criteria and can show only differences.
- **VEN-011 P1** Aggregate compatibility never hides a failed blocking criterion.
- **VEN-012 P1** Users can add a minimal venue without completing a giant form.
- **VEN-013 P1** Venue photos distinguish remote references, archived copies and couple visit photos.
- **VEN-014 P1** Venue detail links are deep-linkable.
- **VEN-015 P2** Users can save personal table/list column preferences.

## Facts, provenance and confidence — FAC

- **FAC-001 P0** `unknown`, `false`, `not_applicable` and `conflict` are semantically distinct.
- **FAC-002 P1** Important facts can have multiple source observations.
- **FAC-003 P1** A retained value can differ from one observation without destroying evidence.
- **FAC-004 P0** Weaker imported evidence does not silently replace stronger confirmed/contractual evidence.
- **FAC-005 P1** Facts carry verification/freshness information where relevant.
- **FAC-006 P1** Conflicting evidence is visible and actionable.
- **FAC-007 P1** Verbal, written, quote and contractual evidence levels are distinguishable.
- **FAC-008 P1** Stale critical facts can be marked for revalidation.
- **FAC-009 P0** Import provenance is retained for imported facts.
- **FAC-010 P1** Missing/stale/conflicting facts can generate suggested follow-up actions without uncontrolled automatic mutation.

## Vendors — VND

- **VND-001 P1** Vendors use a generic model with typed specialization.
- **VND-002 P1** Vendors support multiple contacts/interactions/offers/documents.
- **VND-003 P1** Quote-request/reply/follow-up state is tracked.
- **VND-004 P1** Caterers support per-person pricing and detailed inclusions/exclusions.
- **VND-005 P1** Vendor compatibility with a venue can be represented.
- **VND-006 P1** Waiting-on-vendor work is distinguished from work not yet done by the couple.
- **VND-007 P1** Vendor packages can represent included, mandatory-extra and optional items.
- **VND-008 P2** Vendor reliability/communication assessment can be stored subjectively.

## Guests and households — GST

- **GST-001 P1** Guests can belong to one active household.
- **GST-002 P1** Household-level invitation context and individual RSVP coexist.
- **GST-003 P1** Priority and attendance probability are represented independently.
- **GST-004 P1** Expected attendance is derived, not independently manually maintained.
- **GST-005 P1** Cumulative priority statistics are reproducible from source data.
- **GST-006 P1** RSVP supports pending/yes/no/uncertain-like lifecycle states defined by domain spec.
- **GST-007 P1** Partner/child relationships and age groups are representable.
- **GST-008 P1** Transport/accommodation/dietary notes can be stored only when useful.
- **GST-009 P0** Guest PII is excluded from public fixtures/logs/repository.
- **GST-010 P1** Bulk import/export supports existing spreadsheet migration.
- **GST-011 P0** Name similarity alone never auto-merges ambiguous guests.

## Tasks and decisions — TSK/DEC

- **TSK-001 P1** Tasks have owner, status, due date, priority and linked entity.
- **TSK-002 P1** Waiting and blocked states are first-class.
- **TSK-003 P1** Dependencies can block impossible work.
- **TSK-004 P1** Next-action prioritization is explainable and deterministic.
- **TSK-005 P1** Completed/cancelled task history is retained according to retention rules.
- **DEC-001 P1** Decisions contain options and final rationale.
- **DEC-002 P1** Decisions can require both owners to approve.
- **DEC-003 P1** Final critical decisions can be locked/reopened only explicitly.
- **DEC-004 P1** Alternatives remain available historically.
- **DEC-005 P1** `discuss together` items are queryable separately from personal tasks.

## Budget and payments — FIN

- **FIN-001 P0** Business monetary calculations do not use binary floating-point arithmetic as authoritative money math.
- **FIN-002 P1** Estimate, quote, approved, contracted, paid and refunded concepts remain distinct.
- **FIN-003 P1** Fixed/per-guest/per-table/per-hour/quantity pricing modes are supported.
- **FIN-004 P1** Refundable deposits are distinguishable from final cost.
- **FIN-005 P1** Changing guest count recomputes derived variable scenarios without rewriting historical quotes/contracts.
- **FIN-006 P1** Cash-flow deadlines are represented separately from final cost.
- **FIN-007 P1** Paid, committed and remaining contractual amounts are separately visible.
- **FIN-008 P0** Invalid impossible supported payment states are rejected by domain invariants.
- **FIN-009 P1** Budget supports minimum/probable/max-reasonable scenario concepts when configured.
- **FIN-010 P1** Cost-per-guest is derived and explainable.

## Documents and media — MED

- **MED-001 P1** Documents and images/media have separate semantics.
- **MED-002 P0** Imported user files are never executed as application code.
- **MED-003 P0** File type/size/MIME/signature validation follows file-security policy.
- **MED-004 P1** Original stored photo bytes are preserved when archived.
- **MED-005 P1** Thumbnails/previews are separate derivatives.
- **MED-006 P1** Duplicate binary files are detectable by hash.
- **MED-007 P1** Remote images can remain external references to protect storage quota.
- **MED-008 P1** Media provenance/source URL can be retained.
- **MED-009 P0** Orphan/incomplete uploads do not consume quota indefinitely without cleanup.
- **MED-010 P0** Sensitive documents remain private and never rely on publicly guessable object access.

## Import/export — IMP

- **IMP-001 P0** Import preview occurs before production mutation.
- **IMP-002 P0** Missing import rows never imply deletion by default.
- **IMP-003 P0** Re-importing the same canonical object/file does not create uncontrolled duplicates.
- **IMP-004 P1** CSV, XLSX, canonical JSON and clipboard table imports are supported in scope.
- **IMP-005 P1** Canonical Mariage OS JSON is schema-versioned.
- **IMP-006 P1** Stable namespaced external IDs support idempotent updates.
- **IMP-007 P1** Column mappings can be previewed/corrected and optionally remembered.
- **IMP-008 P1** New categories/tags are previewed before creation.
- **IMP-009 P0** Ambiguous duplicates require human resolution.
- **IMP-010 P0** Protected/locked critical data cannot be silently overwritten by normal import.
- **IMP-011 P1** Import history records source file/hash, actor and resulting changes.
- **IMP-012 P0** Significant imports have rollback/recovery semantics defined before commit.
- **IMP-013 P1** Raw import files are parsed locally when practical and not automatically uploaded merely for parsing.
- **IMP-014 P0** Spreadsheet macros/active content are not executed.
- **IMP-015 P0** CSV export mitigates formula-injection risk for user-controlled text.
- **IMP-016 P1** Export→import round-trip is tested for formats claiming lossless scope.
- **IMP-017 P1** Users can export missing/stale research fields for external completion.
- **IMP-018 P1** Users can analyze a file without importing it.

## Backup, migration and recovery — BAK

- **BAK-001 P0** A complete `.mariage` export can reconstruct project structured data.
- **BAK-002 P0** Full backups can optionally include media/documents.
- **BAK-003 P0** Backup schema version is explicit.
- **BAK-004 P0** Integrity checks detect missing/corrupt included files.
- **BAK-005 P0** Supported historical backup fixtures migrate to current schema in CI.
- **BAK-006 P0** A future unsupported schema is rejected rather than partially interpreted.
- **BAK-007 P1** Backup age is visible/reviewable.
- **BAK-008 P0** Destructive migrations/imports create required recovery points.
- **BAK-009 P0** Restore is tested, not assumed.
- **BAK-010 P1** Provider migration remains possible through repository/service boundaries and open exports.

## Security — SEC

- **SEC-001 P0** OWASP ASVS 5.0 applicability is tracked in a verification matrix.
- **SEC-002 P0** Known Critical/High vulnerabilities block release unless explicitly adjudicated false positive with evidence.
- **SEC-003 P0** Cross-project authorization leakage blocks release.
- **SEC-004 P0** XSS-prone user data is rendered through safe text/sanitized mechanisms per frontend policy.
- **SEC-005 P0** CSP and required security headers are defined for production.
- **SEC-006 P0** No third-party behavioral tracking analytics is included by default.
- **SEC-007 P0** Logs/diagnostics avoid unnecessary PII/secrets.
- **SEC-008 P0** Dependencies/actions are pinned/controlled according to supply-chain policy.
- **SEC-009 P0** Secrets are scanned and prohibited from public Git history.
- **SEC-010 P0** Sensitive exports use allowlisted field profiles rather than fragile exclusion-only logic.

## Quality and testing — QLT

- **QLT-001 P0** All required PR quality gates pass from a clean environment before production merge/release.
- **QLT-002 P0** In-scope business code satisfies 100% lines/statements/functions/branches coverage, including per-file policy where specified.
- **QLT-003 P0** Coverage alone is not accepted as behavioral proof; assertions and mutation testing apply to critical engines.
- **QLT-004 P0** Critical RLS tests include allow and deny cases.
- **QLT-005 P0** Critical E2E paths are tested with Playwright.
- **QLT-006 P0** Offline/reconnect/session-expiry behavior has automated integration/E2E coverage.
- **QLT-007 P0** Backup/restore and migration compatibility are automated tests.
- **QLT-008 P1** Supported browser/device profiles are defined and tested.
- **QLT-009 P1** Accessibility blocking violations fail the required gate according to accessibility policy.
- **QLT-010 P1** Performance budgets are measured against deterministic synthetic project sizes.

## UX and accessibility — UX

- **UX-001 P1** Summary-first presentation hides unnecessary detail until requested.
- **UX-002 P1** Minimal entity creation never requires filling all optional fields.
- **UX-003 P1** All major screens have designed loading/empty/error/offline/permission/conflict states.
- **UX-004 P1** Status is never conveyed by color alone.
- **UX-005 P1** Mobile primary actions are touch-friendly and do not rely on hover.
- **UX-006 P1** Destructive confirmations are proportional to reversibility/risk.
- **UX-007 P1** Reversible actions prefer undo where safe.
- **UX-008 P1** External navigation does not silently lose drafts.
- **UX-009 P1** Human-readable errors hide unnecessary backend implementation detail.
- **UX-010 P1** Core workflows are keyboard-accessible on desktop.

## Operations/free tier — OPS

- **OPS-001 P0** App does not automatically enable paid tier/overage behavior.
- **OPS-002 P1** Quota warnings appear before essential functionality is threatened.
- **OPS-003 P0** When storage pressure occurs, non-essential media is restricted before essential structured data.
- **OPS-004 P1** Diagnostics show app/schema/sync/backup/storage health without leaking sensitive content.
- **OPS-005 P0** Production incidents involving possible data loss/leak follow documented response process.
- **OPS-006 P1** Cloud outages degrade to cached/local behavior where capability permits.

---

## Traceability rule

Implementation work must reference applicable requirement IDs in PR descriptions or issue/lot artifacts. Critical tests should use requirement IDs in test names or metadata where practical.

A requirement may be changed only by documentation review that also evaluates implementation, migration, security and test consequences.
