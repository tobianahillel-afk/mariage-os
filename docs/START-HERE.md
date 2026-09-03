# Start Here

This is the mandatory onboarding entry point for anyone working on Mariage OS without prior conversation context.

If you remember one rule: **do not invent material behavior from intuition. Read the governing specification and current implementation status first.**

## Current gate

The V1 product specification is frozen as a design baseline, but **implementation is not yet authorized**.

Current required work:

1. finish documentation consolidation;
2. complete `FINAL-DESIGN-REVIEW.md` across product, architecture, data, UX, visual identity, security, quality and operations;
3. close every BLOCKING/MAJOR finding;
4. merge the documentation PR;
5. only then may Lot 0 be considered for start.

`FROZEN` means intended V1 behavior is defined; it does not mean review may be skipped.

Current progress source: `docs/roadmap/IMPLEMENTATION-STATUS.md`.

---

## 1. What Mariage OS is

Mariage OS is a private collaborative wedding-planning PWA for two partners. It centralizes venues, vendors, guests, seating, budget, documents, tasks, decisions, evidence, planning, the wedding timeline, Inbox/search, import/export and recovery.

It optimizes for:

1. **Understand** — know current state and reliability.
2. **Decide** — compare options and know what is missing.
3. **Act** — know the next useful action, owner and deadline.

Its visual thesis is **wedding editorial warmth × calm operating-system precision**. It is not a generic PM/CRM/social application and it must not degrade into an admin CRUD interface.

---

## 2. Mandatory reading order

### Master/freeze layer

1. `README.md`
2. `docs/roadmap/IMPLEMENTATION-STATUS.md` — exact current phase/next permitted action
3. `docs/PRODUCT-SPECIFICATION.md`
4. `docs/REQUIREMENTS-CATALOG.md`
5. `docs/FEATURE-LEDGER.md` — 104 trackable V1 capabilities
6. `docs/roadmap/V1-SCOPE.md`
7. `docs/DOCUMENTATION-AUDIT.md`
8. `docs/FINAL-DESIGN-REVIEW.md` once present
9. `docs/DEFERRED-DECISIONS.md`

### Product context

10. `docs/PRODUCT.md`
11. `docs/PRINCIPLES.md`
12. `docs/NON-GOALS.md`
13. `docs/USER-FLOWS.md`
14. `docs/ACCEPTANCE-SCENARIOS.md`

### UX / visual product system

15. `docs/ux/VISUAL-SYSTEM.md` — mandatory visual-design entry point
16. `docs/ux/UX-ARCHITECTURE.md` — page taxonomy and anti-mega-page rules
17. `docs/ux/NAVIGATION.md`
18. `docs/ux/SCREEN-BLUEPRINTS.md` — major-screen composition
19. `docs/ux/SCREEN-CONTRACTS.md` — route/action/state contracts
20. `docs/ux/VISUAL-IDENTITY.md` — brand personality/direction
21. `docs/ux/COLOR-SYSTEM.md` — frozen multi-color/domain palette architecture
22. `docs/ux/DESIGN-SYSTEM.md`
23. `docs/ux/MOTION-INTERACTION.md`
24. `docs/ux/SEO-METADATA-IMAGES.md`
25. `docs/ux/INTERACTION-STATES.md`
26. `docs/ux/FORMS-AUTOSAVE.md`
27. `docs/ux/UX-REVIEW-CHECKLIST.md`
28. `docs/ux/VISUAL-REVIEW-CHECKLIST.md`
29. `docs/ux/VISUAL-BENCHMARKS.md` — research input, never a copying target
30. `docs/ux/WIREFRAMES.md` — supporting low-fidelity sketches

### Architecture

31. `docs/architecture/OVERVIEW.md`
32. `docs/architecture/STACK.md`
33. `docs/architecture/TRUST-BOUNDARIES.md`
34. `docs/architecture/DATA-OWNERSHIP.md`
35. `docs/architecture/LOCAL-FIRST.md`
36. `docs/architecture/SYNC.md`
37. `docs/architecture/OFFLINE.md`
38. `docs/architecture/PWA-LIFECYCLE.md`
39. `docs/architecture/STORAGE.md`
40. `docs/architecture/LOCAL-DATA-SCHEMA.md`
41. `docs/architecture/REPOSITORY-SERVICE-CONTRACTS.md`
42. `docs/architecture/DEPENDENCY-GRAPH.md`
43. relevant ADRs.

### Domain/data

