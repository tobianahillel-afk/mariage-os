# Critical Acceptance Scenarios

Status: **Normative behavioral acceptance suite outline**

These scenarios define high-value end-to-end behavior in Given/When/Then form. Implementation must turn them into automated tests and/or documented manual release evidence as appropriate.

They do not replace lower-level unit/integration/security tests.

---

## ACC-001 — Two owners collaborate on the same project

**Requirements:** PRD-001, IAM-007, SYN-003

Given owner A has created a project and invited owner B
When owner B accepts the valid invitation
And owner A creates a venue
And owner B opens the venue list
Then both owners see the same venue project data
And their individual ratings remain independent
And no unrelated project data is visible.

## ACC-002 — Unrelated user cannot access the project

**Requirements:** IAM-002, IAM-004, SEC-003, QLT-004

Given user C is authenticated but is not a project member
When user C directly requests a known venue UUID from project A through the backend API
Then the request returns no authorized project data
And user C cannot update or delete it
And the denial does not depend on frontend route hiding.

## ACC-003 — Offline venue visit survives restart

**Requirements:** SYN-001, SYN-010, PWA-004, VEN-013

Given venue S32 is pinned for offline use
And the device has synchronized its visit checklist
When network connectivity is removed
And the partner adds a note, a measurement and a photo reference
And closes/reopens the PWA
Then the structured note and measurement remain visible locally as pending
And the unsynced photo is not silently discarded
When network/authentication returns
Then the changes synchronize exactly once or produce an explicit conflict/error requiring action.

## ACC-004 — Same-field collaborative conflict is not lost

**Requirements:** SYN-005

Given both partners start from venue revision 12 where `tables_included=unknown`
When partner A confirms `20 tables`
And partner B, while offline from revision 12, records `22 tables`
Then the application does not silently choose one value
And stores/presents an explicit conflict
And offers resolutions such as keep A, keep B, or mark to verify
And resolving it creates auditable new current state.

## ACC-005 — Independent changes merge

**Requirements:** SYN-006

Given both partners start from the same venue revision
When partner A adds an exterior photo
And partner B updates their personal rating
Then both changes survive synchronization without unnecessary conflict.

## ACC-006 — Session expiry never loses a local edit

**Requirements:** SYN-008, IAM-009

Given a partner is editing a venue and their cloud session expires
When the edit reaches durable local-save state
Then the app marks synchronization as requiring reauthentication
And retains the edit across reload
When the partner signs in again
Then the edit synchronizes or enters conflict resolution without requiring retyping.

## ACC-007 — Blocking venue criterion overrides aggregate score

**Requirements:** VEN-011, FAC-001

Given a venue has excellent aesthetic/logistics scores
But `external_caterer_allowed=false` and that criterion is blocking
When the comparison/readiness screen is rendered
Then the venue is visibly incompatible/blocking
And an aggregate percentage cannot present it as fully compatible.

## ACC-008 — Unknown is not No

**Requirements:** FAC-001

Given `air_conditioning` has never been verified
When the venue detail is opened
Then it is displayed as Unknown/To verify
And not as No
And it can produce a missing-information action if the criterion priority requires it.

## ACC-009 — Conflicting evidence is retained

**Requirements:** FAC-002, FAC-003, FAC-006

Given the official website observation says room area 300 m²
And a directory observation says 250 m²
And both observations are imported/stored
Then both observations remain visible with sources
And the system can retain 300 m² using evidence rules/user review
And the 250 m² observation is not deleted.

## ACC-010 — Weak import does not overwrite contractual truth

**Requirements:** FAC-004, IMP-010

Given `external_caterer_allowed=true` is confirmed by a signed contract
When an older CSV import contains `external_caterer_allowed=false` from an unsourced directory
Then preview flags the discrepancy
And the contractual retained value is not silently replaced
And the imported value may be retained only as a weaker observation/provenance according to merge rules.

## ACC-011 — Repeat canonical import is idempotent

**Requirements:** IMP-003, IMP-006

Given canonical venue JSON from namespace X with external ID `venue-s32` has already been applied
When the identical file is imported again
Then no duplicate venue/space/source is created
And the preview reports unchanged/no-op content or the previously imported file hash.

## ACC-012 — Missing import row does not delete

**Requirements:** IMP-002

