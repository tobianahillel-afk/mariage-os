# Codebase Structure

Status: **Normative V1 physical code organization contract**

Purpose: make the implementation predictable for humans and LLMs, prevent architecture drift, and make it obvious where new code belongs.

The exact empty directories are created in Lot 0, but the structure/boundaries below are frozen unless an ADR changes them.

---

## 1. Canonical repository structure

```text
/
├── AGENTS.md
├── README.md
├── package.json
├── package-lock.json
├── vite.config.*
├── tsconfig*.json
├── src/
│   ├── app/
│   │   ├── bootstrap/
│   │   ├── router/
│   │   ├── shell/
│   │   └── composition/
│   ├── ui/
│   │   ├── primitives/
│   │   ├── components/
│   │   ├── layouts/
│   │   └── screens/
│   │       ├── auth/
│   │       ├── dashboard/
│   │       ├── venues/
│   │       ├── vendors/
│   │       ├── guests/
│   │       ├── seating/
│   │       ├── budget/
│   │       ├── tasks/
│   │       ├── decisions/
│   │       ├── planning/
│   │       ├── timeline/
│   │       ├── inbox/
│   │       ├── search/
│   │       ├── map/
│   │       ├── documents/
│   │       ├── import-export/
│   │       └── settings/
│   ├── domain/
│   │   ├── identity/
│   │   ├── projects/
│   │   ├── venues/
│   │   ├── vendors/
│   │   ├── guests/
│   │   ├── seating/
│   │   ├── budget/
│   │   ├── tasks/
│   │   ├── decisions/
│   │   ├── planning/
│   │   ├── timeline/
│   │   ├── documents/
│   │   ├── facts/
│   │   └── shared/
│   ├── application/
│   │   ├── identity/
│   │   ├── projects/
│   │   ├── venues/
│   │   ├── vendors/
│   │   ├── guests/
│   │   ├── seating/
│   │   ├── budget/
│   │   ├── tasks/
│   │   ├── decisions/
│   │   ├── planning/
│   │   ├── timeline/
│   │   ├── documents/
│   │   ├── inbox/
│   │   ├── search/
│   │   └── shared/
│   ├── infrastructure/
│   │   ├── supabase/
│   │   │   ├── auth/
│   │   │   ├── repositories/
│   │   │   ├── rpc/
│   │   │   ├── realtime/
│   │   │   └── storage/
│   │   ├── indexeddb/
│   │   │   ├── stores/
│   │   │   └── migrations/
│   │   ├── sync/
│   │   └── external/
│   ├── import-export/
│   │   ├── parsers/
│   │   ├── schemas/
│   │   ├── mapping/
│   │   ├── validation/
│   │   ├── deduplication/
│   │   ├── merge/
│   │   ├── exporters/
│   │   └── backup/
│   ├── pwa/
│   │   ├── service-worker/
│   │   ├── cache/
│   │   └── updates/
│   ├── workers/
│   └── shared/
│       ├── errors/
│       ├── validation/
│       ├── ids/
│       ├── money/
│       ├── dates/
│       ├── result/
│       ├── collections/
│       └── security/
├── tests/
│   ├── integration/
│   ├── security/
│   ├── e2e/
│   ├── accessibility/
│   ├── performance/
│   ├── fixtures/
│   └── helpers/
├── supabase/
│   ├── migrations/
│   ├── tests/
│   └── seed.*
├── public/
├── docs/
└── .github/
    └── workflows/
```

Not every folder must exist on day one; create it only when it owns real behavior. Do not create alternate parallel hierarchies for the same concern.

---

## 2. Layer dependency direction

Allowed conceptual dependencies:

```text
shared
  ↑
domain
  ↑
application  ← ports/interfaces live here where application-owned
  ↑          ↖
ui            infrastructure implements application/domain ports
  ↑                    ↑
app/composition ────────┘
```

More explicitly:

### `domain/`
May depend on:
- TypeScript/platform-neutral language features;
- small `shared/` pure primitives.

Must **not** depend on:
- DOM;
- browser storage;
- Supabase SDK;
- network APIs;
- router/UI;
- service worker;
- concrete clock/random providers when deterministic injection is required.

### `application/`
May depend on:
- domain;
- shared;
- abstract ports/interfaces/read-model contracts.

Must not import concrete Supabase/IndexedDB adapters.

### `infrastructure/`
Implements application/domain ports using Supabase, IndexedDB, Realtime, Storage and external APIs.

Infrastructure may depend inward on application/domain types. Domain/application do not depend outward on infrastructure.

### `ui/`
May depend on:
- application services/facades;
- domain-safe display/read-model types;
- UI primitives/shared formatting.

Must not directly perform arbitrary Supabase table/RPC calls or contain authoritative permission/business-state enforcement.

### `app/composition/`
The composition root is the only normal place where concrete adapters are wired into services/ports.

### `import-export/`
Parsing/normalization/preview is isolated from authoritative mutations. Commit/apply passes through application/domain commands.

---

## 3. Bounded-context rule

A domain concern lives under its named bounded context. Examples:

- venue capacity rules → `domain/venues/`;
- guest probability aggregation → `domain/guests/`;
- seating assignment invariants → `domain/seating/`;
- money calculation/scenarios → `domain/budget/`;
- document supersession/readiness → `domain/documents/`.

Do not create a global `business-rules.ts` or `models.ts` containing unrelated contexts.

