# Venue Lifecycle State-Machine Addendum

Status: **Normative V1 venue-lifecycle correction/addendum**

This document explicitly corrects and narrows the Venue portion of `docs/domain/STATE-MACHINES.md` and reconciles it with `docs/domain/VENUES.md` and `docs/features/VENUES.md`. Under the repository precedence rules for narrow addenda, this document controls Venue lifecycle semantics where the base documents are ambiguous or disagree.

## 1. Canonical stored vocabulary

The canonical Venue lifecycle vocabulary remains:

- `research`;
- `shortlist`;
- `reserve`;
- `contacted`;
- `quote_requested`;
- `quote_received`;
- `visit_planned`;
- `visited`;
- `reviewed`;
- `finalist`;
- `option_held`;
- `selected`;
- `contract_sent`;
- `contract_signed`;
- `deposit_paid`;
- `confirmed`;
- `completed`;
- `archived`;
- `rejected`;
- `unavailable`;
- `withdrawn`;
- `paused`.

`reserve` is intentionally retained. It means a viable backup candidate kept for possible reconsideration. It is a planning state only: it does not imply selection, availability, a held option, contract, payment or confirmation.

`visited` and `reviewed` remain distinct stored values even though the base state-machine presents them as the same conceptual stage. A project may use either or both without treating one as stronger evidence than the other.

## 2. Generic pre-contractual lifecycle command

The ordinary Venue lifecycle command may target only these pre-contractual planning states:

- `research`;
- `shortlist`;
- `reserve`;
- `contacted`;
- `quote_requested`;
- `quote_received`;
- `visit_planned`;
- `visited`;
- `reviewed`;
- `finalist`;
- `option_held`;
- `rejected`;
- `unavailable`;
- `withdrawn`;
- `paused`.

Explicit movement among those states is allowed because they represent mutable research/workflow classification rather than contractual truth. Every actual change must retain previous status/rejection data in history and must use current authorization plus an expected server revision.

A same-state request with the same rejection semantics is idempotent and must not create duplicate history.

`rejected` requires a meaningful rejection reason. Leaving `rejected` is an explicit restore/reclassification action: the rejection reason is cleared from the current row while retained history preserves the rejected state and reason. No restore creates a duplicate Venue.

`option_held` in the candidate lifecycle is only a coordination/status label. It never substitutes for the date-specific availability observation/evidence model owned by the Venue commercial/availability packet.

## 3. Protected commitment and terminal states

The following states are protected and MUST NOT be reachable through the generic lifecycle command:

- `selected`;
- `contract_sent`;
- `contract_signed`;
- `deposit_paid`;
- `confirmed`;
- `completed`;
- `archived`.

They may appear in the stored vocabulary so schema/read models remain forward-compatible, but their presence in a TypeScript union or SQL CHECK is not authorization to transition into or out of them.

A Venue already in a protected state also cannot leave that state through the generic command.

Each protected transition requires a dedicated command/service/RPC before it becomes user-reachable. That dedicated implementation must define and test its own preconditions, approval/evidence requirements where applicable, current revision, authorization/strong-auth requirement, history, retry/idempotency, reversibility and offline policy according to `STATE-MACHINES.md`. Until such a command exists, the transition is unavailable rather than guessed.

This specifically enforces the existing feature contract that `selected`/`confirmed` transitions follow state-machine and approval requirements and prevents a generic status write from asserting contractual truth.

## 4. Authorization and locking order

A `SECURITY DEFINER` Venue command must fail closed on live project permission before acquiring a lock on the target Venue row. After the row lock is acquired, authorization is checked again before mutation so membership revocation cannot be bypassed by a privileged function.

The externally observable failure remains generic; callers cannot use differing not-found/unauthorized errors to learn whether another project's Venue UUID exists.

## 5. WP-2.1 boundary

WP-2.1 owns the generic pre-contractual lifecycle/history foundation only. It does not prematurely implement selection, contract, payment, confirmation, completion or archive commands whose domain evidence/approval semantics belong to later feature work.

The later local-first packet owns durable operation receipts/retry orchestration. WP-2.1 therefore uses expected-revision stale-write protection but does not claim operation-ID idempotency.
