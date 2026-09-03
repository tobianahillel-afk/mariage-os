# V1 State Machines and Protected Transitions

Status: **Normative domain lifecycle contract**

Statuses are domain state, not decorative labels. A stored lifecycle value is valid only when its transition, preconditions, side effects, authorization, history and offline behavior are defined.

Not every status requires a PostgreSQL enum; V1 normally uses text + CHECK plus TypeScript unions. Critical transitions use domain commands rather than unrestricted generic field editing.

---

## 1. Venue/vendor candidate lifecycle

Conceptual progression:

```text
research
→ shortlist
→ contacted
→ quote_requested
→ quote_received
→ visit_planned / meeting_planned
→ visited / reviewed
→ finalist
→ option_held
→ selected
→ contract_sent
→ contract_signed
→ deposit_paid
→ confirmed
→ completed
→ archived
```

Side/terminal states:

- rejected;
- unavailable;
- withdrawn;
- paused.

Not every entity passes through every state. Rejection preserves reason/history and is reversible until retention policy says otherwise. Contractually confirmed selection cannot be silently replaced by score/import recalculation.

---

## 2. Wedding date option lifecycle

Stored status:

- `candidate`;
- `selected`;
- `rejected`;
- `archived`.

Rules:

- zero or one active selected date per project;
- selecting one is an atomic protected transition that demotes any previous selected option;
- date selection does not rewrite historical quotes/availability;
- rejected/archive preserves date history;
- offline edits may create/update candidate metadata, but authoritative selection is online protected command.

---

## 3. Venue availability lifecycle

Observation status:

- `unknown`;
- `available`;
- `unavailable`;
- `option_held`;
- `expired`.

Availability is observed evidence, not a permanent venue state. Older observations remain historical. `option_held` can have expiry; expiry does not delete the observation.

---

## 4. Commercial offer/quote lifecycle

Offer record status is distinct from the broader vendor/venue candidate lifecycle. Supported conceptual states include:

- `draft`;
- `quoted` / received/current;
- `accepted` where the commercial offer is explicitly accepted;
- `rejected`;
- `expired`;
- `superseded`.

Communication workflow may separately use `not_requested`, `requested`, `waiting`, `received`, `clarification_needed`, `negotiation`.

A revised quote normally creates/supersedes a document/offer version rather than mutating historical quoted terms silently.

---

## 5. Task lifecycle

```text
todo
↔ in_progress
↔ waiting_external
↔ blocked
→ done
→ cancelled
```

Rules:

- `waiting_external` requires `waiting_for` and normally follow-up/reason;
- `blocked` records blocker reason/dependency;
- done is idempotent;
- reopen preserves history;
- dependency cycles are invalid.

---

## 6. Decision lifecycle

```text
draft
→ open
→ awaiting_approvals
→ decided
→ locked
```

Side states/actions:

- deferred;
- cancelled;
- reopened.

Rules:

- require-both decision cannot become decided before required approvals/current selected result;
- each owner can write only their own approval;
- finalization/lock/reopen can require online/current-state command;
- rationale/alternatives/history survive reopen.

---

## 7. RSVP lifecycle

Canonical conceptual states:

- `not_invited_yet`;
- `invitation_planned`;
- `invitation_sent`;
- `pending`;
- `maybe`;
- `attending`;
- `not_attending`.

Attendance probability is separate. RSVP precedence for operational counts follows guest-statistics rules; it does not erase original probability history unless deliberately edited.

---

## 8. Inbox lifecycle

Stored status:

- `inbox` — unprocessed capture;
- `converted` — converted/linked to canonical target;
- `archived` — deliberately kept without conversion;
- `discarded` — recoverable deleted state until purge.

Rules:

- conversion is explicit and idempotent;
- failed conversion keeps original capture;
- retry cannot duplicate same target;
- conversion history/target linkage preserved;
- archived/discarded not silently hard deleted.

---

## 9. Budget scenario lifecycle

A scenario can be active or inactive/archived according to physical schema implementation. Core transition semantics:

- multiple named scenarios may coexist;
- zero or one scenario is active operational scenario;
- activating one atomically deactivates prior active scenario;
- changing scenario assumptions recomputes that scenario only;
- deactivating/archiving a scenario never rewrites actual payments/contracts;
- authoritative active-scenario switch is online/current-state protected command.

