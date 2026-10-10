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