Cross-context behavior belongs in an application orchestration service or a deliberately named shared domain abstraction, not by importing internal files from another context indiscriminately.

---

## 4. Public module surface

Each bounded context exposes a small deliberate public surface.

Rules:

- internal implementation files are not imported across contexts unless explicitly part of that context's public contract;
- avoid wildcard barrel files that accidentally expose everything;
- a small `index.ts` is allowed only as an intentional public boundary, not as an automatic file aggregator;
- no import cycles through barrels.

Lot 0 must configure lint/boundary tooling or an equivalent check to detect forbidden cross-layer imports and cycles.

---

## 5. UI organization

### `ui/primitives/`
Low-level reusable accessible UI elements with no wedding-domain knowledge: button, input, dialog shell, badge primitive, tabs primitive, etc.

### `ui/components/`
Reusable composed components used by multiple screens, still not owners of business truth.

### `ui/layouts/`
App shell, responsive page frames, navigation structures.

### `ui/screens/<context>/`
Route/page-specific composition for a user job. Screens orchestrate display and actions through application services; they do not become business-rule containers.

A screen-specific component stays near its screen/context until reuse across contexts is demonstrated. Do not prematurely move everything to global `components/`.

---

## 6. Application organization

A context may contain:

```text
application/venues/
├── services/
├── commands/
├── queries/
├── read-models/
└── ports/
```

Use only the subfolders the context actually needs.

- **command**: explicit state-changing use case;
- **query/read model**: purpose-built read shape;
- **service**: orchestration of coherent use cases;
- **port**: interface required from infrastructure.

Do not create a single `VenueService` with dozens of unrelated methods merely to keep one class name.

---

## 7. Domain organization

Prefer small files named after real concepts:

```text
domain/budget/
├── money.ts
├── budget-item.ts
├── scenario.ts
├── payment-state.ts
├── calculate-scenario-total.ts
└── validate-payment-transition.ts
```

Avoid:
- `types.ts` with hundreds of unrelated definitions;
- `utils.ts`/`helpers.ts` dumping grounds;
- context-wide `constants.ts` with unrelated constants;
- giant mutable classes when pure value/rule functions are clearer.

A `types.ts` file is allowed only when it contains a tight cohesive family and remains within complexity/size limits.

---

## 8. Infrastructure organization

Concrete provider code is named by provider + concern, e.g.:

- `supabase-venue-repository.ts`;
- `supabase-auth-session-adapter.ts`;
- `indexeddb-pending-mutation-store.ts`;
- `supabase-private-storage-adapter.ts`.

Provider SDK result/error shapes are converted at the adapter boundary. Do not leak provider response objects throughout domain/application/UI code.

---

## 9. Testing placement

Frozen convention:

### Unit/domain/property tests
Colocate with the source as:

```text
calculate-scenario-total.ts
calculate-scenario-total.test.ts
calculate-scenario-total.property.test.ts
```

This keeps behavior/specification context close to the code.

### Cross-component/integration tests
Use `tests/integration/` grouped by capability/context.

### Security/adversarial tests
Use `tests/security/` and `supabase/tests/` for direct DB/RLS/SQL policy verification.

### E2E
Use `tests/e2e/` grouped by critical user journey/Acceptance IDs.

### Fixtures
Use `tests/fixtures/`, synthetic only. Never duplicate large fixtures inline across many tests.

---

## 10. Naming conventions

Source filenames: **kebab-case**.

Examples:
- `venue-detail-screen.ts`
- `calculate-expected-guests.ts`
- `supabase-venue-repository.ts`
- `budget-scenario.test.ts`

Type/class/interface names: **PascalCase**.

Functions/variables: **camelCase**.

Database objects: documented **snake_case**.

Do not create vague production filenames such as:
- `utils.ts`;
- `helpers.ts`;
- `common.ts`;
- `misc.ts`;
- `stuff.ts`;
- `manager.ts` without a specific domain noun;
- `service.ts` without a specific owner/context.

Generated code may follow generator conventions but must live in a clearly generated location and must not be hand-edited without a defined process.

---

## 11. Import aliases

Lot 0 should define stable aliases for major roots (for example `@app`, `@ui`, `@domain`, `@application`, `@infra`, `@shared`) or an equivalent approach.

Rules:
- avoid deep relative imports crossing multiple layer/context boundaries;
- aliases do not permit bypassing dependency rules;
- same-folder/simple nearby imports may remain relative.

---

## 12. No duplicate architectural paths

Do not simultaneously create patterns such as:

```text
src/services/venues.ts
src/application/venues/venue-service.ts
src/features/venues/service.ts
```

for the same responsibility.

If a new architectural category seems necessary, document why the existing structure cannot represent it and use an ADR if the change is material.

---

## 13. Ownership discoverability

A contributor should be able to locate a behavior from its Feature ID/domain term using predictable paths.

Feature implementation records must list the owning modules. Important modules should reference relevant Feature/Requirement IDs in tests/docs rather than relying on comments everywhere.

Repository structure must remain navigable without IDE-specific metadata.

---

## 14. Exceptions

An exception to this structure requires:

1. explicit reason;
2. affected Feature IDs;
3. dependency/maintenance impact;
4. reviewer approval;
5. ADR if it changes a general architectural boundary.

Do not create a second architectural style because one task was inconvenient.
