# Business Dependency and Invalidation Graph

Status: **Normative V1 derived-data/invalidation contract**

Mariage OS avoids duplicate manual truth. When authoritative input changes, every dependent value/view is recomputed or explicitly invalidated/reviewed.

## Effect classes

Every dependency edge is one of:

- **AUTO_RECOMPUTE** — deterministic derived result.
- **MARK_REVIEW** — prior human/external assessment may no longer apply.
- **RESELECT_APPLICABILITY** — choose which dated/package/source data applies; do not rewrite history.
- **SUGGEST_ACTION** — user follow-up/decision may be needed.
- **NO_HISTORICAL_MUTATION** — historical records stay unchanged.

A derived/cache value that cannot prove current dependencies/version is stale and must not appear authoritative.

---

## Project/wedding date

### Candidate date options

`wedding_date_options` influence:

- venue availability comparison;
- dated venue/vendor offer applicability;
- budget scenario selectable date;
- date-specific planning notes.

Adding/removing a candidate does not rewrite historical offers/availability observations.

### Selected canonical wedding date

`projects.wedding_date` influences:

- countdown/current phase;
- relative milestone absolute dates;
- active/default offer applicability;
- availability relevance;
- active/default budget scenario assumptions where configured;
- payment/deadline urgency presentation;
- freshness urgency;
- event timeline calendar date;
- date-aware route/weather/logistics review flags where relevant.

Changing it:

- AUTO_RECOMPUTE countdown/relative milestones/phase;
- RESELECT_APPLICABILITY offers/availability;
- MARK_REVIEW date-sensitive human assumptions;
- NO_HISTORICAL_MUTATION to quotes/contracts/observations/fixed deadlines.

Fixed contractual due dates remain fixed unless explicitly edited from new evidence.

---

## Guest population

Guest records, RSVP and probabilities influence:

- confirmed guest count;
- expected attendance;
- cumulative priority statistics;
- active/named budget scenario outputs when scenario uses derived guest basis;
- per-guest/per-adult/per-child costs;
- venue capacity warning;
- two-dance-area suitability review threshold when assessment depends on headcount;
- seating unassigned/assigned counts;
- transport/accommodation estimates.

Changing a guest:

- AUTO_RECOMPUTE guest statistics and affected variable planning totals;
- MARK_REVIEW human venue suitability if stored assessment context no longer matches;
- NO_HISTORICAL_MUTATION signed quote/contract quantities.

A manually fixed scenario guest-count override remains separate from computed expected attendance.

---

## Venue facts/spaces/criteria

Changes to venue space dimensions/capacity or blocking facts influence:

- compatibility blocking status;
- weighted score;
- missing-information/completeness;
- compare ordering/filtering;
- final-review warnings;
- venue-linked decision context.

Criterion priority/evaluation-rule changes influence all compatibility outputs for targets using that definition but do **not** rewrite facts/observations.

Changing `external_caterer_allowed` from unknown/true to known false with blocking rule immediately causes blocking FAIL regardless of aesthetic score.

---

## Member ratings/favorites

Member-specific rating/favorite changes influence:

- that member's displayed personal opinion;
- couple agreement/difference derived indicators;
- personal filters/favorites views.

They do not alter shared factual criteria or the other member's rating.

---

## Reference origins and access routes

`project_reference_origins` and `venue_access_routes` influence:

- access summaries;
- default-origin driving duration/distance convenience values;
- compare access columns;
- logistics scoring where configured.

Changing the default origin:

- AUTO_RECOMPUTE derived default-origin summaries from existing matching route observations;
- MARK_REVIEW if no current observation exists for new origin/mode;
- NO_HISTORICAL_MUTATION old route observations.

Changing an address/coordinate may invalidate route observations that were tied to previous location context rather than silently rewriting them.

---

## Venue selection

Final venue decision influences:

- active/focused venue context;
- default budget scenario venue assumption where configured;
- applicable venue pricing;
- vendor compatibility review;
- access/logistics focus;
- event timeline venue/space planning suggestions;
- dependent milestone/task readiness.

Selection may unlock/suggest work. It never silently signs vendors, deletes alternatives or turns a candidate quote into a contract.

---

## Vendor/offer selection

Selected vendor/package/offer influences:

- active scenario components;
- quoted/contracted budget context;
- payment schedule when explicitly derived/created;
- operational tasks;
- contract readiness;
- event timeline vendor assignments/inclusion assumptions.

