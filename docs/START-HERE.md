# Start Here

This is the mandatory onboarding entry point for anyone working on Mariage OS without prior conversation context.

If you remember one rule: **do not invent material behavior from intuition. Read the governing specification and current implementation status first.**

## Current gate

The V1 product specification is frozen as a design baseline, but **implementation is not yet authorized**.

Current required work:

1. finish documentation consolidation;
2. complete `FINAL-DESIGN-REVIEW.md` across product, architecture, data, UX, visual identity, public-readiness, security, quality and operations;
3. close every BLOCKING/MAJOR finding;
4. merge the documentation PR;
5. only then may Lot 0 be considered for start.

`FROZEN` means intended V1 behavior is defined; it does not mean review may be skipped.

Current progress source: `docs/roadmap/IMPLEMENTATION-STATUS.md`.

---

## 1. What Mariage OS is

Mariage OS is a collaborative, local-first wedding-planning PWA centered on a private wedding project shared by partners. It centralizes venues, vendors, guests, seating, budget, documents, tasks, decisions, evidence, planning, the wedding timeline, Inbox/search, import/export and recovery.

The **first real production deployment is private for one couple**, but the **core architecture is multi-tenant/public-ready from V1**. A future public SaaS launch must be achievable by activating protected signup/provisioning/quotas/legal/support layers rather than rewriting the wedding-domain engine.

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
4. `docs/PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md`
5. `docs/REQUIREMENTS-CATALOG.md`
6. `docs/FEATURE-LEDGER.md` — 104 trackable V1 capabilities
7. `docs/roadmap/V1-SCOPE.md`
8. `docs/DOCUMENTATION-AUDIT.md`
9. `docs/FINAL-DESIGN-REVIEW.md`
10. `docs/DEFERRED-DECISIONS.md`

### Product context

11. `docs/PRODUCT.md`
12. `docs/PRINCIPLES.md`
13. `docs/NON-GOALS.md`
14. `docs/USER-FLOWS.md`
15. `docs/ACCEPTANCE-SCENARIOS.md`

### UX / visual product system

16. `docs/ux/VISUAL-SYSTEM.md` — mandatory visual-design entry point
17. `docs/ux/UX-ARCHITECTURE.md` — page taxonomy and anti-mega-page rules
18. `docs/ux/NAVIGATION.md`
19. `docs/ux/SCREEN-BLUEPRINTS.md` — major-screen composition
20. `docs/ux/SCREEN-CONTRACTS.md` — screen jobs/actions/states
21. `docs/ux/SCREEN-CONTRACTS-PROJECT-SCOPE-ADDENDUM.md` — canonical project-scoped authenticated routes
22. `docs/ux/PUBLIC-WEB-SHELL.md` — future public marketing/Auth vs private app boundary
23. `docs/ux/VISUAL-IDENTITY.md` — brand personality/direction
24. `docs/ux/COLOR-SYSTEM.md` — frozen multi-color/domain palette architecture
25. `docs/ux/DESIGN-SYSTEM.md`
26. `docs/ux/MOTION-INTERACTION.md`
27. `docs/ux/SEO-METADATA-IMAGES.md`
28. `docs/ux/INTERACTION-STATES.md`
29. `docs/ux/FORMS-AUTOSAVE.md`
30. `docs/ux/UX-REVIEW-CHECKLIST.md`
31. `docs/ux/VISUAL-REVIEW-CHECKLIST.md`
32. `docs/ux/VISUAL-BENCHMARKS.md` — research input, never a copying target
33. `docs/ux/WIREFRAMES.md` — supporting low-fidelity sketches

### Architecture

34. `docs/architecture/OVERVIEW.md`
35. `docs/architecture/STACK.md`
36. `docs/architecture/PUBLIC-SAAS-READINESS.md` — mandatory anti-single-couple architecture constraint
37. `docs/architecture/TRUST-BOUNDARIES.md`
38. `docs/architecture/DATA-OWNERSHIP.md`
39. `docs/architecture/LOCAL-FIRST.md`
40. `docs/architecture/SYNC.md`
41. `docs/architecture/OFFLINE.md`
42. `docs/architecture/PWA-LIFECYCLE.md`
43. `docs/architecture/STORAGE.md`
44. `docs/architecture/LOCAL-DATA-SCHEMA.md`
45. `docs/architecture/REPOSITORY-SERVICE-CONTRACTS.md`
46. `docs/architecture/DEPENDENCY-GRAPH.md`
47. relevant ADRs.

### Domain/data

48. `docs/domain/TENANCY-MODEL.md` — project/user/membership model
49. `docs/domain/ERD.md`
50. `docs/domain/PHYSICAL-SCHEMA-V1.md`
51. `docs/domain/PHYSICAL-SCHEMA-V1-ADDENDUM.md`
52. `docs/domain/DATA-DICTIONARY.md`
53. `docs/domain/IDENTIFIERS.md`
54. `docs/domain/DATES-TIME.md`
55. `docs/domain/MONEY.md`
56. `docs/domain/STATE-MACHINES.md`
57. `docs/domain/INVARIANTS.md`
58. `docs/domain/FACTS-SOURCES.md`
59. `docs/domain/FACT-VALUE-TYPES.md`
60. `docs/domain/CRITERIA-EVALUATION.md`
61. `docs/domain/DEFAULT-CRITERIA.md`
62. `docs/domain/CONFIDENCE-FRESHNESS.md`
63. `docs/domain/DERIVED-DATA.md`
64. relevant specialized domain document.

