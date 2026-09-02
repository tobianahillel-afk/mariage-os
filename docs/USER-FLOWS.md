# Critical User Flows

Status: **Normative V1 end-to-end workflow reference**

These flows bridge product intent, screen contracts, domain services and acceptance/E2E tests. They describe user outcomes, not implementation shortcuts.

## UF-01 — Controlled first-owner bootstrap

1. Production deployment has no project yet and bootstrap is explicitly open.
2. Intended first owner authenticates through supported Auth flow.
3. App validates bootstrap eligibility server-side.
4. Owner creates the single wedding project atomically and becomes active owner.
5. Sets optional locale/timezone/currency/date candidates/guest target/reference origin/criteria.
6. Bootstrap closes against unrelated project creation according to deployment policy.
7. Dashboard shows remaining secure setup, including partner invitation/MFA.

Unrelated public users cannot use the static app to create arbitrary production projects.

## UF-02 — Secure partner invitation and join

1. Owner A creates invitation for partner email.
2. App generates one-time random invitation token; only hash is persisted server-side.
3. Partner receives/open link and authenticates their own verified account.
4. Server checks token hash, expiry, revocation, intended verified identity and current membership state.
5. Acceptance atomically creates/activates one owner membership and marks invite accepted.
6. Replaying link is idempotent/invalid rather than duplicating membership.
7. Both partners see same project while retaining independent personal ratings/preferences.

## UF-03 — Project/date/origin setup

1. Owner opens Settings/Project.
2. Adds zero or several candidate dates.
3. Selects one date when decided through protected transition.
4. Adds one or more private reference origins for travel comparisons.
5. Selects a default origin.
6. Date/origin-dependent views recalculate or mark assumptions for review without rewriting historical evidence.

## UF-04 — Quick-add a venue

1. Global `+` → Venue.
2. Enter only required name and optional URL/location/code.
3. Duplicate detector warns about probable match.
4. Create incomplete venue.
5. Venue appears in Research state with missing critical information and no fake “No” for unknown facts.

## UF-05 — Research/enrich venue with evidence

1. Open venue.
2. Add space dimensions/capacity and criteria such as external caterer/rain plan.
3. Add one or more observations with source/date/evidence level.
4. Attach remote image/source URL or archive private photo deliberately.
5. Conflicting credible observations are preserved.
6. Retained fact/compatibility explains conflict/current choice.
7. Missing/stale count updates from authoritative inputs.

## UF-06 — Compare venue access from several origins

1. Add Paris/home/family reference origins.
2. Record or obtain route observations per origin/mode.
3. Compare venues with default-origin summary and TGV/transfer facts.
4. Change default origin.
5. Derived summary changes; historical route observations remain attached to their original origin/mode.

## UF-07 — Venue quote and follow-up

1. Request venue quote and record interaction.
2. Linked task enters `waiting_external` with follow-up date.
3. No reply by follow-up → Dashboard surfaces follow-up as actionable.
4. Record reply, attach versioned quote/source and offer components/tax treatment.
5. Waiting state resolves; budget scenario can reference offer without rewriting historical quote.

## UF-08 — Venue visit offline

1. Mark venue `Available offline` before visit.
2. App prepares relevant venue/spaces/criteria/contact/access/tasks/media previews.
3. Device loses network.
4. Partner adds notes, measurements, fact observations, personal rating and local photo.
5. Close/reopen PWA; local work remains pending.
6. Reconnect/re-auth if needed.
7. Safe mutations sync; semantic conflicts are isolated; photo uploads separately.

## UF-09 — Compare/finalize venue decision

1. Select 2–5 finalists.
2. Compare blocking status before weighted score, cost/date/access/missing data and both partner ratings.
3. Create require-both joint decision.
4. Each partner approves same selected venue.
5. Finalize online with current approval/revision validation.
6. Alternatives remain as history/fallbacks.
7. Selected venue/date can update active scenario/planning emphasis and suggest dependent tasks, never silently sign a contract.

## UF-10 — Contract version and readiness review

1. Attach quote/contract document to venue/vendor/offer.
2. Review factual checklist: parties/date/location/price/tax/payment/cancellation/postponement/service scope/capacity/caterer/music/access etc.
3. Missing/contradictory checks link to source/fact/task for follow-up.
4. Receive revised document; create new version superseding prior one.
5. Prior review remains historical; new version does not silently inherit version-specific confirmations.
6. “Ready for couple review/signature” is planning status only, never legal advice/validity certification.

## UF-11 — Inbox quick capture and conversion

1. From any screen capture text/link/file reference with minimal friction, including offline.
2. Inbox retains author/time/original content.
3. Later classify as task, venue/vendor candidate, document link or other supported target.
4. Conversion performs duplicate/context checks and creates/links canonical target.
5. Retrying conversion does not duplicate target.
6. Original capture provenance remains accessible.

## UF-12 — Import existing guest Excel

1. Select XLSX.
2. App detects workbook/domain and parses locally.
3. Map columns; optionally reuse saved mapping profile.
4. Preview normalized values/categories/duplicates/errors.
5. Ambiguous same-name people require explicit resolution.
6. Apply online transaction.
7. Guest statistics match expected reference values.
8. Reimport identical file does not duplicate people.

