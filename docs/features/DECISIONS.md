# Decisions Feature Contract

## Purpose

Decisions centralize choices that require evaluation and/or agreement, preventing them from disappearing in chat threads or being confused with actionable tasks.

## Main views

- To decide together
- My pending approvals
- Open decisions
- Decided
- Reopened/history

## Decision detail

Shows:

- question;
- context;
- deadline;
- linked objects;
- options;
- facts/criteria relevant to options;
- each partner's view/approval;
- missing critical information;
- selected outcome;
- rationale;
- status/history.

## Option comparison

Where options are entities such as venues/vendors, reuse their factual/financial comparison rather than copying data into the decision.

## Approval modes

Decision defines required approvers:

- one owner;
- either owner;
- both owners.

For major shared decisions such as venue selection, both owners are the default requirement.

## Discuss together

Any entity can create a lightweight linked decision/discussion item to appear in the couple review.

## Finalization

A decision cannot finalize while:

- required approvals are missing;
- a blocking precondition explicitly requires resolution;
- selected option is invalid/deleted unless resolved.

## Rationale

Major decisions preserve human rationale and why close alternatives were not chosen.

## Reopening

Reopening never deletes prior outcome. Store who reopened, why and what downstream assumptions may need revalidation.

## Acceptance criteria

- both-required decision cannot finalize with one approval;
- entity updates remain live references, not stale duplicated comparison data;
- reopening keeps old rationale/history;
- locked/contractually acted-on decisions require explicit reopen path;
- offline individual input syncs without overwriting partner input;
- decision count/dashboard filters reflect canonical status.
