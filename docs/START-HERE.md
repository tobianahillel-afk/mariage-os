# Start Here

This is the mandatory onboarding entry point for anyone working on Mariage OS without prior conversation context.

If you remember one rule: **do not invent material behavior from intuition. Read the governing specification first.**

## Current gate

The V1 product specification is frozen as a design baseline, but **implementation is not yet authorized**.

Current required work:

1. finish documentation consolidation;
2. complete `FINAL-DESIGN-REVIEW.md` across product, architecture, data, UX, security, quality and operations;
3. close every BLOCKING/MAJOR finding;
4. merge the documentation PR;
5. only then may Lot 0 be considered for start.

`FROZEN` means the intended V1 behavior is defined; it does not mean review may be skipped.

---

## 1. What Mariage OS is

Mariage OS is a private collaborative wedding-planning PWA for two partners. It centralizes venues, vendors, guests, seating, budget, documents, tasks, decisions, evidence, planning, the wedding timeline, Inbox/search, import/export and recovery.

It optimizes for:

1. **Understand** — know current state and reliability.
2. **Decide** — compare options and know what is missing.
3. **Act** — know the next useful action, owner and deadline.

It is not a generic PM/CRM/social application.

---

## 2. Mandatory reading order

### Master/freeze layer

1. `README.md`
2. `docs/PRODUCT-SPECIFICATION.md`
3. `docs/REQUIREMENTS-CATALOG.md`
4. `docs/roadmap/V1-SCOPE.md`
5. `docs/DOCUMENTATION-AUDIT.md`
6. `docs/FINAL-DESIGN-REVIEW.md` once present
7. `docs/DEFERRED-DECISIONS.md`

### Product context

8. `docs/PRODUCT.md`
9. `docs/PRINCIPLES.md`
10. `docs/NON-GOALS.md`
11. `docs/USER-FLOWS.md`
12. `docs/ACCEPTANCE-SCENARIOS.md`

### Architecture

13. `docs/architecture/OVERVIEW.md`
14. `docs/architecture/STACK.md`
15. `docs/architecture/TRUST-BOUNDARIES.md`
16. `docs/architecture/DATA-OWNERSHIP.md`
17. `docs/architecture/LOCAL-FIRST.md`
18. `docs/architecture/SYNC.md`
19. `docs/architecture/OFFLINE.md`
20. `docs/architecture/PWA-LIFECYCLE.md`
21. `docs/architecture/STORAGE.md`
22. `docs/architecture/LOCAL-DATA-SCHEMA.md`
23. `docs/architecture/REPOSITORY-SERVICE-CONTRACTS.md`
24. `docs/architecture/DEPENDENCY-GRAPH.md`
25. relevant ADRs.

### Domain/data

26. `docs/domain/ERD.md`
27. `docs/domain/PHYSICAL-SCHEMA-V1.md`
28. `docs/domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md`
29. `docs/domain/DATA-DICTIONARY.md`
30. `docs/domain/IDENTIFIERS.md`
31. `docs/domain/DATES-TIME.md`
32. `docs/domain/MONEY.md`
33. `docs/domain/STATE-MACHINES.md`
34. `docs/domain/INVARIANTS.md`
35. `docs/domain/FACTS-SOURCES.md`
36. `docs/domain/FACT-VALUE-TYPES.md`
37. `docs/domain/CRITERIA-EVALUATION.md`
38. `docs/domain/DEFAULT-CRITERIA.md`
39. `docs/domain/CONFIDENCE-FRESHNESS.md`
40. `docs/domain/DERIVED-DATA.md`
41. relevant specialized domain document.

### Security/quality/operations

42. applicable `docs/security/*`.
43. applicable `docs/quality/*`.
44. applicable `docs/operations/*`.
45. `docs/engineering/CODING-STANDARDS.md`.
46. `docs/engineering/ERROR-HANDLING.md`.
47. `docs/engineering/MIGRATIONS.md`.
48. `docs/engineering/DEFINITION-OF-DONE.md`.

### Feature/lot

49. relevant `docs/features/<FEATURE>.md`.
50. `docs/ux/SCREEN-CONTRACTS.md`.
51. import/export contract if data enters/leaves the system.
52. `docs/roadmap/LOTS.md`.
53. `docs/roadmap/LOT-ACCEPTANCE.md`.
54. `CONTRIBUTING.md`.

You do not reread every document for every tiny edit, but you must read every governing contract for the behavior being changed.

---

## 3. Hard constraints

- Normal operation targets **€0/month**.
- Production is a controlled single-couple deployment, not open project signup.
- Real wedding data never belongs in public Git.
- Supabase is shared cloud truth; IndexedDB is local working/offline state.
- Database/Storage RLS and same-project referential integrity enforce isolation.
- Important facts retain provenance/confidence/freshness/conflicts.
- Strong confirmed/contractual data is protected from weaker silent overwrite.
- Imports are previewed and non-destructive by default.
- Offline/session/PWA transitions do not silently lose confirmed local work.
- Financial/date/fact semantics follow their domain contracts.
- Portable backup/restore is first-class.
- Required quality/security gates cannot be bypassed.

---

## 4. Sources of truth

- **Product truth:** frozen/reviewed normative documentation in Git.
- **Schema/code truth:** migrations and typed contracts in Git.
- **Production wedding truth:** authorized Supabase project data.
- **Offline working state:** project-scoped IndexedDB/local queue.
- **Portable recovery truth:** verified `.mariage` backups.
- **Legacy pre-cutover truth:** existing spreadsheets/research files.

After formal V1 cutover, legacy sources become read-only archives.

---

## 5. Never commit real production/private data

Never commit real guest contact details, partner notes/ratings, budgets/payments, quotes/contracts/invoices, private photos, production dumps, `.mariage` backups, PII-bearing logs, service-role keys, auth tokens or equivalent secrets.

Fixtures/examples are synthetic.

---

## 6. When documentation is insufficient

If a question materially affects user behavior, data semantics, security/privacy, synchronization, import/export, migration/compatibility or V1 scope and the answer is not specified:

1. check `DEFERRED-DECISIONS.md`;
2. if not intentionally deferred, treat it as a documentation defect;
3. update the governing specification/requirement;
4. create ADR if architectural;
5. update acceptance verification.

Do not pick silently.

---

## 7. Implementation flow after the gate opens

Only after `FINAL-DESIGN-REVIEW.md` declares **implementation gate OPEN** and the documentation PR is merged:

1. identify current lot;
2. read its acceptance contract;
3. create feature branch;
4. reference requirement IDs;
5. update spec first when behavior changes;
6. implement smallest coherent unit;
7. add required tests/security evidence;
8. run local/full verification;
9. merge only with required gates green.

The first implementation lot remains **Lot 0 — Repository and tooling**, but this file does not authorize starting it before the final review gate opens.

---

## 8. Definition of success

Either partner can quickly answer:

- What is done?
- What is unknown/stale/conflicting?
- What blocks us?
- What are we waiting for?
- What do we need to decide together?
- What should I/we do now?
- What costs money and when?
- What has been paid/committed?
- Why did we make an important decision?
- Is our project synchronized and recoverable?

The interface remains simpler than the underlying model, while critical data remains explainable, secure, portable and recoverable.
