# Coding Standards

Status: **Binding engineering conventions**

This file defines coding behavior. Physical placement/allowed dependency paths are governed by `CODEBASE-STRUCTURE.md`. Quantitative maintainability limits are governed by `MODULE-SIZE-COMPLEXITY.md`. Secure primitives are governed by `../security/SECURE-CODING-PATTERNS.md` and related security contracts.

## Language/tooling

- TypeScript strict mode.
- No implicit `any` in production logic.
- Prefer small explicit modules over large god files/classes.
- Use Vite build tooling; browser runtime remains framework-light.
- New architecture/tooling conventions must not silently contradict ADRs.

## Layering

Dependency direction is frozen by `CODEBASE-STRUCTURE.md`.

Conceptually:

`UI → application/domain → abstract ports ← infrastructure adapters`

with the composition root wiring concrete implementations.

Rules:

- UI components do not contain authorization logic as security enforcement.
- UI components do not directly perform arbitrary Supabase/IndexedDB operations.
- Business calculations belong in deterministic domain/rule/engine functions.
- Provider-specific Supabase/IndexedDB logic belongs behind repositories/adapters.
- Domain code does not import DOM/network/provider/storage modules.
- Application code does not import concrete infrastructure.
- Parsing/import logic stays isolated from authoritative domain mutation until preview/commit.
- Circular dependencies are prohibited.
- Cross-context internal imports require a deliberate public boundary.

## Data types

- UUIDs use explicit branded/domain types where practical.
- Dates distinguish civil date from timestamp.
- Money uses exact integer-minor-unit/currency semantics from `domain/MONEY.md`.
- Enumerations/state machines are typed and centrally defined.
- Unknown/null/not-applicable/conflict semantics are explicit rather than overloaded empty strings.
- External/provider payloads are runtime-validated before trusted domain use.
- Do not use `number` as a vague substitute when the domain requires money, percentage, duration, distance or another constrained concept.

## File/folder naming

Production TypeScript filenames use **kebab-case**.

Examples:

- `venue-detail-screen.ts`
- `calculate-expected-guests.ts`
- `supabase-venue-repository.ts`

Avoid vague filenames:

- `utils.ts`
- `helpers.ts`
- `common.ts`
- `misc.ts`
- bare `service.ts`, `manager.ts`, `data.ts` without domain meaning.

Canonical folder structure lives in `CODEBASE-STRUCTURE.md` and may not be replaced with a parallel architecture for convenience.

## Identifier naming

- classes/types/interfaces: PascalCase;
- functions/variables: camelCase;
- true global/constants/config keys: SCREAMING_SNAKE_CASE where appropriate;
- DB objects: documented snake_case;
- domain terminology must match documentation; do not invent synonyms such as `place` when the domain term is `venue`.

Boolean names should read as predicates (`isArchived`, `canEdit`, `hasConflict`) rather than vague nouns.

## Functions

Functions should:

- do one coherent thing;
- make side effects explicit;
- accept typed inputs;
- return typed outputs/errors;
- be deterministic when they implement business calculation;
- be directly testable;
- use injected clock/random/provider dependencies when deterministic behavior matters.

Avoid hidden mutation of unrelated global state.

Quantitative limits for function length, complexity, nesting and parameters are binding in `MODULE-SIZE-COMPLEXITY.md`.

## Modules/classes/services

- One primary responsibility/reason to change per source module.
- Prefer pure functions/value objects/small services over giant mutable classes.
- Do not create one service simply to contain all actions for a large domain.
- A service/application command should have a clear user/system use case.
- Provider response types do not leak beyond adapter boundaries.
- Composition root is the normal location for concrete wiring.

Size/dependency review triggers are defined in `MODULE-SIZE-COMPLEXITY.md`.

## Error handling

Do not catch-and-ignore errors.

Expected domain failures use typed result/error models. Unexpected failures are captured at boundaries and converted into safe diagnostic IDs/user messages according to `ERROR-HANDLING.md`.

Do not use exceptions as ordinary control flow for expected validation outcomes unless the governing result/error convention intentionally requires it.

