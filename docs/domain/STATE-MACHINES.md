# State Machines

Statuses are domain state, not decorative labels. Transitions must be explicit, validated and testable.

## Venue/Vendor candidate lifecycle

Canonical conceptual progression:

```text
research
  ↓
shortlist
  ↓
contacted
  ↓
quote_requested
  ↓
quote_received
  ↓
visit_planned / meeting_planned
  ↓
visited / reviewed
  ↓
finalist
  ↓
option_held
  ↓
selected
  ↓
contract_sent
  ↓
contract_signed
  ↓
deposit_paid
  ↓
confirmed
  ↓
completed
  ↓
archived
```

Alternative terminal/side states include:

- rejected;
- unavailable;
- withdrawn;
- paused.

Not every entity must pass through every state. The UI should offer only semantically sensible transitions.

### Rejection

Rejecting an option preserves the entity, reason, history and alternatives. Rejected is reversible until project archival/deletion rules say otherwise.

### Selection lock

Once a venue/vendor is contractually confirmed, reopening the decision requires an explicit action and does not erase history.

## Task lifecycle

```text
todo
  ↔ in_progress
  ↔ waiting_external
  ↔ blocked
  → done
  → cancelled
```

Rules:

- `waiting_external` requires `waiting_for` and normally a follow-up date or reason;
- `blocked` should identify the blocking dependency/reason;
- `done` is idempotent;
- reopening a done task is allowed with history.

## Decision lifecycle

```text
draft
  → open
  → awaiting_approvals
  → decided
  → locked
```

Side states:

- deferred;
- cancelled;
- reopened.

A joint decision is not `decided` until required approvals are satisfied and a selected option/result exists.

## RSVP lifecycle

Conceptual values:

- not_invited_yet;
- invitation_planned;
- invitation_sent;
- pending;
- maybe;
- attending;
- not_attending.

Attendance probability and RSVP are distinct. A confirmed RSVP supersedes probability for operational confirmed-count calculations according to guest-statistics rules.

## Quote lifecycle

- not_requested;
- requested;
- waiting;
- received;
- clarification_needed;
- negotiation;
- accepted;
- rejected;
- expired;
- superseded.

## Payment lifecycle

- planned;
- due;
- processing/manual_pending where useful;
- paid;
- partially_refunded;
- refunded;
- cancelled;
- overdue.

Payment status must not be inferred only from amount unless rules explicitly support it.

## Import lifecycle

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

Side/error states:

- cancelled;
- rejected;
- failed_safe;
- rolled_back;
- partially_applied only for explicitly allowed non-atomic import types.

## Media upload lifecycle

- local_pending;
- uploading;
- uploaded_uncommitted;
- committed;
- failed_retryable;
- failed_terminal;
- deleted_soft;
- purged.

Do not expose a media record as valid/committed before required storage/database linkage completes.

## Transition rules

Each implemented state machine must document:

- allowed transitions;
- preconditions;
- side effects;
- generated/suggested tasks;
- audit/history effect;
- reversibility;
- authorization requirements;
- offline behavior;
- tests.

## Forbidden behavior

A client may not bypass state preconditions by sending an arbitrary stored status if doing so would violate an invariant. Critical transitions should be represented through domain commands/services, not uncontrolled generic field editing.
