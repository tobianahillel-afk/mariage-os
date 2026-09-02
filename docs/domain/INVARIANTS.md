# Domain Invariants

Status: **Normative V1 invariants**

These rules hold regardless of UI, import, offline queue, direct API call or client behavior. Prefer database constraints/RLS/commands where they can enforce a rule more strongly than frontend validation.

## Project / identity / authorization

1. Every project-scoped entity belongs to exactly one project.
2. Ordinary mutation cannot change an entity's `project_id`.
3. Ordinary relational references cannot connect rows from different projects.
4. Polymorphic links validate target existence/type/same-project at database boundary.
5. A user accesses project data only while active authorized membership exists.
6. The last active owner cannot be removed through ordinary membership mutation.
7. V1 production initial project can be created only once during controlled bootstrap.
8. Partner invitation acceptance requires valid unexpired/unrevoked token + matching verified authenticated email.
9. Invitation token can produce at most one semantic membership; replay is idempotent/denied safely.
10. Internal UUIDs are never reused.

## Date/time

11. At most one active wedding-date option is `selected` per project.
12. Numeric weekday mapping is always 0=Sunday ... 6=Saturday.
13. After-midnight operational times preserve day offset; `01:00 dayOffset=1` never sorts before `23:00 dayOffset=0`.
14. Fixed contractual deadlines do not move merely because planning wedding date changes.

## Venue/vendor

15. Rejected venue/vendor remains recoverable/history-visible until explicit retention/purge policy removes it.
16. A contractually confirmed selection cannot be silently replaced by import/score recalculation.
17. Capacity identifies scope (marketing venue vs physical space/configuration) when known.
18. Blocking criterion failure/conflict/unknown cannot be hidden by high weighted score.
19. A criterion used for compatibility has a valid evaluation rule; missing/invalid rule cannot silently PASS.
20. Context-specific route observations remain associated with their origin/mode; a different origin does not overwrite them.

## Facts/evidence

21. `unknown`, known-false, `not_applicable` and `conflict` are distinct.
22. Fact JSON value matches referenced definition value type and validation constraints.
23. Imported weaker evidence cannot silently replace stronger contractual/confirmed retained evidence.
24. Evidence observations remain historical after supersession subject to retention/project destruction.
25. One observation may cite multiple sources without duplicating the observation.
26. Contradictory credible observations do not silently collapse without documented retained-value resolution.
27. Derived values are never manually edited as independent authoritative facts.

## Partner opinions

28. Each member owns their own personal preference/rating row; one partner cannot mutate the other's rating/approval identity.
29. Shared objective facts and personal opinions remain distinct data.

## Guests / seating

30. An active guest belongs to at most one active household in one project.
31. Attendance probability is within [0,1].
32. RSVP and probability are distinct concepts.
33. Confirmed attendance calculations follow explicit RSVP precedence.
34. Priority values remain in configured project range.
35. Household deletion cannot silently orphan active guests.
36. A guest has at most one active seating assignment.
37. Seating guest/table/section references remain same-project.
38. Final seating readiness cannot PASS while a required attending guest is unassigned, duplicate assignment exists or table is over capacity.
39. RSVP change never silently destroys seating history; it invalidates/reviews assignment as appropriate.

## Budget/scenarios/payments

40. Money uses exact integer-minor-unit semantics.
41. Currency is explicit/safely inherited; cross-currency arithmetic is never implicit.
42. Multiple named scenarios may coexist; at most one is operationally `active`.
43. Scenario overrides never overwrite base/contracted budget-item truth.
44. Refundable security deposits are distinguishable from final expected wedding cost.
45. Payment amounts are non-negative; financial direction comes from payment type.
46. Refund/return links cannot create a refund exceeding valid refundable amount without explicit credit semantics.
47. `remaining_to_pay`, paid totals and cash-flow are derived, not manually maintained.
48. Contracted/paid truth cannot be silently downgraded by weaker import.
49. Unknown tax treatment remains unknown; system never silently assumes included/excluded tax.

## Tasks/decisions/Inbox

50. `waiting_external` task identifies awaited party/reason.
51. Blocked task identifies dependency/reason.
52. Task dependency graph has no self-dependency/cycle.
53. Completing already-completed task is idempotent.
54. Joint decision cannot finalize before required owner approvals and valid result.
55. A member cannot submit/change another member's approval identity.
56. Final/locked decision preserves rationale/history through reopen.
57. Inbox conversion is idempotent and cannot create duplicate target on retry.

## Planning/timeline

58. Milestone dependency graph has no self-dependency/cycle.
59. Derived milestone progress is reproducible from milestone source state/weights.
60. Event-timeline end cannot occur before start after applying day offsets.
61. Event-timeline dependencies cannot create invalid cyclic ordering.
62. Frozen/exported operational timeline is historical snapshot; later live edit cannot silently mutate it.

## Files/media/tags

63. Media/document is not committed until required storage/reference state is valid.
64. Exact duplicate file bytes may deduplicate storage but relationships/metadata remain correct.
65. Original user media is never silently replaced by compressed derivative.
66. Remote URL content is never trusted executable content.
67. Derivative/media/document/tag links cannot cross projects.

## Import/export

68. Reimporting same stable canonical objects does not duplicate semantic entities.
69. Nested external IDs are parent-scoped; same nested ID under different parents does not collide.
70. Missing import rows/properties never mean deletion by default.
71. Destructive replacement requires explicit scope/preview/confirmation.
72. Failed atomic critical import leaves project unchanged.
73. Every applied import is traceable to import session.
74. Rollback never silently overwrites later legitimate changes.
75. Saved mapping profile belongs to user/project and cannot leak mappings/data to another project.

## Sync/offline

76. Stale reconnect cannot silently overwrite newer confirmed cloud data.
77. Pending local mutations survive transient network loss/app restart where supported storage remains available.
78. Same operation ID cannot create duplicate side effects.
79. True same-field semantic conflict is deterministically resolved by documented rule or surfaced.
80. Session expiry does not delete pending local work; sync resumes only after reauth + membership validation.
81. Safe logout cannot silently discard pending work and removes private local cache after pending-work resolution.

## Deletion/recovery

82. Ordinary deletion is soft first for recoverable entities.
83. 30-day trash threshold makes an entity purge-eligible; exact timed background purge is not assumed.
84. Permanent project deletion requires strong auth/explicit confirmation and cannot be emulated by owner removal.
85. Purge cannot leave unauthorized orphan Storage indefinitely.
86. Restore/import preserves project-level relational integrity.
87. Corrupt/tampered encrypted backup never partially restores.
88. Unsupported future backup/schema never silently loses fields while claiming success.

## Free-tier / deployment

89. Unrelated public user cannot create another production wedding project after bootstrap lock.
90. Quota pressure blocks/degrades nonessential large media before essential structured project edits.
91. Application never automatically activates a paid plan/upgrade.

Every invariant requires automated verification at the narrowest effective layer; security/data-integrity invariants require direct DB/RLS/adversarial tests in addition to UI tests.