### Security/quality/operations

65. applicable `docs/security/*`, including `security/PUBLIC-ABUSE-PROTECTION.md` for public-readiness changes.
66. applicable `docs/quality/*`.
67. applicable `docs/operations/*`, including `operations/PUBLIC-LAUNCH-GATE.md` before any public self-service activation.
68. `docs/engineering/CODING-STANDARDS.md`.
69. `docs/engineering/ERROR-HANDLING.md`.
70. `docs/engineering/MIGRATIONS.md`.
71. `docs/engineering/DEFINITION-OF-DONE.md`.

### Implementation governance / feature / lot

72. `docs/engineering/IMPLEMENTATION-PLAYBOOK.md`.
73. relevant `docs/features/<FEATURE>.md`.
74. import/export contract if data enters/leaves the system.
75. `docs/roadmap/LOTS.md`.
76. `docs/roadmap/LOT-ACCEPTANCE.md`.
77. `docs/roadmap/INTEGRATION-CHECKPOINTS.md`.
78. `docs/reviews/README.md`.
79. `CONTRIBUTING.md`.

You do not reread every document for every tiny edit, but you must read every governing contract for the behavior being changed.

---

## 3. Hard constraints

- Normal **private V1** operation targets **€0/month**.
- Real production initially uses controlled `private_pair` provisioning, not open project signup.
- **Core domain architecture is multi-tenant/public-ready from V1**; private deployment restrictions are policy, not schema assumptions.
- A user may belong to multiple projects in the model/tests even if the real V1 couple has one project.
- Canonical authenticated routes/services/local state carry explicit project context.
- A future public launch must not require redesigning project-scoped domain tables, RLS, Storage isolation or local-first architecture.
- Real wedding data never belongs in public Git.
- Supabase is shared cloud truth; IndexedDB is account/project-scoped local working/offline state.
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
- Public wedding-project data is **not** made searchable/indexable merely because the product itself later becomes publicly available.

---

## 4. Sources of truth

- **Product truth:** frozen/reviewed normative documentation in Git.
- **Public-readiness truth:** `PRODUCT-SPECIFICATION-PUBLIC-READINESS-ADDENDUM.md` + `architecture/PUBLIC-SAAS-READINESS.md` + `domain/TENANCY-MODEL.md`.
- **Visual/UX truth:** `docs/ux/VISUAL-SYSTEM.md` and its governing visual/UX contracts.
- **Feature implementation truth:** `FEATURE-LEDGER.md` + Feature Implementation Records/evidence.
- **Development progress truth:** `roadmap/IMPLEMENTATION-STATUS.md`.
- **Schema/code truth:** migrations and typed contracts in Git.
- **Production wedding truth:** authorized Supabase project data.
- **Offline working state:** account/project-scoped IndexedDB/local queue.
- **Portable recovery truth:** verified `.mariage` backups.
- **Legacy pre-cutover truth:** existing spreadsheets/research files.

After formal V1 cutover, legacy sources become read-only archives.

---

## 5. Never commit real production/private data

Never commit real guest contact details, partner notes/ratings, budgets/payments, quotes/contracts/invoices, private photos, production dumps, `.mariage` backups, PII-bearing logs, service-role keys, auth tokens or equivalent secrets.

Fixtures/examples/screenshots used for review are synthetic.

Future public marketing screenshots/assets must also use synthetic/public-safe data, never production wedding content.

---

## 6. When documentation is insufficient

If a question materially affects user behavior, UX/navigation, visual identity, tenancy/public-readiness, data semantics, security/privacy, synchronization, import/export, migration/compatibility or V1 scope and the answer is not specified:

1. check `DEFERRED-DECISIONS.md`;
2. if not intentionally deferred, treat it as a documentation defect;
3. update the governing specification/requirement/UX/visual/public-readiness contract;
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
5. read applicable visual/UX and public-readiness contracts before rendering/persisting the feature;
6. implement the smallest coherent vertical slice;
7. update Feature Ledger state;
8. verify visual/UX quality as well as technical behavior;
9. verify no single-couple shortcut weakened multi-tenant/public-ready architecture;
10. add required tests/security/visual evidence;
11. run local/full verification;
12. perform lot acceptance;
13. every 3–4 lots perform mandatory integration checkpoint;
14. update status/handoff before stopping work.

The first implementation lot remains **Lot 0 — Repository and tooling**, but this file does not authorize starting it before the final review gate opens.

---

## 8. Definition of success

For the real private project, either partner can quickly answer:

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

For architecture review, the implementation must also answer:

> Could multiple unrelated couples run the same domain engine/backend while remaining correctly isolated, if public provisioning were enabled later?

The interface remains simpler and more beautiful than the underlying model: information is divided into purposeful screens, detail is progressively revealed, mobile workflows are adapted rather than compressed, color/imagery/motion create orientation and delight without noise, and critical data remains explainable, secure, portable and recoverable.
