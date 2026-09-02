# Error Handling and Recovery UX

Status: **Normative engineering and UX contract**

Mariage OS must fail safely, explain failures in human language and preserve recoverable work.

## Error classes

### Validation error
User input is invalid or incomplete.

Examples:
- invalid probability;
- impossible date;
- unsupported file type.

Behavior: inline explanation; no destructive mutation; no technical stack trace.

### Conflict
Two valid sources/edits cannot be safely merged automatically.

Behavior: preserve both values/operations and present explicit resolution.

### Authorization error
User/session lacks permission.

Behavior: do not reveal existence/content of unauthorized records; show generic permission/auth message.

### Network/backend unavailable
Cloud cannot currently be reached.

Behavior: preserve local state, show offline/error state, queue eligible edits, allow retry.

### Quota/resource error
A free-tier or local resource boundary would be exceeded.

Behavior: protect essential structured data; block/defer non-essential large operations; explain remediation without paid-upgrade coercion.

### Data-integrity error
Invariants/checksums/references fail.

Behavior: stop unsafe mutation, preserve evidence, create diagnostic information, recommend recovery path.

### Unexpected application error
Unhandled defect.

Behavior: catch at defined application boundary, generate local diagnostic ID, avoid PII/secrets, preserve pending changes where possible, offer reload/retry/export diagnostics.

## Error payload shape

Internal typed errors should expose only fields needed by callers, for example:

- stable error code;
- user-safe message key;
- retryable boolean;
- operation ID;
- cause category;
- safe diagnostic metadata.

Raw backend error objects are not rendered directly to users.

## User-facing messaging

Good:

> We could not sync this change yet. It is saved on this device and will be retried.

Bad:

> PGRST116 / PostgREST relationship error.

Messages must state:

1. what happened;
2. whether data is safe;
3. what the user can do next.

## Mutation failure rules

- Never show `Saved` for a mutation that has not met the local-persistence contract.
- Cloud failure after local persistence becomes pending, not lost.
- Permanent validation/authorization failure is not retried indefinitely.
- Retryable operations use bounded/backoff behavior.
- Idempotence keys prevent duplicate logical mutations.

## Import failure

Parsing/validation errors occur before commit whenever possible.

During atomic import commit, either the defined transaction succeeds or affected structured state remains unchanged.

Partial-import mode, when allowed, must explicitly identify which rows were applied and which were rejected.

## Upload failure

Binary upload and metadata finalization have explicit states. An interrupted upload never appears as complete media.

## Local storage failure

If IndexedDB/local persistence becomes unavailable or corrupted:

- do not pretend offline edits are protected;
- warn before accepting work that cannot be durably saved;
- allow cloud-only operation if safe/online and design permits;
- provide recovery/reset only after export/reconciliation options have been considered.

## Recovery actions

Possible actions include:

- Retry now;
- Work offline;
- Re-authenticate;
- Resolve conflict;
- Undo;
- Restore snapshot;
- Export diagnostic report;
- Export recovery backup;
- Contact/report issue through documented security/support route.

## Logging

Errors may be recorded locally or in privacy-preserving project audit systems, but must not include unnecessary PII, secrets, full document contents or authentication tokens.

## Required tests

Each critical feature tests at least:

- expected success;
- validation failure;
- authorization denial where relevant;
- network failure;
- retry/idempotence;
- unexpected backend response;
- state after app restart where persistence matters.