44. `docs/domain/ERD.md`
45. `docs/domain/PHYSICAL-SCHEMA-V1.md`
46. `docs/domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md`
47. `docs/domain/DATA-DICTIONARY.md`
48. `docs/domain/IDENTIFIERS.md`
49. `docs/domain/DATES-TIME.md`
50. `docs/domain/MONEY.md`
51. `docs/domain/STATE-MACHINES.md`
52. `docs/domain/INVARIANTS.md`
53. `docs/domain/FACTS-SOURCES.md`
54. `docs/domain/FACT-VALUE-TYPES.md`
55. `docs/domain/CRITERIA-EVALUATION.md`
56. `docs/domain/DEFAULT-CRITERIA.md`
57. `docs/domain/CONFIDENCE-FRESHNESS.md`
58. `docs/domain/DERIVED-DATA.md`
59. relevant specialized domain document.

### Security/quality/operations

60. applicable `docs/security/*`.
61. applicable `docs/quality/*`.
62. applicable `docs/operations/*`.
63. `docs/engineering/CODING-STANDARDS.md`.
64. `docs/engineering/ERROR-HANDLING.md`.
65. `docs/engineering/MIGRATIONS.md`.
66. `docs/engineering/DEFINITION-OF-DONE.md`.

### Implementation governance / feature / lot

67. `docs/engineering/IMPLEMENTATION-PLAYBOOK.md`.
68. relevant `docs/features/<FEATURE>.md`.
69. import/export contract if data enters/leaves the system.
70. `docs/roadmap/LOTS.md`.
71. `docs/roadmap/LOT-ACCEPTANCE.md`.
72. `docs/roadmap/INTEGRATION-CHECKPOINTS.md`.
73. `docs/reviews/README.md`.
74. `CONTRIBUTING.md`.

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
- Required quality/security/UX/visual gates cannot be bypassed.
- UX remains summary-first, multi-page where appropriate and mobile-adapted; exposing every available field on one page is not acceptable implementation.
- The frozen multi-color visual system may not be simplified into a generic one-accent admin theme for implementation convenience.

---

## 4. Sources of truth

- **Product truth:** frozen/reviewed normative documentation in Git.
- **Visual/UX truth:** `docs/ux/VISUAL-SYSTEM.md` and its governing visual/UX contracts.
- **Feature implementation truth:** `FEATURE-LEDGER.md` + Feature Implementation Records/evidence.
- **Development progress truth:** `roadmap/IMPLEMENTATION-STATUS.md`.
- **Schema/code truth:** migrations and typed contracts in Git.
- **Production wedding truth:** authorized Supabase project data.
- **Offline working state:** project-scoped IndexedDB/local queue.
- **Portable recovery truth:** verified `.mariage` backups.
- **Legacy pre-cutover truth:** existing spreadsheets/research files.

After formal V1 cutover, legacy sources become read-only archives.

---

## 5. Never commit real production/private data

Never commit real guest contact details, partner notes/ratings, budgets/payments, quotes/contracts/invoices, private photos, production dumps, `.mariage` backups, PII-bearing logs, service-role keys, auth tokens or equivalent secrets.

Fixtures/examples/screenshots used for review are synthetic.

---

## 6. When documentation is insufficient

If a question materially affects user behavior, UX/navigation, visual identity, data semantics, security/privacy, synchronization, import/export, migration/compatibility or V1 scope and the answer is not specified:

1. check `DEFERRED-DECISIONS.md`;
2. if not intentionally deferred, treat it as a documentation defect;
3. update the governing specification/requirement/UX/visual contract;
4. create ADR if architectural;
5. update Feature Ledger/FIR and acceptance verification.

Do not pick silently.

---

## 7. Implementation flow after the gate opens

Only after `FINAL-DESIGN-REVIEW.md` declares **implementation gate OPEN** and the documentation PR is merged:

1. read current `IMPLEMENTATION-STATUS.md`;
2. identify current lot and eligible Feature IDs;
3. review lot/checkpoint dependencies;
4. complete Feature Implementation Record before meaningful implementation;
5. read the applicable visual/UX contracts before rendering the feature;
6. implement the smallest coherent vertical slice;
7. update Feature Ledger state;
8. verify visual/UX quality as well as technical behavior;
9. add required tests/security/visual evidence;
10. run local/full verification;
11. perform lot acceptance;
12. every 3–4 lots perform mandatory integration checkpoint;
13. update status/handoff before stopping work.

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

The interface remains simpler and more beautiful than the underlying model: information is divided into purposeful screens, detail is progressively revealed, mobile workflows are adapted rather than compressed, color/imagery/motion create orientation and delight without noise, and critical data remains explainable, secure, portable and recoverable.
