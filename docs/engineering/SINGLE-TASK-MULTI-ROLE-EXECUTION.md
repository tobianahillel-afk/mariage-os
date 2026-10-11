# Single-task multi-role execution — Mariage OS

Status: **Operational guidance / additive to normative governance**  
Scope: one hourly scheduled ChatGPT task; all Lots 0–12 and subsequent maintenance.  
Authority: `AGENTS.md`, `docs/engineering/AI-LOT-ORCHESTRATION.md`, `docs/quality/QUALITY-GATES.md`, and active Work Packet contracts take precedence.

## Goal and constraint

The operator has **one** scheduled ChatGPT task, no local LLM/GPU, no paid third-party reviewer budget, and needs continuous useful work within each run. Do **not** create additional scheduled tasks or require local inference. The hourly schedule **triggers** an execution; it does **not** constrain role transitions to hourly boundaries. Keep the task enabled, including on quota exhaustion, failure, no progress, and completion of all Lots.

## One execution, many roles

At the start of **every** execution:
1. Record actual start time when available, verify GitHub access and determine canonical active branch and exact HEAD. Read `AGENTS.md`, `docs/START-HERE.md`, `docs/V1-FROZEN-MANIFEST.md`, `docs/roadmap/IMPLEMENTATION-STATUS.md`, active Work Packet and applicable normative contracts, open PRs, review findings and exact-HEAD CI.
2. Determine the **next permitted transition** from durable repository state; never infer permission from a previous chat or from a successful test alone.
3. Operate as a state machine **within the same run**, switching roles as soon as a transition becomes eligible, even after 10 minutes or less; never wait for the next hourly trigger merely to switch roles:
   - **PLAN**: scope, dependency and Work Packet authorization.
   - **PASS A / IMPLEMENT**: RED-first where applicable, bounded code, GREEN evidence, commit/PR and exact SHA.
   - **PASS B / ADVERSARIAL SELF-REVIEW**: deliberately rebuild expectations from contracts without treating the implementation author's conclusions as evidence; inspect complete diff, privilege boundaries, race/replay/idempotency, data isolation, negative cases and missing tests; seek falsifiable counterexamples and report severity plus reproduction.
   - **REMEDIATE**: address proven findings, rerun affected checks, invalidate stale review/CI evidence and return to adversarial review.
   - **PASS C / RECONCILE**: only after the actual normative Pass-B gate is satisfied; compare EXPECTED / IMPLEMENTED / VERIFIED, findings and exact-head required CI, including clean checkout.
   - **NEXT**: proceed to the next explicitly authorized action if time and tools allow.
4. Repeat as appropriate **during the same execution**; preserve a safe atomic checkpoint after every meaningful step. Prefer bounded 15–20-minute units; never assert the platform guarantees a minimum or unlimited run duration.

## Independence is a separate gate

A single agent changing its own role is **not** a distinct reviewer identity, a fresh independent model/session, or a formal GitHub approval. Label its output **SELF-REVIEW / ADVISORY**. Do not relabel it `INDEPENDENT PASS B`, mark independent findings closed, claim `ACCEPTANCE_PENDING`, merge or perform Pass C when the active packet explicitly requires a truly independent review that has not occurred.

Use genuinely independent reviewer evidence if available, including an authorized separate reviewer/session or other accepted mechanism, verified against the **exact candidate HEAD**. Quota exhaustion, reviewer silence, scanner output and an AI self-review are not approval. A reviewer service requiring paid credentials is never mandatory for this operational mode; if none is available, leave the formal gate blocked and do **other authorized** technical work. Never circumvent branch protections.

## GitHub Actions completion and wait loop

A pushed commit, opened PR or workflow dispatch is **not** the end of a development step. Before claiming verification, identify the required checks from the applicable contracts and the actual GitHub Actions configuration, then bind each check to the exact candidate commit SHA. Resume unfinished runs before starting duplicate work.

