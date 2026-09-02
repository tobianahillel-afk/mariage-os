# Business Dependency Graph

Status: **Normative derived-data and invalidation contract**

Mariage OS must avoid duplicate manual truth. When source inputs change, derived views are recomputed or explicitly marked stale according to this dependency graph.

## Core dependencies

### Wedding date

`wedding_date` influences:

- countdown;
- current planning phase;
- milestone absolute dates;
- venue offer/date matching;
- availability relevance;
- payment deadline context;
- stale-data urgency;
- event timeline dates.

Changing the wedding date does **not** rewrite historical quotes or confirmations. It changes which observations/offers are currently applicable and may invalidate assumptions.

### Guest counts

Guest records/RSVP/probability influence:

- confirmed guest count;
- expected attendance;
- cumulative priority views;
- variable catering scenarios;
- venue capacity warnings;
- table-count estimates where configured;
- transport/accommodation estimates.

A change in guest count never rewrites signed contractual quantities automatically. Instead, dependent scenarios/recommendations recalculate and contracted quantities may be flagged for review.

### Venue selection

Final venue decision influences:

- active venue scenario;
- applicable venue pricing;
- venue-specific vendor compatibility;
- access/logistics planning;
- map/final location focus;
- follow-up tasks unlocked by venue/date.

Selecting a venue may **suggest/unblock** dependent work; it must not silently contract vendors or delete alternatives.

### Vendor selection

Final vendor selection influences:

- active quoted/contracted financial scenario;
- payment schedule;
- linked final documents;
- operational tasks;
- package/inclusion assumptions.

### Budget inputs

Budget source values influence:

- category total;
- minimum/probable/max scenario;
- cost per guest;
- committed amount;
- paid amount;
- remaining contractual amount;
- upcoming cash-flow views.

Derived totals are never authoritative editable source fields.

### Task/decision states

Task/decision states influence:

- blockers;
- next-action recommendation;
- dashboard counts;
- milestone readiness;
- weighted progress.

Completing many low-impact tasks must not outweigh incomplete critical milestones.

## Invalidation model

When a source changes, every dependent result must be classified as one of:

- **recompute immediately** — deterministic cheap derived value;
- **mark stale/review needed** — output involves external/contractual assumption;
- **no action** — historical observation remains historical;
- **suggest follow-up** — user decision/action is needed.

Examples:

| Change | Effect |
|---|---|
| RSVP Yes→No | recompute confirmed counts and variable scenarios |
| guest target 175→190 | recompute venue capacity warnings and budget scenarios |
| wedding date changed | re-evaluate offer applicability; do not modify quote history |
| external caterer fact changes to false | mark venue blocking compatibility immediately |
| signed venue contract | lock/raise evidence strength; update committed budget |
| venue capacity source becomes stale | retain value, mark for revalidation if critical |

## Circular-dependency prohibition

Authoritative source fields must not depend on derived results that themselves depend on those fields.

Example prohibited model:

`guest_count → catering_total → suggested_guest_count → guest_count`.

Recommendations may reference derived values but require explicit user action to change source inputs.

## Explainability

Every user-facing calculated score/total/progress indicator must be able to expose its principal source inputs and rules. The implementation should keep calculation functions pure/deterministic where practical to make this testable.

## Test requirements

- changing each primary source input updates all deterministic dependents;
- historical source observations are unchanged;
- contractual quantities are not silently mutated;
- stale/review flags are emitted where specified;
- no derived field can diverge through direct editing;
- dependency recalculation is deterministic for identical source state.
