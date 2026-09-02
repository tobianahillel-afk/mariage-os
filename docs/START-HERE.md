# Start Here

This is the mandatory onboarding entry point for anyone working on Mariage OS without prior conversation context.

If you remember only one rule: **do not invent behavior from intuition when the repository already contains a normative contract. Read the relevant specification first.**

---

## 1. What Mariage OS is

Mariage OS is a private collaborative wedding-planning PWA for a couple. It centralizes decision-making, progress, venues, vendors, guests, budget, documents, tasks, evidence and planning.

The product optimizes for three outcomes:

1. **Understand** — know current state and reliability.
2. **Decide** — compare options and know what is missing.
3. **Act** — know the next useful action, owner and deadline.

It is not a generic PM/CRM/social platform.

---

## 2. Mandatory reading order before substantial implementation

### Product

1. `README.md`
2. `docs/PRODUCT-SPECIFICATION.md` — master cahier des charges
3. `docs/REQUIREMENTS-CATALOG.md` — stable requirement IDs
4. `docs/PRODUCT.md` — product framing/jobs
5. `docs/PRINCIPLES.md`
6. `docs/NON-GOALS.md`
7. `docs/roadmap/V1-SCOPE.md`
8. `docs/DEFERRED-DECISIONS.md`

### Architecture

9. `docs/architecture/OVERVIEW.md`
10. `docs/architecture/STACK.md`
11. `docs/architecture/TRUST-BOUNDARIES.md`
12. `docs/architecture/DATA-OWNERSHIP.md`
13. `docs/architecture/LOCAL-FIRST.md`
14. `docs/architecture/SYNC.md`
15. `docs/architecture/OFFLINE.md`
16. `docs/architecture/PWA-LIFECYCLE.md`
17. `docs/architecture/STORAGE.md`
18. `docs/architecture/DEPENDENCY-GRAPH.md`
19. relevant ADRs in `docs/adr/`

### Domain

20. `docs/domain/ERD.md`
21. `docs/domain/DATA-DICTIONARY.md`
22. `docs/domain/IDENTIFIERS.md`
23. `docs/domain/DATES-TIME.md`
24. `docs/domain/MONEY.md`
25. `docs/domain/STATE-MACHINES.md`
26. `docs/domain/INVARIANTS.md`
27. `docs/domain/FACTS-SOURCES.md`
28. `docs/domain/CONFIDENCE-FRESHNESS.md`
29. `docs/domain/DERIVED-DATA.md`
30. relevant domain file for the feature being implemented

### Security and quality

31. all applicable `docs/security/*` documents
32. all applicable `docs/quality/*` documents
33. `docs/engineering/CODING-STANDARDS.md`
34. `docs/engineering/ERROR-HANDLING.md`
35. `docs/engineering/MIGRATIONS.md`
36. `docs/engineering/DEFINITION-OF-DONE.md`

### Feature/lot

37. relevant `docs/features/<FEATURE>.md`
38. import/export contract if data enters/leaves the system
39. `docs/roadmap/LOTS.md`
40. `docs/roadmap/LOT-ACCEPTANCE.md`
41. `CONTRIBUTING.md`

You do not need to reread every document for every small change, but you must understand the foundation and read every document applicable to the lot/behavior being changed.

---

## 3. Hard constraints

These are not suggestions:

- Normal production operation targets **€0/month**.
- Real wedding data is private and never belongs in the public GitHub repository.
- Supabase is shared cloud truth; IndexedDB is local working/cache/offline state.
- Authorization is enforced at database/storage level, never only UI.
- Important facts can retain provenance/confidence/freshness/conflicts.
- Confirmed/contractual data is not silently overwritten by weaker imports.
- Imports are previewed and non-destructive by default.
- Offline edits are not silently lost.
- Money/date semantics follow their domain specs.
- Required quality gates cannot be bypassed for a release.
- Open portable backup/recovery is a first-class capability.

---

## 4. Sources of truth

Do not confuse these layers:

- **Product truth:** normative documentation in Git.
- **Schema/code truth:** migrations and typed contracts in Git.
- **Production wedding truth:** authorized Supabase production data.
- **Offline working state:** IndexedDB/local queue on each device.
- **Portable recovery truth:** validated `.mariage` exports.
- **Legacy truth before V1 cutover:** existing spreadsheets/research sources.

After formal cutover, legacy sources become archival rather than independently edited sources of truth.

---

## 5. What must never be committed

Never add real:

- guest names/contact details;
- private partner notes/ratings/decisions;
- real budget/payment data;
- quotes/contracts/invoices/RIB-like sensitive documents;
- production DB dumps;
- private photos;
- `.mariage` project backups;
- production debug logs with PII;
- Supabase service-role/secret keys;
- authentication tokens.

Examples/fixtures must be synthetic.

---

## 6. Development flow after documentation merge

1. Identify the current implementation lot.
2. Read its acceptance contract.
3. Create a feature branch.
4. Reference requirement IDs affected.
5. Update spec first if behavior changes.
6. Implement smallest coherent unit.
7. Add applicable unit/property/integration/RLS/security/E2E/accessibility tests.
8. Run fast local tests while iterating.
9. Run full `npm run verify` before push once Lot 0 defines it.
10. Open PR.
11. CI runs complete required gates from clean state.
12. Merge only when all blocking gates pass.

No implementation lot may silently weaken an earlier invariant/security guarantee.

---

## 7. How to decide when documentation is insufficient

If implementation encounters a question that materially affects:

- user behavior;
- data semantics;
- security/privacy;
- synchronization;
- import/export;
- compatibility/migration;
- V1 scope;

and the answer is not specified, do **not** pick silently.

Check `docs/DEFERRED-DECISIONS.md`. If the choice is not intentionally deferred, create/update the specification or ADR before merging behavior.

---

## 8. Current project phase

The four design/documentation runs define the complete pre-code specification.

Once Run 4 is merged, the next permitted implementation work is:

**Lot 0 — Repository and tooling**

Do not jump directly to venue UI or production Supabase data.

See:

- `docs/IMPLEMENTATION-READINESS.md`
- `docs/roadmap/LOT-ACCEPTANCE.md`

---

## 9. Definition of product success

Either partner can open the application and quickly answer:

- What is done?
- What is not done?
- What is uncertain?
- What is blocking us?
- What are we waiting for?
- What do we need to decide together?
- What should I do now?
- What costs money and when?
- Why did we make a previous decision?

The interface remains simpler than the underlying model, and important data remains explainable, secure, recoverable and portable.
