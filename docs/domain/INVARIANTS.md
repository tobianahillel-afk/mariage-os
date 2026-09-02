# Domain Invariants

These rules must hold regardless of UI path, import source, sync path or client behavior.

## Project and identity

1. Every project-scoped entity belongs to exactly one project.
2. Ordinary mutations cannot change an entity's `project_id`.
3. A user can access project data only while authorized membership exists.
4. The last project owner cannot be removed without an explicit project-destruction/ownership-transfer workflow.
5. Internal IDs are never reused.

## Venue/vendor

6. A rejected venue/vendor remains recoverable/history-visible until purge policy removes it.
7. A contractually confirmed selection cannot be silently replaced by an import or score recalculation.
8. Capacity values must identify their scope (venue marketing capacity versus specific space/configuration) when known.
9. A blocking criterion failure cannot be hidden by aggregate compatibility scoring.

## Facts/provenance

10. `unknown`, `false`, `not_applicable` and `conflict` are distinct states.
11. An imported weaker observation cannot silently overwrite stronger contractual/confirmed evidence.
12. A source observation remains historical even if a newer retained value supersedes it, subject to retention rules.
13. Contradictory observations do not silently collapse into a single value without a retained-value decision/policy.
14. Derived values are not manually edited as independent authoritative facts.

## Guests

15. An active guest belongs to at most one active household in one project.
16. Attendance probability is constrained to [0,1].
17. RSVP status and probability are distinct.
18. Confirmed operational attendance calculations follow explicit RSVP precedence rules rather than summing stale probabilities blindly.
19. Guest priority values must remain within configured project rules.
20. Deleting a household with active guests requires reassignment, cascade-to-soft-delete, or explicit resolution; it cannot orphan guests silently.

## Budget/payments

21. Money calculations use exact monetary semantics.
22. Currency is explicit or safely inherited from project context.
23. A payment is linked to a project and, where applicable, a budget/contractual item in the same project.
24. Refundable cautions are distinguishable from final expected cost.
25. Payment/refund semantics are explicit; unexplained negative ordinary payments are forbidden.
26. `remaining_to_pay` is derived from authoritative commitments/payments, not manually maintained independently.
27. A contracted amount cannot be silently modified by an unrelated import after signature without explicit review/history.

## Tasks/decisions

28. A `waiting_external` task identifies what/who is awaited.
29. A blocked task records a reason or dependency.
30. A joint decision cannot become final before required approvals are satisfied.
31. Decision history/rationale is preserved when a decision is reopened.
32. Completing the same task twice is idempotent.

## Files/media

33. A database media/document record is not considered committed until its required storage/reference state is valid.
34. Exact duplicate uploaded files may be deduplicated by hash but metadata relationships remain correct.
35. Original user media is never silently replaced by a recompressed derivative.
36. Remote URLs never become trusted executable content.

## Import/export

37. Reimporting the exact same canonical import must not create duplicate semantic entities.
38. Missing rows in an import never mean deletion by default.
39. Destructive replacement requires explicit scope/preview/confirmation.
40. A failed atomic critical import leaves the project unchanged.
41. Every applied import is traceable to an import session.
42. Rollback cannot silently overwrite later legitimate user edits.

## Sync/offline

43. Confirmed cloud data is not silently lost because another device reconnects with stale state.
44. Pending local mutations survive transient network failure and app restart where platform persistence permits.
45. Retried operations with the same operation ID do not create duplicate side effects.
46. A true same-field conflict is either deterministically resolved by documented semantics or surfaced.

## Deletion/recovery

47. Ordinary deletion is soft first for recoverable entities.
48. Permanent project deletion requires explicit high-assurance confirmation.
49. Purging structured entities must not leave unauthorized/orphan private storage indefinitely.
50. Restore/import operations must preserve project-level referential integrity.

All invariants require automated tests at the narrowest effective layer, with database constraints/policies used where they provide stronger guarantees than frontend checks.
