# Coding Standards

Status: **Binding engineering conventions**

## Language/tooling

- TypeScript strict mode.
- No implicit `any` in production logic.
- Prefer small explicit modules over large god files/classes.
- Use Vite build tooling; browser runtime remains framework-light.

## Layering

Preferred dependency direction:

`UI → application/domain services → repositories/local store/sync → Supabase adapters`

Rules:

- UI components do not contain authorization logic as security enforcement.
- UI components do not directly perform arbitrary Supabase table operations.
- Business calculations belong in deterministic domain/engine functions.
- Provider-specific Supabase logic belongs behind repositories/adapters.
- Parsing/import logic stays isolated from domain mutation until preview/commit.

## Data types

- UUIDs use explicit branded/domain types where practical.
- Dates distinguish civil date from timestamp.
- Money uses exact minor-unit/decimal semantics from `domain/MONEY.md`.
- Enumerations/state machines are typed and centrally defined.
- Unknown/null/not-applicable/conflict semantics are explicit rather than overloaded empty strings.

## Naming

- Classes/types: PascalCase.
- functions/variables: camelCase.
- constants: SCREAMING_SNAKE_CASE only for true constants/config keys.
- DB columns follow documented snake_case schema.
- Domain terminology must match documentation; do not invent synonyms such as `place` when the domain term is `venue`.

## Functions

Prefer functions that:

- do one coherent thing;
- make side effects explicit;
- accept typed inputs;
- return typed outputs/errors;
- are deterministic when they implement business calculation;
- are directly testable.

Avoid hidden mutation of unrelated global state.

## Error handling

Do not catch-and-ignore errors.

Expected domain failures use typed result/error models. Unexpected failures are captured at boundaries and converted into safe diagnostic IDs/user messages according to `ERROR-HANDLING.md`.

## Async/network

- Every network mutation must have an idempotence/retry story.
- UI loading state must not imply mutation success before local persistence semantics are satisfied.
- Retries must not duplicate logical writes.
- Abort/cancellation should be supported for user-initiated long reads/import analyses where practical.

## Security

Forbidden patterns include:

- production `service_role`/secret credentials in client code;
- `eval` / `new Function`;
- direct rendering of untrusted HTML;
- trusting project/user IDs supplied by UI without server/RLS validation;
- dynamically executing imported files;
- committing real production fixtures.

## DOM rendering

Use safe text APIs by default (`textContent`, property binding, safe template mechanisms). Any future rich-text rendering requires explicit sanitization architecture/security review.

## Comments

Comments explain **why**, invariants, non-obvious tradeoffs or security constraints. Avoid comments that merely restate the line of code.

Critical rules should reference requirement IDs/documents where helpful.

## Dependencies

New runtime dependency requires justification:

- problem solved;
- why native/small code is insufficient;
- bundle impact;
- security/maintenance posture;
- license suitability;
- test implications.

Prefer fewer dependencies.

## Testing colocations

Unit tests may be colocated or use consistent test directories; the project will standardize one convention during Lot 0. Regardless, test names should describe behavioral expectations, not implementation internals.

Critical tests may reference requirement IDs, e.g. `IMP-003 reimport is idempotent`.

## Public repository hygiene

Never paste real:

- guest data;
- budget/contracts;
- venue private couple comments;
- private photos;
- access tokens;
- production environment dumps.

Synthetic fixtures use clearly fictitious names.

## Definition of change completeness

A behavior change is incomplete until:

- specification is updated if behavior contract changed;
- implementation is typed;
- tests cover normal/error/boundary/security implications;
- migration/import compatibility is evaluated;
- user-facing errors/states are designed;
- full required verification passes.
