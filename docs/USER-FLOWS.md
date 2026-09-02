# Critical User Flows

These flows define end-to-end behavior that later maps to acceptance/E2E tests.

## UF-01 — First project setup

1. Owner authenticates.
2. Creates/opens wedding project.
3. Sets locale/timezone/currency.
4. Enters target date/range, guest target and budget target if known.
5. Defines/accepts initial blocking criteria.
6. Invites partner.
7. Dashboard shows setup progress and next action.

## UF-02 — Partner joins

1. Partner follows valid invitation.
2. Authenticates own account.
3. Joins exact project as owner.
4. Sees shared project but keeps own ratings/preferences.
5. Other owner sees membership/activity update.

## UF-03 — Quick-add a venue

1. From any screen tap `+` → Venue.
2. Enter only name and optional URL/location.
3. Duplicate detector checks probable matches.
4. Create incomplete venue.
5. Venue appears in Research state with missing-info guidance.

## UF-04 — Research/enrich venue

1. Open venue.
2. Add area/capacity/external-caterer/etc.
3. Attach sources with confidence/date.
4. Add external photo URLs/private photos.
5. Missing-critical count decreases.
6. Contradictory source produces explicit conflict, not silent replacement.

## UF-05 — Venue quote follow-up

1. Mark quote requested.
2. Task/interaction becomes waiting external.
3. No reply past follow-up date.
4. Dashboard suggests follow-up.
5. Record reply and attach quote.
6. Waiting item clears; budget/offer facts update.

## UF-06 — Venue visit offline

1. Mark venue available offline before trip.
2. Lose network.
3. Open visit mode.
4. Answer checklist/add notes/measurements/photos.
5. Close/reopen app; local data persists.
6. Reconnect.
7. Data syncs; conflicts isolated.

## UF-07 — Compare/finalize venue

1. Select 2–5 finalists.
2. Compare blocking criteria, cost, access, missing info and partner ratings.
3. Create/complete joint decision.
4. Both approve selected venue.
5. Alternatives archive as fallbacks.
6. Active budget/planning updates.
7. Contract/deposit tasks become available/proposed.

## UF-08 — Import existing guest Excel

1. Select XLSX.
2. App detects guest workbook.
3. Map columns and preview.
4. Review duplicates/categories/errors.
5. Apply import.
6. Statistics reproduce expected priority/probability behavior.
7. Reimport same file produces no duplicate people.

## UF-09 — ChatGPT/research round-trip

1. Export missing venue facts canonical JSON.
2. External research completes facts/sources.
3. Import returned JSON.
4. App matches external IDs.
5. Weaker/conflicting facts are reviewed.
6. Valid new facts merge with provenance.

## UF-10 — Budget scenario

1. Create/select scenario date/venue/guest count.
2. Applicable offers and variable costs calculate.
3. Compare minimum/probable/high.
4. Change guest count/date.
5. Deterministic costs update; assessments needing review are flagged.

## UF-11 — Record payment

1. Open budget item/payment schedule.
2. Mark installment paid with amount/date/evidence.
3. Paid/remaining/cash-flow update.
4. Payment task completes if linked.
5. Financial history preserved.

## UF-12 — Joint weekly review

1. Open couple review.
2. Review decisions, overdue/blocked work, external waits, upcoming payments and meaningful changes.
3. Make/reassign decisions/tasks.
4. Finish with a short updated action list.

## UF-13 — Backup/restore

1. Export validated `.mariage` backup.
2. Verify archive integrity.
3. In isolated recovery test, restore.
4. Migrate schema if needed.
5. Compare project semantics/files.
6. Production data remains untouched until explicit restore/cutover.

## UF-14 — Project deletion

1. Owner initiates critical deletion.
2. App recommends full backup.
3. Recent MFA/reauth required.
4. Strong confirmation.
5. Project data/storage are purged according to policy.
6. Previously downloaded backups are explicitly outside app control.

Each critical flow must eventually have Given/When/Then acceptance cases and automated coverage at the appropriate layers.
