# Work Packet Record — WP-0.6

## Identity

- Work Packet ID: `WP-0.6`
- Lot: `0`
- Name: Lot integration, adversarial review, reconciliation and acceptance
- State: `IN_PROGRESS`
- Current pass: `A-IMPLEMENT`
- Primary bounded context: Lot 0 integration/acceptance
- Branch/PR: `lot-0/repository-tooling`

## Scope

- execute the full `npm run verify` command from a clean CI checkout;
- prove no production credentials or real wedding data are required;
- prove deliberate quality/security violations are still rejected;
- reconcile every Lot 0 responsibility against accepted/evidenced implementation;
- perform a separate Lot Integration Pass after packet-level acceptance;
- inspect exact-head diff for scope leakage and unresolved temporary scaffolding;
- update durable status and make the Lot 0 acceptance decision.

## Critical scope boundary

WP-0.6 may only integrate and verify Lot 0 engineering foundations. It must not implement Auth/project/member tables, product repositories, wedding-domain schema/features, real provider integrations, production infrastructure cutover, or any Lot 1–12 Feature ID.

## Pass A — IMPLEMENT

Required evidence:

- clean checkout + `npm ci`;
- Playwright browser installation needed by the full verification command;
- a single `npm run verify` invocation completes successfully;
- the command includes environment/secret/dependency safeguards, static/type/unit/property/coverage gates, deliberate negative controls, E2E, mutation, build and direct DB/RLS verification;
- Supabase is stopped after the verification path;
- no production credential is injected;
- accepted packet evidence remains non-regressed.

## Pass B — ADVERSARIAL REVIEW

Not started.

## Pass C — ACCEPTANCE / LOT RECONCILIATION

Not started.