Given the project contains 200 guests
When an XLSX import contains only 180 of them
Then the other 20 remain unchanged unless the user enters a separately specified destructive reconciliation flow
And ordinary preview never marks them for deletion merely because they are absent.

## ACC-013 — Ambiguous guest names do not auto-merge

**Requirements:** GST-011, IMP-009

Given two existing guests can legitimately share the name `Alex Example`
When a new spreadsheet row contains only that same name without stable external ID/contact/household evidence
Then the importer requires user duplicate resolution or creates only according to explicit choice
And does not auto-merge by name.

## ACC-014 — Import preview protects production state

**Requirements:** IMP-001

Given a valid XLSX import has been parsed and mapped
When the user is reviewing the preview
Then project canonical data is unchanged
And the UI explicitly says no data has been changed yet
Until the user confirms commit.

## ACC-015 — Failed atomic import does not half-apply critical data

**Requirements:** IMP-012

Given an import transaction is designed as atomic
When a DB/invariant failure occurs partway through commit
Then none of that transaction's structured changes are left partially applied
And the import record reports failure with safe diagnostics.

## ACC-016 — Intelligent rollback protects later manual edits

**Requirements:** IMP-012

Given an import changed venue price from unknown to 9,000 EUR
And later a partner manually changed it to 9,500 EUR from a new quote
When the old import is rolled back
Then rollback does not blindly restore unknown over the later 9,500 value
And reports that the affected field changed after import and requires reconciliation.

## ACC-017 — Guest expected/cumulative statistics are reproducible

**Requirements:** GST-003, GST-004, GST-005

Given a synthetic guest dataset with known priorities and 0/25/75/100% attendance probabilities
When expected and cumulative-priority statistics are calculated
Then results exactly match independently specified fixture expectations
And editing RSVP/probability updates derived views without editing another manual total field.

## ACC-018 — Guest-count scenario updates variable costs, not historical quotes

**Requirements:** FIN-005

Given a caterer quoted 110 EUR per person and a historical quote document exists for 175 guests
When scenario guest count changes from 175 to 185
Then the active scenario recalculates the variable estimate
And the historical 175-guest quote/document remains unchanged.

## ACC-019 — Refundable caution is not final cost

**Requirements:** FIN-004

Given a venue requires a 2,000 EUR refundable security deposit
When budget totals are shown
Then cash-flow can show 2,000 EUR leaving at its due date
But probable final cost excludes/refines it according to refundable-deposit semantics
And a later deposit return is represented as a return rather than negative hidden price.

## ACC-020 — Partial payment math is exact

**Requirements:** FIN-001, FIN-007, FIN-008

Given a contracted vendor amount of 9,500 EUR
And two paid installments of 2,000 EUR and 1,500 EUR
When the financial summary is computed
Then paid = 3,500 EUR and contractual remainder = 6,000 EUR exactly
Without floating-point rounding errors.

## ACC-021 — Joint decision requires both approvals

**Requirements:** DEC-002

Given a venue-selection decision requires both owners
When owner A approves S32 but owner B has not approved
Then the decision cannot be finalized as jointly approved
When owner B approves the same final option
Then finalize becomes available subject to other state rules.

## ACC-022 — Rejected venue remains searchable

**Requirements:** PRD-007, VEN-006

Given venue S34 is rejected with reason `interior too canteen-like`
When it is removed from the active shortlist
Then it remains findable in Rejected/history
And displays rejection reason/date/history
And can be restored without recreating a duplicate venue.

## ACC-023 — Waiting external is not personal overdue work

**Requirements:** TSK-002, VND-006

Given the couple requested a quote and is waiting on a venue
When the task enters `waiting_external`
Then Dashboard/Tasks show it under Waiting with follow-up timing
And do not present it as an unfinished actionable personal task before follow-up is due.

## ACC-024 — Next action is explainable

**Requirements:** TSK-004, PRD-003

Given one overdue blocking venue follow-up and several low-priority decorative tasks
When Dashboard selects a next useful action
Then the blocking/overdue follow-up ranks above decoration
And UI can explain the main ranking reason.

## ACC-025 — Map outage does not block venue data

**Requirements:** PWA-005

Given venue records are cached/available
When map tiles/provider fail
Then venue list/detail/access data remains usable
And Map displays a clear unavailable fallback rather than breaking navigation.

## ACC-026 — Private file access is project-isolated

**Requirements:** IAM-003, MED-010

