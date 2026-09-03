# Module Size and Complexity Guardrails

Status: **Normative V1 maintainability contract**

Purpose: prevent god files, oversized functions, hidden coupling and LLM-driven code accumulation. These limits are design guardrails, not a substitute for judgment. Lot 0 must automate them where practical.

---

## 1. Source-file size

For hand-written production TypeScript:

- **Target:** ≤ 200 logical lines per file.
- **Review threshold:** > 250 logical lines requires an explicit “why this remains cohesive” review.
- **Hard default maximum:** 400 logical lines.

A file over 400 logical lines is not accepted unless a documented exception explains why splitting it would materially reduce clarity/safety. The exception must be visible in PR evidence and approved by review.

Logical lines exclude blank-only lines and may exclude comment-only lines depending on chosen lint tool.

### Files normally exempt from the hard line limit

- generated code;
- generated schemas/types;
- SQL migrations where splitting would destroy transactional/semantic coherence;
- declarative lookup data approved as data rather than logic;
- test fixture data;
- documentation.

Exemption from line count is **not** exemption from review for complexity/security.

---

## 2. Function/method size

For hand-written production functions/methods:

- **Target:** ≤ 30 logical lines.
- **Review threshold:** > 40 logical lines.
- **Hard default maximum:** 60 logical lines.

A function over 60 logical lines must be decomposed unless a reviewer accepts a documented cohesive algorithmic reason.

Long `switch`/state-machine declarations may receive a narrow exception when explicitness is clearer than fragmented dispatch, but business side effects should remain delegated.

---

## 3. Cyclomatic/cognitive complexity

Target per function:

- cyclomatic complexity ≤ **8**;
- hard review threshold > **12**.

Lot 0 must configure lint/static-analysis tooling to enforce an equivalent rule.

When complexity rises, prefer:

- pure helper rules with domain names;
- state-machine tables;
- early returns;
- explicit strategy/handler mapping;
- domain value objects;
- splitting orchestration from calculation.

Do not lower the threshold simply to make CI green.

---

## 4. Nesting depth

Target maximum nested control-flow depth: **3**.

Deeply nested `if/for/try` logic should normally be replaced with guards, named rules or extracted cohesive operations.

Nested declarative object structures are not counted like imperative control-flow nesting.

---

## 5. Function parameters

- Target ≤ **4** positional parameters.
- More than 4 normally uses a typed parameter object/value object.

Do not hide arbitrary bags of unrelated options in one object merely to satisfy the count. The object must represent a coherent concept/use case.

---

## 6. Responsibility rule

A source file should have one primary reason to change.

Warning signs requiring refactor review:

- unrelated domain nouns in the filename/file body;
- UI rendering + SQL/provider calls + business calculation in one file;
- several unrelated exported services/classes;
- a file with more than one bounded context;
- repeated `// region` blocks acting like separate files;
- a service with dozens of unrelated public methods;
- utility file growing because “there was nowhere else to put it”.

---

## 7. Class/service size

Mariage OS prefers functions and small cohesive services over giant classes.

A service should model a coherent set of use cases. If it accumulates unrelated commands/queries, split by application capability rather than keep a single “God Service”.

Review trigger:

- > 10 public methods on one hand-written service/class;
- > 5 injected dependencies/constructor parameters;
- dependency from one service directly into several infrastructure providers rather than ports.

These are review triggers, not mechanical proof of bad design.

---

## 8. Imports/dependencies

- No circular source dependencies.
- No domain → application/infrastructure/UI dependency.
- No application → concrete infrastructure dependency.
- UI must not import concrete Supabase/IndexedDB repositories directly.
- Cross-bounded-context internal imports require deliberate public contracts.

Lot 0 must automate cycle/layer-boundary checks using maintained tooling or an equivalent static rule.

A file with a very large import list is a cohesion warning; review at **15+ non-type imports** unless the file is a composition root/registry/declarative map.

---

## 9. Boolean-flag explosion

Avoid APIs such as:

```ts
calculateThing(true, false, true, false)
```

Prefer explicit enums/value objects/strategy identifiers or named parameter objects.

If a function has more than **2 boolean behavior flags**, review whether it is actually several use cases hidden in one function.

---

## 10. Generic utility prohibition

Do not create general dumping-ground modules:

- `utils.ts`
- `helpers.ts`
- `common.ts`
- `misc.ts`

Name helpers by real behavior/context, e.g.:

- `normalize-external-id.ts`
- `format-money.ts`
- `validate-project-route.ts`
- `compare-fact-confidence.ts`

If a helper is used by only one bounded context, keep it in that context rather than promote it globally prematurely.

---

## 11. Duplication rule

Do not abstract after the first similar line merely to reduce line count.

But duplicated **business rules** across two screens/services are not allowed to become independent truth. Move the rule to the correct domain/application owner.

Presentation duplication may remain temporarily when an abstraction would produce a worse API; record material intentional duplication in review if it is non-obvious.

---

## 12. Comments and TODOs

Production TODO/FIXME comments must include one of:

- linked issue/Feature ID;
- approved deferred decision;
- explicit removal deadline/lot.

Untracked `TODO`, `FIXME`, `HACK`, `TEMP` is a review failure.

Comments should explain invariants/why, not compensate for an oversized/unclear function.

---

## 13. Unsafe TypeScript escape hatches

Disallow by default:

- implicit/explicit `any` in domain/application logic;
- `@ts-ignore`;
- broad `as unknown as X` assertions;
- non-null `!` used to suppress unresolved lifecycle issues.

A boundary-specific exception must be minimal, runtime-validated where appropriate, and documented in code review.

Generated/provider declaration code may be exempt where outside our control.

---

## 14. Enforcement in Lot 0

Lot 0 must configure automated checks for equivalent rules covering at least:

- max file lines;
- max function lines;
- complexity;
- nesting depth where tooling supports it reliably;
- max parameters;
- import cycles;
- layer/boundary imports;
- no implicit `any` / strict TypeScript;
- unused imports/dead code;
- tracked or forbidden TODO markers;
- formatting/lint consistency.

If an exact tool cannot enforce one rule reliably, the rule remains a code-review requirement and the chosen alternative is documented.

---

## 15. Exception process

A limit exception is allowed only when all are true:

1. the module/function is still cohesive;
2. splitting would reduce clarity, atomicity or safety;
3. no cross-layer responsibility is being hidden;
4. tests remain understandable;
5. PR explicitly marks `SIZE/COMPLEXITY EXCEPTION` with rationale;
6. reviewer approves;
7. recurring exceptions trigger architecture review rather than normalizing the breach.

No exception is accepted merely because “the LLM generated it that way” or “refactoring would take longer”.