Offer supersession may change applicability but historical versions remain.

---

## Budget scenarios

Scenario inputs include date, venue, guest count, selected offers/components and assumptions.

Changing a scenario input:

- AUTO_RECOMPUTE scenario totals/cost-per-guest/cash assumptions where deterministic;
- MARK_REVIEW external prices lacking applicable offer;
- NO_HISTORICAL_MUTATION other named scenarios and actual/contracted records.

Changing which scenario is active changes dashboard/planning emphasis; it does not delete or mutate inactive scenarios.

---

## Payments

Payment/refund/deposit movements influence:

- paid amount;
- contractual remainder;
- currently due/overdue;
- refundable cash immobilized;
- 30/60/90-day cash flow;
- payment-linked task suggestions/status where linked.

Derived financial totals are never independently editable.

---

## Tasks/decisions/milestones

Task/decision states influence:

- blockers;
- next action;
- dashboard queues;
- milestone readiness/completion rules;
- weighted progress.

Milestone completion/dependency changes influence progress and phase readiness. Completing many low-weight tasks cannot substitute for incomplete high-weight milestones.

Reopening a locked/final decision may MARK_REVIEW downstream assumptions rather than silently undoing contracts/payments.

---

## Seating

Guest/section/table/assignment changes influence:

- assigned/unassigned counts;
- table occupancy/capacity warnings;
- section counts;
- seating completeness;
- seating export.

Changing a table capacity AUTO_RECOMPUTES warnings. Deleting a table with assignments requires explicit resolution/reassignment; it cannot silently orphan assignments.

RSVP changes may SUGGEST_ACTION/mark seating review. They do not automatically delete the guest's assignment unless a documented command is chosen.

---

## Event timeline

Timeline item time/day-offset/dependency changes influence:

- chronological order;
- overlap/warning views where implemented;
- dependency validity;
- vendor/location agenda exports;
- planning completeness.

Changing selected wedding date changes the timeline's calendar date context while preserving local time/day-offset structure.

A frozen timeline export/snapshot has NO_HISTORICAL_MUTATION when live timeline later changes.

---

## Documents/contracts

New document versions/supersession influence:

- current-document display;
- contract-readiness evidence;
- linked quote/offer confidence/context.

Superseding a quote/contract never deletes the prior document.

Contract readiness is derived from checklist/evidence states; it is not equivalent to legal validity.

---

## Facts/evidence freshness

New observation/source, source status, retained-value resolution or freshness policy influences:

- retained fact state/value where explicit resolution rule applies;
- conflict state;
- stale/missing-information counts;
- compatibility/completeness;
- suggested verification actions.

Broken source URL does not delete the historical observation.

---

## Inbox conversion

Converting an Inbox item creates/links a canonical target and marks conversion metadata. Retrying same conversion must be idempotent. Editing/deleting the target does not silently erase original capture provenance.

---

## Import/rollback

An applied import can affect multiple source entities and therefore their derived dependents. After commit/rollback:

- recompute deterministic dependents;
- invalidate human/external assumptions as appropriate;
- do not use rollback to overwrite legitimate later edits;
- maintain provenance.

---

## Project criteria/locale/timezone changes

- locale changes presentation/parsing defaults, not canonical stored date/money values;
- timezone changes future display/conversion context and may MARK_REVIEW local-date-time assumptions;
- currency change never silently converts existing financial records without explicit conversion semantics;
- criterion weight/priority/rule changes recompute compatibility only.

---

## Circular dependency prohibition

Authoritative input cannot be automatically changed by a recommendation derived from itself.

Forbidden example:

`guest_count → catering_total → recommended_guest_count → automatic guest_count mutation`.

Recommendations require explicit user action.

---

## Explainability

Every score/total/progress/next-action indicator exposes principal source inputs/rules. Critical calculations are implemented as deterministic engines where practical.

## Required tests

- every primary source change updates/invalidate all documented dependents;
- historical observations/quotes/contracts/snapshots remain unchanged where required;
- date candidate vs selected-date behavior is distinct;
- scenario switching does not mutate inactive scenarios/actuals;
- origin switch preserves old route observations;
- criterion rule change cannot rewrite fact values;
- guest changes update stats/seating warnings without unsafe assignment deletion;
- timeline date/time invalidation is correct across after-midnight cases;
- derived caches cannot remain authoritative with stale dependency versions.