Given a contract file belongs to project A
When a member of project B attempts direct Storage access using its known path/object ID
Then access is denied by backend policy
And no client-side URL obscurity is relied upon.

## ACC-027 — Interrupted media upload is not a valid file

**Requirements:** MED-009

Given a large photo upload is interrupted before completion
Then media metadata does not present it as Ready
And retry/cleanup is available
And orphaned partial state is cleaned according to storage policy.

## ACC-028 — Original photo remains immutable

**Requirements:** MED-004, MED-005

Given an original visit photo is archived
When a thumbnail/preview is generated
Then derivative has a separate object/metadata relationship
And original bytes/hash remain unchanged.

## ACC-029 — CSV formula injection is neutralized on export

**Requirements:** IMP-015

Given a user text value begins with spreadsheet formula-control characters
When exported to a CSV intended for spreadsheet use
Then export encodes/escapes it according to security policy so opening the file does not execute it as formula content.

## ACC-030 — Unsupported future backup is rejected safely

**Requirements:** BAK-006

Given the app supports backup schema 1–2
When a `.mariage` backup declares schema 5
Then restore stops before production mutation
And tells the user a newer app is required
And does not partially interpret the archive.

## ACC-031 — Backup restore reconstructs golden project

**Requirements:** BAK-001, BAK-004, BAK-009

Given the golden synthetic project contains venues, sources, guests, vendors, tasks, decisions, finances and documents/media metadata
When a complete supported backup is exported
And restored into an empty compatible project/test target
Then domain-semantic equality checks pass
And included binary checksums validate.

## ACC-032 — Corrupt backup file is detected

**Requirements:** BAK-004

Given one included media/document binary has been changed after backup creation
When integrity verification runs
Then checksum mismatch is reported before pretending the backup is healthy.

## ACC-033 — Production repository contains no wedding data or secret

**Requirements:** PRD-002, SEC-009, GST-009

Given CI/public-repo safety checks run
When fixtures/docs/source are scanned
Then production secrets and known private artifact patterns are absent
And tests use synthetic names/data only.

## ACC-034 — PWA update does not lose pending edit

**Requirements:** PWA-002, SYN-010

Given a pending local mutation exists
When a new service-worker/app version becomes available
Then update lifecycle does not silently destroy pending IndexedDB state
And after compatible reload the mutation remains pending/syncable.

## ACC-035 — Backend temporarily paused/unavailable

**Requirements:** OPS-006, SYN-009

Given the app has cached essential data
When Supabase is temporarily unavailable
Then the user can still view cached essentials
And eligible edits are saved locally/pending
And UI communicates cloud unavailability without raw backend jargon.

## ACC-036 — Storage quota pressure preserves essential work

**Requirements:** OPS-001, OPS-002, OPS-003

Given storage use is near configured free-tier safety threshold
When user attempts a large non-essential photo upload
Then the app warns/blocks/defer the media operation before a paid upgrade path
While still allowing essential structured edits such as RSVP/task/payment data.

## ACC-037 — Personal settings remain personal

**Requirements:** PRD-004

Given partner A customizes venue table columns and rating
When partner B opens their view
Then B's personal preferences/rating remain independent
And shared venue facts remain common.

## ACC-038 — Critical destructive project deletion requires strong safeguards

**Requirements:** IAM-009

Given an owner initiates permanent project deletion
Then the app requires explicit strong confirmation and recent strong authentication
And recommends a backup
And does not let a non-owner or stale unauthenticated session complete deletion.

## ACC-039 — Data date semantics survive DST/timezone boundaries

**Requirements:** domain date/time invariants

Given project timezone Europe/Paris and an event occurring after midnight
When stored/rendered around DST changes
Then civil wedding date and absolute audit timestamps follow documented semantics
And an event at 01:30 after the reception is not silently reassigned through browser-local timezone guessing.

## ACC-040 — No-context developer can bootstrap Lot 0

**Requirements:** QLT-001 / documentation readiness

Given a developer has only the repository
When they follow README/START-HERE/Lot 0 documentation
Then they can identify product scope, architecture, security constraints, test expectations, next implementation lot and deliberate deferred decisions without prior chat access.

---

# Release use

The V1 cutover evidence package should reference automated/manual evidence for all applicable critical scenarios. Additional scenarios are added when implementation reveals meaningful new failure modes.