1. Discover the workflow run IDs and their latest attempts for that SHA; record the PR/branch, required job names, run IDs and observed statuses. A newly pushed SHA may not yet have a visible workflow; absence of runs is **UNKNOWN**, never green. Distinguish required jobs from conditional provider-only jobs legitimately skipped.
2. While required jobs are `queued`, `pending`, `waiting`, `requested` or `in_progress`, recheck after **real** delays when the execution environment permits: initially 10 seconds, then 20, then 30 seconds, optionally 60 seconds for long-running jobs. Do not fabricate sleeps or issue an immediate busy-poll loop if no wait capability exists. Perform independent authorized work during the interval if it cannot invalidate the candidate.
3. Do not voluntarily end a still-viable session merely because a CI job takes 5–15 minutes. Continue until the relevant runs reach terminal states or the platform/tool/quota budget makes further waiting impossible. The scheduled ChatGPT runtime does **not** guarantee any minimum duration; polling cannot force it to stay alive.
4. On completion, verify the workflow conclusion **and each required job** on the latest relevant attempt and exact SHA. For packet gates requiring five ordinary jobs, verify all five including full clean-checkout verification. A `skipped`, missing, cancelled, timed-out, failed, stale or action-required **required** job is not success. Conditional skipped jobs are acceptable only when the contract permits them.
5. On failure, inspect available job steps/logs, distinguish code/test failure from infrastructure or permissions, fix reproducible in-scope defects, and rerun the appropriate checks without weakening gates. Do not repeatedly rerun a job with no diagnosis. After a new commit, invalidate affected old-head evidence and restart discovery on the new SHA.
6. On success, transition **immediately** to the next authorized review/remediation/acceptance action in the **same** execution. Green CI never substitutes for a required independent Pass B or a GitHub approval.
7. If interrupted, preserve the resume cursor in an **existing authorized** PR/Work Packet/status location: exact SHA, run IDs, last observed job states and timestamps, outstanding gates and next poll/action. At the next hourly invocation, check those runs first and continue without duplicating commits or PRs. Avoid noisy status-only commits/comments when nothing materially changed.

Treat polling as an observation mechanism, not a substitute for independent review, exact-head proof, or durable coordination. Do not invent an execution duration, an elapsed wait, a delivered notification or a workflow result.

## Idempotent execution and race safety

- One Work Packet `IN_PROGRESS` per normative orchestration; avoid unrelated parallel mutations.
- Before each write, re-read branch/PR HEAD and relevant file SHA; do not overwrite concurrent edits or force refs.
- Bind review artifacts and CI evidence to the exact HEAD and contract revision. A changed candidate invalidates affected evidence.
- No artificial commits, duplicate PRs, fabricated tests, speculative review approvals, production data, secrets or risky deployment.
- Keep a durable resume cursor in the existing authorized Work Packet/PR/status location: branch, HEAD, packet/pass, last verified action, pending findings, next authorized transition. Do not create a competing state-of-truth engine.
- Tool/permission/quota failure: bounded retry only, classify blocker, then switch to an independently authorized action. If none exists, end the run cleanly **without disabling the task**.

## WP-2.12V immediate application

Revalidate the active branch and PR #131 before acting; the following is a **starting hypothesis**, not authority: WP-2.12V is blocked in Pass-B remediation, parent WP-2.12 PR #117 remains unmerged. Check complete fresh review, potential lost-HTTP-ACK / source-revision replay issue, direct pgTAP RED evidence, SQL/RLS/authorization, exact-head five CI jobs and clean checkout. Do not treat a self-review or earlier CI head as clearance for Pass C.

## Mandatory report after every run

Always publish **MARIAGE OS — RAPPORT D'EXÉCUTION**, including: verified start/end time (UTC/Paris if available), duration or not measurable, hourly trigger, GitHub access, canonical branch, initial/final HEAD, Work Packet, each role/phase actually performed **in order**, exact files/commits/PR URLs, actually verified tests/CI, findings and blockers, next permitted action, progress classification and known task status. Distinguish performed actions from proposals and unverified results. If no GitHub contribution occurred, state **AUCUNE CONTRIBUTION GITHUB EFFECTUÉE** and why. Never claim that a notification was delivered without platform evidence.

## Operational acceptance checklist

- [ ] Existing hourly task remains enabled; no second task created
- [ ] Roles may change several times within one execution without waiting for the next hour
- [ ] Formal independent-review requirement is not silently weakened
- [ ] Pass C and merge remain gated on exact-head evidence and applicable review
- [ ] Concurrent changes, retries, quotas and interruptions have fail-safe behavior
- [ ] Durable resume cursor and per-run factual report are produced
- [ ] No changes to product contracts, migration, RLS or release authority