## UF-13 — External research round-trip

1. Export missing/stale venue facts as canonical JSON.
2. External research completes observations/sources with stable external IDs.
3. Import returned JSON.
4. App matches parent-scoped IDs correctly (same child ID may exist under different parent).
5. Stronger existing evidence is protected; conflicts are previewed.
6. Apply valid additions with provenance.

## UF-14 — Named budget scenarios

1. Create scenarios such as “S29 · 175 guests · date A” and “S32 · 195 guests · date B”.
2. Link applicable venue/vendor offers/components and tax semantics.
3. Compare totals, cost per guest, deposits and uncertainty.
4. Activate one scenario for current operational planning.
5. Change one scenario assumption.
6. Only that scenario's derived outputs recalculate; other scenarios/historical quotes/contracts remain unchanged.

## UF-15 — Record payment/refund safely

1. Open contracted budget item/payment schedule.
2. Record payment with amount/type/date/evidence.
3. If offline, item is explicitly pending and projected locally, not cloud-confirmed.
4. Server validates revision/invariants on sync.
5. Paid/remaining/cash-flow update exactly.
6. Later partial refund/deposit return is separate linked cash movement, not hidden negative price.

## UF-16 — Guest RSVP and structured seating

1. Manage household/individual RSVP/probability.
2. Open Seating.
3. Create sections/tables/capacities.
4. Assign guests; app prevents duplicate active assignment and flags over-capacity/unassigned.
5. RSVP changes mark seating review where needed; they do not silently erase assignment.
6. Export table/section/alphabetical seating list.
7. Same workflow remains keyboard/mobile accessible without graphical drag/drop.

## UF-17 — Planning milestones and day-of timeline

1. Set/confirm wedding date.
2. Relative milestones recalculate; fixed contractual deadlines stay fixed.
3. Open Event Timeline.
4. Add ceremony/cocktail/dinner/dancing/end items with local times/day offsets, venue/space, vendors/responsibility.
5. Add dependencies and resolve invalid cycles/order.
6. After-midnight item uses next-day offset correctly.
7. Generate frozen distribution snapshot.
8. Later live edit does not mutate already exported snapshot.

## UF-18 — Global search

1. Enter query from authenticated shell.
2. Search authorized venues/vendors/guests/tasks/decisions/document metadata/Inbox/tags within defined scope.
3. Results respect archive/deletion/privacy and deep-link safely.
4. Offline mode clearly searches only cached subset.
5. Search query/navigation never exposes unnecessary private guest/project data in public URLs.

## UF-19 — Joint weekly review

1. Open Dashboard/review surface.
2. Review blockers, decisions, external waits, payments, milestone readiness and meaningful partner changes since own activity cursor.
3. Open next action explanation.
4. Decide/reassign/update items.
5. Dashboard recomputes from source state without manually editable progress/summary truth.

## UF-20 — Safe logout/project transition

1. Owner requests logout or switches account/project context.
2. App stops realtime/new sync and checks pending work.
3. If pending exists, user syncs, exports recovery data, or explicitly discards where allowed.
4. Visible old-project data clears before new identity/project renders.
5. Once safe, private project cache is purged according to policy.
6. Old cached data never grants cloud access after membership/session revocation.

## UF-21 — Backup, encrypted backup and restore

1. Ensure project is synchronized/complete for authoritative full backup.
2. Export `.mariage` plain or password-protected version.
3. Validate manifest/checksums; encrypted container authenticates decryption.
4. Wrong password/tamper fails before mutation.
5. Restore into controlled empty/recovery target online.
6. Migrate supported old schema if needed.
7. Compare semantic project contents and binaries.
8. Production source remains unchanged unless explicit restore/cutover command occurs.

When only cached data is available offline, generate at most a clearly labeled local recovery export, not a “verified full project backup”.

## UF-22 — Permanent project deletion

1. Owner initiates critical deletion.
2. App recommends/validates backup option.
3. Requires recent strong authentication/MFA.
4. Shows explicit high-impact confirmation.
5. Server authorizes and purges project-scoped DB/Storage safely.
6. Downloaded backups remain outside application control and are not falsely claimed deleted.

## UF-23 — Free-tier quota pressure

1. Storage usage approaches safety margin.
2. Owner tries large nonessential photo upload.
3. App warns/defer/blocks large upload before essential service is threatened.
4. RSVP/task/payment/structured edits continue.
5. No automatic paid upgrade or open public project creation path exists.

## UF-24 — Source-of-truth cutover

1. V1 release/security/backup gates are green.
2. Import/reconcile current venues.
3. Import/reconcile guest spreadsheet/statistics.
4. Import/reconcile initial vendors and financial references.
5. Both owners test supported devices/offline flow.
6. Produce/verify recovery backup.
7. Archive legacy files as read-only references.
8. Both owners explicitly accept Mariage OS as operational source of truth.

## Traceability rule

Each critical flow maps to one or more Given/When/Then acceptance scenarios plus lower-level tests. A V1 feature lacking an end-to-end workflow where one is needed is a final-review finding, not something to improvise during coding.
