# Start Here

This document is the mandatory entry point for anyone working on Mariage OS without prior context.

## 1. What the product is

Mariage OS is a private collaborative wedding-planning PWA for a couple. It centralizes decision-making, progress, venues, vendors, guests, budget, documents, tasks, evidence and planning.

The product must optimize for three outcomes:

1. **Understand** — know the current state and what is reliable.
2. **Decide** — compare options and understand what is still missing.
3. **Act** — know the next useful action, owner and deadline.

## 2. Read in this order

1. `README.md`
2. `docs/PRODUCT.md`
3. `docs/PRINCIPLES.md`
4. `docs/NON-GOALS.md`
5. `docs/architecture/OVERVIEW.md`
6. `docs/architecture/STACK.md`
7. `docs/architecture/TRUST-BOUNDARIES.md`
8. `docs/architecture/DATA-OWNERSHIP.md`
9. `docs/architecture/LOCAL-FIRST.md`
10. `docs/architecture/SYNC.md`
11. `docs/architecture/OFFLINE.md`
12. `docs/ux/NAVIGATION.md`
13. `docs/ux/INTERACTION-STATES.md`
14. `docs/engineering/DEFINITION-OF-DONE.md`
15. `docs/roadmap/LOTS.md`

Future documentation batches will add the full database dictionary, state machines, threat model, ASVS matrix, import/export contracts, quality strategy, CI/CD, testing matrix, backup/disaster recovery and feature specifications.

## 3. Hard project constraints

These are not suggestions:

- The normal production architecture must remain usable at **€0/month** on free tiers.
- Real wedding data is private and must never be committed to the public GitHub repository.
- Supabase is the shared cloud source of truth; IndexedDB is the local working cache/offline queue.
- Authorization must be enforced at the database/storage layer, never only in frontend UI.
- Every critical fact must be able to carry source/provenance and confidence.
- Confirmed/contractual data must never be silently overwritten by weaker imports.
- No destructive import or sync behavior is silent.
- Offline edits must not be silently lost.
- Every critical feature must be testable deterministically.
- No release may bypass required quality gates.

## 4. Development workflow

Until documentation is complete, work belongs on documentation branches only.

After implementation starts:

1. Create a feature branch.
2. Update or add the relevant specification first when behavior changes.
3. Implement the smallest coherent change.
4. Add unit/integration/security/E2E tests as applicable.
5. Run the full local verification command.
6. Open a pull request.
7. CI reruns the complete required suite from a clean environment.
8. Merge only when all mandatory gates pass.

## 5. Source-of-truth rule

There are several kinds of truth:

- **Product truth**: documentation in Git.
- **Schema truth**: migrations and typed contracts in Git.
- **Production wedding truth**: Supabase production project.
- **Offline working state**: IndexedDB on each authorized device.
- **Portable recovery truth**: validated `.mariage` exports.

Do not confuse them.

## 6. What must never be added to this public repository

- Production `.env` values containing secrets.
- Supabase service-role or secret keys.
- Real guest names/contact details.
- Real partner notes or private decisions.
- Real quotes/contracts/invoices/payment evidence.
- Production database dumps.
- Real private photos.
- `.mariage` project backups.
- Debug logs containing personal data.

All fixtures and examples must be synthetic.

## 7. Definition of success

The application succeeds if either partner can open it on a phone or computer and quickly know:

- what is done;
- what is not done;
- what is uncertain;
- what is blocking progress;
- what requires a joint decision;
- what costs money and when;
- what action matters next;
- why a prior decision was made.

The interface should remain simpler than the underlying model.