## Async/network

- Every network mutation has an idempotence/retry story.
- UI loading state must not imply cloud mutation success before local/cloud semantics are satisfied.
- Retries must not duplicate logical writes.
- Abort/cancellation should be supported for user-initiated long reads/import analyses where practical.
- Timeouts/retry/backoff are bounded; no unbounded loops.
- Project/account context is explicit in project-owned network/repository operations.

## Security

Follow `../security/README.md` and applicable `SEC-*`/`AUTHZ-*` requirements.

Forbidden patterns include:

- production `service_role`/secret credentials in client code;
- concatenated/raw user-controlled SQL/query syntax;
- `eval` / `new Function`;
- direct rendering/execution of untrusted HTML/SVG/script content;
- trusting project/user IDs supplied by UI without server/RLS validation;
- dynamically executing imported files;
- unsafe arbitrary server-side URL fetch without SSRF design;
- cryptographic/token generation using `Math.random()`;
- custom password/token/crypto algorithms when standard provider/platform primitives exist;
- committing real production fixtures.

## DOM rendering

Use safe text/property APIs by default (`textContent`, deliberate attributes/properties, safe template mechanisms).

Do not use `innerHTML`/equivalent with untrusted content. Any future rich-text rendering requires explicit sanitization + CSP/Trusted-Types/security review.

## Imports

- Respect dependency/layer rules in `CODEBASE-STRUCTURE.md`.
- Avoid deep relative imports that cross architectural roots.
- Do not use barrel files to conceal cycles or expose every internal module.
- Remove unused imports/dependencies.
- A large import list is a cohesion review trigger per `MODULE-SIZE-COMPLEXITY.md`.

## Comments and tracked technical debt

Comments explain **why**, invariants, non-obvious tradeoffs or security constraints. Avoid comments that merely restate code.

Critical rules/tests should reference Requirement/Feature/Security IDs where useful.

Untracked `TODO`, `FIXME`, `HACK`, `TEMP` markers are prohibited. They must reference a Feature/issue/deferred decision/lot and have a clear disposition.

## Dependencies

New runtime dependency requires justification:

- problem solved;
- why native/small code is insufficient;
- bundle impact;
- security/maintenance posture;
- license suitability;
- data/privacy/network implications;
- test implications;
- replacement/exit path for material dependencies.

Prefer fewer dependencies. Lock reproducibly. Dependency changes pass the same quality/security gates as application code.

## Test placement and naming

Frozen placement convention from `CODEBASE-STRUCTURE.md`:

- unit/domain/property tests colocate next to source as `*.test.ts` / `*.property.test.ts`;
- cross-component integration tests live under `tests/integration/`;
- adversarial/security tests under `tests/security/` and DB/RLS policy tests under `supabase/tests/`;
- browser E2E under `tests/e2e/`;
- shared synthetic fixtures under `tests/fixtures/`.

Test names describe behavior/outcome rather than implementation internals.

Critical tests reference Requirement/Acceptance/Security IDs where practical, e.g. `IMP-003 reimport is idempotent`.

## Public repository hygiene

Never paste/commit real:

- guest/contact data;
- budget/contracts/payment data;
- couple private comments/ratings;
- private photos/documents;
- access/refresh/invitation tokens;
- production environment dumps;
- production secrets.

Synthetic fixtures use clearly fictitious names/data.

## Dead code and temporary paths

Do not merge dead alternative implementations, commented-out production code or hidden “temporary” architecture paths.

Feature-flagged incomplete code must have a documented reason/owner/removal or activation condition and may not weaken security/data invariants.

## Definition of change completeness

A behavior change is incomplete until:

- governing specification is updated if contract changed;
- correct Feature/Requirement/Security IDs are recorded;
- implementation respects physical/layer/complexity rules;
- implementation is typed and boundary-validated;
- tests cover normal/error/boundary/security/offline implications as applicable;
- migration/import/backup compatibility is evaluated;
- user-facing states/errors are designed;
- feature/status/evidence records are updated;
- complete required verification passes.