Do not encode “minimum/probable/high” as lifecycle state; those are scenario class/assumption metadata.

---

## 10. Payment lifecycle

Payment/cash-movement status supports:

- `planned`;
- `due`;
- `processing` / `manual_pending` where defined;
- `paid`;
- `partially_refunded`;
- `refunded`;
- `cancelled`;
- `overdue`.

Payment type separately distinguishes installment/deposit/final balance/refundable security deposit/refund/credit/deposit return and other explicitly supported cash-movement semantics.

Rules:

- status is not inferred solely from amount;
- refund/return links preserve the original movement;
- offline financial mutation remains pending until cloud validation;
- import cannot silently assert paid truth without supported explicit financial input/provenance.

---

## 11. Milestone lifecycle

At minimum milestone status distinguishes incomplete/current/completed/archived concepts according to physical schema implementation. Semantics:

- completion follows explicit completion rule/manual action;
- dependency blockers can prevent readiness;
- relative target date can recalculate without reopening completed historical record unless rule requires review;
- progress derives from status/weight and is not directly editable.

Exact CHECK values must match the migration/type contract before Lot 8; implementation cannot invent extra semantic states without spec update.

---

## 12. Event timeline item lifecycle

Stored status:

- `draft`;
- `confirmed`;
- `cancelled`.

Rules:

- confirmed item with timing-required contract must satisfy required start/end validation;
- cancelled item remains historical/visible where appropriate;
- dependency/time-order validation is deterministic;
- a frozen exported snapshot is an artifact, not a timeline status;
- live edits do not mutate previously generated snapshot.

---

## 13. Document upload lifecycle

Document/media upload lifecycle uses states such as:

- `local_pending`;
- `uploading`;
- `uploaded_uncommitted`;
- `committed`;
- `failed_retryable`;
- `failed_terminal`;
- `deleted_soft`;
- `purged`.

No file appears valid/committed before binary + required metadata/link state completes.

---

## 14. Document review/supersession lifecycle

`documents.review_status`:

- `unreviewed`;
- `in_review`;
- `reviewed_with_open_items`;
- `reviewed`;
- `superseded`.

Rules:

- supersession is a version relationship and cannot cross project or cycle;
- new version starts its own version-specific review state; prior confirmations are not silently inherited;
- review readiness is factual planning status, not legal validity/advice;
- unresolved critical checklist items can block/flag planned signing workflow according to product rule, but app does not claim a contract is legally valid.

`document_review_items.status` uses:

- `confirmed_in_document`;
- `confirmed_by_linked_evidence`;
- `not_found`;
- `contradictory`;
- `not_applicable`;
- `needs_human_review`.

---

## 15. Import lifecycle

```text
selected
→ analyzing
→ mapping
→ validating
→ review_required
→ ready
→ applying
→ applied
```

Side/error:

- cancelled;
- rejected;
- failed_safe;
- rolled_back;
- partially_applied only for explicitly allowed non-atomic import type.

Parsing/preview never means applied. If project changes after preview, commit revalidates/requires review rather than applying stale plan blindly.

---

## 16. Backup/restore workflow states

Backup/restore is a process state, not necessarily one DB entity state. UI/process must distinguish:

Backup:

- collecting/checking completeness;
- generating;
- encrypting if enabled;
- verifying;
- ready/downloaded;
- failed.

Restore:

- selected;
- inspecting;
- authenticating/decrypting;
- integrity validating;
- compatibility/migration planning;
- preview/target selection;
- applying;
- verified complete;
- failed safe.

Wrong password/tamper/unsupported future schema fails before canonical target mutation.

---

## 17. Project lifecycle

Stored project status:

- `planning`;
- `archived`;
- `deleting`.

Permanent deletion is not ordinary DELETE. Transition into destruction requires owner authorization/recent strong auth/confirmation/backup guidance and server-side safe purge flow.

---

## 18. General transition contract

Every implemented state machine/critical transition specifies:

- allowed source→target transitions;
- preconditions;
- side effects/derived invalidation;
- authorization/strong-auth requirement;
- audit/history effect;
- reversibility;
- offline capability (`queueable` vs `online-required`);
- idempotency/retry semantics;
- direct domain/integration tests.

## Forbidden behavior

A client cannot bypass a protected state precondition by sending arbitrary stored status. Critical transitions are domain commands/services/RPCs where required, not uncontrolled generic field editing.
