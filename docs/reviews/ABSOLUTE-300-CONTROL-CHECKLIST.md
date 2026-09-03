# Mariage OS — Absolute 300-Control Readiness Checklist

Status: **Normative completeness checklist / reusable scorecard**

Purpose: define exactly what must be objectively true before Mariage OS may be described as 100% complete/verified across documentation, implementation, security, data, UX, release engineering and V1→V2 lifecycle.

## What “100%” means

There are several different 100% gates:

- **100% documentation-ready**: every design/documentation control that can be proved before code is closed; zero unresolved BLOCKING/MAJOR finding.
- **100% implementation-ready**: Lot 0 executable tooling/CI exists and proves the documented engineering rules.
- **100% V1 verified**: code, migrations, browser/device tests, security/RLS evidence, backups and checkpoints pass.
- **100% production/cutover-ready**: real-data reconciliation, recovery drill, owner acceptance and production release evidence pass.
- **100% V2-upgrade-ready**: V1.x→V2 migration is rehearsed across cloud, local, sync, import, backup and every changed interface.

A document mentioning a rule is not enough. Each control is complete only with evidence appropriate to its phase.

---

## 01 — LLM cold-start / source of truth

- [ ] **C001** Root `AGENTS.md` is the first AI-agent contract and is referenced by README/START-HERE.
- [ ] **C002** `IMPLEMENTATION-STATUS.md` states exact phase, gate, lot, blockers and next permitted action.
- [ ] **C003** Document precedence explicitly resolves base-vs-addendum conflicts.
- [ ] **C004** A material task routes to the minimum governing documents without reading the whole repository.
- [ ] **C005** Agent identifies Feature/Requirement/Acceptance IDs before material implementation.
- [ ] **C006** Unspecified material semantics trigger a documentation defect instead of silent invention.
- [ ] **C007** Chat history is never the sole source of implementation truth.
- [ ] **C008** End-of-session handoff records blockers, evidence and next action in repository state.
- [ ] **C009** Cold-start simulations cover feature, bug, DB, security, UX, refactor and handoff tasks.
- [ ] **C010** Cold-start simulation is rerun after major governance/architecture changes and checkpoints.

## 02 — Product mission / scope

- [ ] **C011** Product mission and primary couple jobs are frozen and unambiguous.
- [ ] **C012** V1 feature boundary is explicit.
- [ ] **C013** Post-V1 feature boundary is explicit.
- [ ] **C014** Private first deployment vs public-ready architecture is explicitly separated.
- [ ] **C015** Non-goals prevent drift into unrelated PM/CRM/social features.
- [ ] **C016** Scope changes require documented approval and traceability impact.
- [ ] **C017** P0/P1/P2 priority semantics are stable.
- [ ] **C018** Feature removal/deprecation has an explicit migration/communication path.
- [ ] **C019** Product behavior cannot change only in code without spec update.
- [ ] **C020** V2 scope is an explicit delta from accepted V1 baseline.

## 03 — Requirements / Feature / Acceptance traceability

- [ ] **C021** Every material V1 behavior has stable Requirement ID or cross-cutting control.
- [ ] **C022** Every user/system capability has stable Feature ID.
- [ ] **C023** Every critical behavior has Acceptance ID(s).
- [ ] **C024** Requirement→Feature mapping is complete.
- [ ] **C025** Acceptance→Feature mapping is complete.
- [ ] **C026** User-facing Feature→route/UX mapping is complete.
- [ ] **C027** Feature→domain/data ownership mapping is complete.
- [ ] **C028** Feature→security/offline/import impacts are recorded.
- [ ] **C029** Feature→tests/evidence mapping becomes executable during implementation.
- [ ] **C030** No P0/P1 is accepted with prose only and no objective evidence.

## 04 — UX information architecture / navigation

- [ ] **C031** Every primary route has one clear primary user job.
- [ ] **C032** Every route belongs to documented screen taxonomy.
- [ ] **C033** Desktop top-level navigation remains bounded/grouped.
- [ ] **C034** Mobile persistent navigation is bounded and genuinely adapted.
- [ ] **C035** Page/tab/drawer/dialog/inline-edit selection follows explicit rules.
- [ ] **C036** Collection screens do not default to mega-tables of every field.
- [ ] **C037** Detail uses summary→working detail→evidence/history hierarchy.
- [ ] **C038** Important workflows preserve return path and useful list context.
- [ ] **C039** High-risk/multi-step operations use focused workflows with preview/confirmation.
- [ ] **C040** Navigation changes reconcile route-feature matrix and affected journeys.

## 05 — Visual identity / design system

- [ ] **C041** Visual identity is frozen enough to prevent generic admin UI drift.
- [ ] **C042** Color/domain/semantic palette architecture is normative.
- [ ] **C043** Typography hierarchy rules are defined/accessibility-safe.
- [ ] **C044** Spacing/layout density rules are consistent.
- [ ] **C045** Component states use consistent tokens/patterns.
- [ ] **C046** Critical status never relies on color alone.
- [ ] **C047** Images are used only when they improve context/decision/emotion.
- [ ] **C048** Motion timing/roles/reduced-motion behavior are defined.
- [ ] **C049** Major UI changes include synthetic desktop/mobile evidence.
- [ ] **C050** Visual review can block acceptance even if functional tests pass.

## 06 — Responsive / accessibility / usability

- [ ] **C051** Every major workflow has desktop behavior defined.
- [ ] **C052** Every major workflow has narrow-mobile behavior defined.
- [ ] **C053** Tablet behavior is reviewed where materially different.
- [ ] **C054** No primary mobile workflow depends on desktop horizontal-table scrolling.
- [ ] **C055** Keyboard navigation/focus order is defined for critical interactions.
- [ ] **C056** Dialog/menu/form focus and announcements meet accessibility semantics.
- [ ] **C057** Forms use appropriate labels/errors/input semantics.
- [ ] **C058** Contrast/non-color cues meet accessibility policy.
- [ ] **C059** Real-device/browser accessibility smoke is release evidence.
- [ ] **C060** Accessibility regression blocks affected feature/release acceptance.

## 07 — Architecture / dependency boundaries

- [ ] **C061** UI does not own authoritative business rules.
- [ ] **C062** Domain logic is provider/DOM independent where practical.
- [ ] **C063** Application depends on domain + ports, not concrete infrastructure.
- [ ] **C064** Infrastructure implements ports/adapters and provider details stay isolated.
- [ ] **C065** UI never directly performs arbitrary Supabase persistence operations.
- [ ] **C066** Composition root is the normal concrete-wiring boundary.
- [ ] **C067** Dependency direction is automatically checked.
- [ ] **C068** Circular dependencies are automatically rejected.
- [ ] **C069** Architectural changes require ADR/spec/test impact review.
- [ ] **C070** Checkpoints detect boundary erosion and duplicate architecture paths.

## 08 — Physical code organization / maintainability

- [ ] **C071** Canonical source/test directory structure is implemented.
- [ ] **C072** Domain modules are organized by explicit business responsibility.
- [ ] **C073** Generic dumping-ground files (`utils.ts`, `helpers.ts`, etc.) are prohibited.
- [ ] **C074** TypeScript production files target ≤200 logical lines and review >250.
- [ ] **C075** Production files >400 logical lines require refactor/approved exception.
- [ ] **C076** Functions target ≤30 logical lines and review >40.
- [ ] **C077** Functions >60 logical lines require refactor/approved exception.
- [ ] **C078** Cyclomatic complexity/nesting/dependency/import thresholds are automated.
- [ ] **C079** Tests use frozen placement convention consistently.
- [ ] **C080** Maintainability metrics rerun in PRs/checkpoints.

## 09 — Types / domain semantics / invariants

- [ ] **C081** TypeScript strict mode is enforced.
- [ ] **C082** No implicit `any` in production business logic.
- [ ] **C083** Dates distinguish civil dates from timestamps.
- [ ] **C084** Money uses one exact authoritative representation.
- [ ] **C085** State machines/enums are centrally defined/versioned.
- [ ] **C086** Unknown/null/not-applicable/conflict semantics are explicit.
- [ ] **C087** Stable identifiers/external identifiers obey documented scope.
- [ ] **C088** Derived values are not competing authoritative truth.
- [ ] **C089** Every critical invariant has enforcement plus tests.
- [ ] **C090** Protected state transitions cannot be bypassed by generic updates.

## 10 — Cloud schema / relational integrity

- [ ] **C091** Every production schema change is a versioned migration.
- [ ] **C092** Production schema is never manually drifted outside migrations.
- [ ] **C093** Project-owned parents expose same-project relational keys as required.
- [ ] **C094** Child→parent project consistency is DB-enforced.
- [ ] **C095** Polymorphic links receive equivalent same-project validation.
- [ ] **C096** Constraints/checks reflect documented domain enums/ranges.
- [ ] **C097** RLS/GRANT/RPC changes are migration-controlled.
- [ ] **C098** Historical schema fixtures migrate without invariant violations.
- [ ] **C099** Migration history is verified before production release.
- [ ] **C100** Destructive cleanup waits for compatibility/recovery proof.

## 11 — Tenancy / authorization / RLS

- [ ] **C101** Core schema remains multi-project for private V1.
- [ ] **C102** Authenticated app context carries explicit `projectId`.
- [ ] **C103** Every project-owned query/mutation is project-scoped.
- [ ] **C104** RLS is authorization boundary, not frontend visibility.
- [ ] **C105** Same-project integrity prevents cross-tenant reference injection.
- [ ] **C106** Role/permission matrix is explicit.
- [ ] **C107** Privileged transitions use dedicated command/RPC semantics where required.
- [ ] **C108** Allow tests cover authorized roles/actions.
- [ ] **C109** Deny/adversarial tests cover anonymous/wrong-project/insufficient permission.
- [ ] **C110** Storage/Realtime/local caches preserve tenant isolation.

## 12 — Authentication / sessions / account security

- [ ] **C111** Supabase Auth is used instead of custom password/session crypto.
- [ ] **C112** Initial private-owner bootstrap is controlled/non-public.
- [ ] **C113** Partner invitation is identity-bound, expiring and replay-safe.
- [ ] **C114** MFA/TOTP is implemented before real-data cutover.
- [ ] **C115** Recovery/reauthentication flows are documented/tested.
- [ ] **C116** Session expiry preserves local pending work.
- [ ] **C117** Explicit logout handles pending work before private-cache purge.
- [ ] **C118** Sensitive/admin actions require recent/strong auth where specified.
- [ ] **C119** Public auth surfaces have brute-force/rate-limit/abuse controls.
- [ ] **C120** Auth changes trigger dedicated security regression review.

## 13 — Input / file / frontend security

- [ ] **C121** All external/user/imported input is untrusted.
- [ ] **C122** Runtime schemas validate trust-boundary input.
- [ ] **C123** No concatenated dynamic SQL/query fragments from untrusted input.
- [ ] **C124** No `eval`/`new Function`/arbitrary imported-content execution.
- [ ] **C125** Untrusted HTML/SVG/rich text needs approved sanitization architecture.
- [ ] **C126** File type/size/content validation follows allowlist rules.
- [ ] **C127** Archive/parser traversal/resource-exhaustion cases are tested.
- [ ] **C128** External URLs/protocols/open redirects are validated.
- [ ] **C129** Logs/URLs/diagnostics minimize PII/secrets.
- [ ] **C130** New security-critical attack surfaces trigger explicit design review.

## 14 — Local-first / offline / synchronization

- [ ] **C131** IndexedDB is account/project scoped.
- [ ] **C132** Eligible local edits are durable before UI reports local success.
- [ ] **C133** Pending operations survive restart.
- [ ] **C134** Retried mutations are idempotent.
- [ ] **C135** Realtime is freshness notification, not durability authority.
- [ ] **C136** Same-field/delete-edit/referential conflicts are explicit/recoverable.
- [ ] **C137** Protected multi-row actions revalidate server state.
- [ ] **C138** Session/project changes cannot expose another project cache.
- [ ] **C139** Large media queues cannot block critical structured mutations.
- [ ] **C140** Offline/reconnect tests cover stale/duplicate/out-of-order/conflict cases.

## 15 — PWA / client update lifecycle

- [ ] **C141** Every production build exposes app/build/version identity.
- [ ] **C142** Service-worker/static caches are versioned.
- [ ] **C143** Running clients safely detect new release.
- [ ] **C144** Updates never silently reload an unsaved active form.
- [ ] **C145** Durable pending work is preserved before reload/update.
- [ ] **C146** IndexedDB migrations run sequentially/transactionally before new local shape use.
- [ ] **C147** Frontend declares supported backend schema range.
- [ ] **C148** Incompatible stale client blocks unsafe writes and shows `Update required`.
- [ ] **C149** Old caches clean only after successful new-version activation.
- [ ] **C150** PWA update scenarios pass supported real-browser/device tests.

## 16 — Import / export / mapping

- [ ] **C151** Canonical import/export schema is explicitly versioned.
- [ ] **C152** CSV/XLSX/JSON/clipboard parsing rules are deterministic.
- [ ] **C153** Saved mapping profiles are safely scoped and examples synthetic.
- [ ] **C154** Nested external IDs are parent-scoped where required.
- [ ] **C155** Reimport is idempotent.
- [ ] **C156** Absence in ordinary import never means deletion.
- [ ] **C157** Duplicate matching does not silently merge ambiguous identities.
- [ ] **C158** Stronger confirmed/contractual truth is protected from weaker import data.
- [ ] **C159** Preview/apply detects project changes between preview and commit.
- [ ] **C160** Exports are formula-safe and claimed round trips are tested.

## 17 — Backup / recovery / migration chain

- [ ] **C161** `.mariage` backup format is versioned.
- [ ] **C162** Manifest/checksum validated before restore mutation.
- [ ] **C163** Encrypted backup semantics are versioned/tested.
- [ ] **C164** Wrong password/tamper/corruption rejected before partial mutation.
- [ ] **C165** Historical backup schemas migrate sequentially to current.
- [ ] **C166** DB/IndexedDB/import/backup migrations are coordinated.
- [ ] **C167** Recovery point exists before high-risk production migration.
- [ ] **C168** Restore is tested into a safe target.
- [ ] **C169** Production recovery drill passes before source-of-truth cutover.
- [ ] **C170** No upgrade/reset path discards unsynced local work by default.

## 18 — Budget / money / payments

- [ ] **C171** Authoritative money uses exact currency/minor-unit semantics.
- [ ] **C172** Rounding rules are deterministic and independently fixture-tested.
- [ ] **C173** Estimate/quote/approved/contracted states remain distinct.
- [ ] **C174** Named scenarios coexist without rewriting contracted truth.
- [ ] **C175** One active operational scenario is explicit.
- [ ] **C176** Payment/deposit/installment/final/refund/credit semantics stay distinct.
- [ ] **C177** Unknown tax is never silently assumed.
- [ ] **C178** Historical quotes remain immutable under scenario changes.
- [ ] **C179** Critical pricing engines use property/mutation testing.
- [ ] **C180** Budget changes invalidate/recompute all documented dependent views.

## 19 — Guests / households / seating

- [ ] **C181** Guest vs household ownership semantics are explicit.
- [ ] **C182** Priority/probability/RSVP precedence is deterministic.
- [ ] **C183** Expected/cumulative statistics reconcile against independent fixtures.
- [ ] **C184** Duplicate matching protects ambiguous guest identities.
- [ ] **C185** Sensitive guest fields are minimized in default views/logs.
- [ ] **C186** Seating sections/tables/assignments are project-scoped.
- [ ] **C187** Duplicate seating assignment is prevented.
- [ ] **C188** Capacity/unassigned/invalid-RSVP warnings are deterministic.
- [ ] **C189** Seating remains keyboard/mobile usable without required drag-drop.
- [ ] **C190** Legacy guest spreadsheet migration reconciles counts before cutover.

## 20 — Venues / vendors / documents

- [ ] **C191** Venue compatibility facts retain source/evidence/confidence/freshness.
- [ ] **C192** Blocking venue criteria remain visible/explainable.
- [ ] **C193** Partner ratings remain personal state, not objective compatibility.
- [ ] **C194** Vendor quote/package/inclusion semantics are structured.
- [ ] **C195** Venue-vendor compatibility is project-scoped/traceable.
- [ ] **C196** External-caterer/venue constraints can be represented structurally.
- [ ] **C197** Private documents/files use protected storage.
- [ ] **C198** Document version/supersession lineage is preserved.
- [ ] **C199** Contract-readiness is factual aid, not legal approval claim.
- [ ] **C200** Venue/vendor/document changes propagate to dependent modules correctly.

## 21 — Tasks / decisions / planning / timeline / search / Inbox

- [ ] **C201** Task lifecycle distinguishes actionable/waiting/blocked/completed.
- [ ] **C202** Task dependencies reject cycles where required.
- [ ] **C203** Joint decisions preserve per-owner approval/rationale/history.
- [ ] **C204** Inbox conversion is idempotent/provenance-preserving.
- [ ] **C205** Planning milestones summarize outcomes rather than duplicate tasks.
- [ ] **C206** Progress cannot be gamed by microtasks.
- [ ] **C207** Next-action ranking is deterministic/explainable.
- [ ] **C208** Timeline handles after-midnight ordering/dependencies.
- [ ] **C209** Search obeys authorization/archive/offline-cache rules.
- [ ] **C210** Dashboard summarizes actionable truth instead of duplicating modules.

## 22 — Testing strategy

- [ ] **C211** Unit/domain tests cover normal/boundary/error behavior.
- [ ] **C212** Property tests cover rule-heavy/calculation invariants.
- [ ] **C213** Mutation tests cover critical pure engines.
- [ ] **C214** Integration tests cover repositories/providers/local persistence.
- [ ] **C215** DB tests cover constraints/RLS allow+deny.
- [ ] **C216** Security/adversarial tests cover applicable attack surfaces.
- [ ] **C217** E2E tests cover critical user journeys.
- [ ] **C218** Offline/reconnect/PWA tests cover failure/recovery.
- [ ] **C219** Accessibility/performance tests cover supported profiles/reference data.
- [ ] **C220** Coverage gates never replace meaningful assertions.

## 23 — CI / quality gates

- [ ] **C221** `npm ci` clean-install reproducibility is enforced.
- [ ] **C222** Format/lint/typecheck are required checks.
- [ ] **C223** Architecture/cycle/module-complexity checks are required.
- [ ] **C224** Unit/property/coverage jobs are automated.
- [ ] **C225** DB migration/RLS jobs run in isolated reproducible state.
- [ ] **C226** Security/secret/dependency scans are automated.
- [ ] **C227** Production build/PWA validation is automated.
- [ ] **C228** Documentation links/traceability/staleness checks are automated.
- [ ] **C229** Required jobs cannot be silently bypassed.
- [ ] **C230** Critical flaky tests block release until fixed.

## 24 — Versioning / release / automatic updates

- [ ] **C231** SemVer-style app version is repository-controlled.
- [ ] **C232** Release manifest ties version→commit→cloud/local/import/backup compatibility.
- [ ] **C233** PR branches receive preview deployments automatically.
- [ ] **C234** `main` produces immutable candidate rather than racing incompatible production.
- [ ] **C235** Staging applies exact migrations and exact candidate artifact.
- [ ] **C236** Production migration occurs before dependent frontend activation.
- [ ] **C237** Protected production ref triggers automatic Cloudflare production deploy.
- [ ] **C238** Post-deploy smoke verifies exact release and critical functionality.
- [ ] **C239** Clients automatically discover new web/PWA release and update safely.
- [ ] **C240** Release evidence records version, migrations, tests, deployment and health.

## 25 — Monitoring / incidents / operational safety

- [ ] **C241** Release health is distinct from deployment success.
- [ ] **C242** App boot/error diagnostics are observable without wedding-content leakage.
- [ ] **C243** Auth/migration/RLS anomalies are observable.
- [ ] **C244** Sync-queue/conflict anomalies are observable.
- [ ] **C245** IndexedDB/PWA update failures are observable.
- [ ] **C246** Import/backup failures are observable.
- [ ] **C247** Quota/resource-pressure signals are observable.
- [ ] **C248** Incident severity/response/escalation procedure is documented.
- [ ] **C249** Severe regression can degrade/block dangerous writes.
- [ ] **C250** Every release has explicit post-deployment observation result.

## 26 — Performance / browser / free tier

- [ ] **C251** Supported browser/device matrix is explicit.
- [ ] **C252** Reference dataset sizes are defined.
- [ ] **C253** Core interaction performance budgets are measurable.
- [ ] **C254** Large guest/venue/document datasets remain usable.
- [ ] **C255** Offline cache/media strategy respects storage limits.
- [ ] **C256** Free-tier quotas are measured rather than invented.
- [ ] **C257** Quota pressure degrades nonessential media before structured-data safety.
- [ ] **C258** Performance regressions are compared at release/checkpoints.
- [ ] **C259** Map/external-media outages never block core editing.
- [ ] **C260** Paid-tier dependency is not silently introduced into normal V1.

## 27 — Dependencies / supply chain

- [ ] **C261** Every runtime dependency has documented need.
- [ ] **C262** Native/smaller alternatives are considered.
- [ ] **C263** Lockfile is committed and reproducible install enforced.
- [ ] **C264** Maintenance/security/license posture is reviewed.
- [ ] **C265** Bundle/CSP/privacy impact is reviewed.
- [ ] **C266** Sensitive GitHub Actions are minimized/pinned where practical.
- [ ] **C267** Untrusted PRs never receive production secrets.
- [ ] **C268** Critical/High dependency vulnerability policy is enforced.
- [ ] **C269** Critical dependency removal/replacement path is understood.
- [ ] **C270** Supply-chain changes trigger build/security regression tests.

## 28 — Documentation / PR / review governance

- [ ] **C271** README/START-HERE/INDEX/AGENTS/CONTRIBUTING agree on gate/precedence.
- [ ] **C272** No stale normative wording changes implementation meaning.
- [ ] **C273** Historical/non-normative wording is explicitly labelled if retained.
- [ ] **C274** PR template requires feature/security/UX/data/offline/test impact.
- [ ] **C275** All blocking review threads resolve with repository evidence.
- [ ] **C276** Feature Implementation Records remain durable/complete.
- [ ] **C277** Implementation Status updates after material work.
- [ ] **C278** Lot acceptance reconciles every assigned Feature ID.
- [ ] **C279** Checkpoints A/B/C/D rerun product/UX/architecture/security/data/testing/docs review.
- [ ] **C280** Documentation scorecard/cold-start review rerun after major governance changes.

## 29 — V1 → V2 major upgrade

- [ ] **C281** V2 has approved product/scope delta.
- [ ] **C282** Every V1 feature classified unchanged/changed/deprecated/replaced/removed.
- [ ] **C283** Historical V1 Requirement/Feature/Acceptance traceability is retained.
- [ ] **C284** Cloud schema V1.x→V2 migration chain is tested.
- [ ] **C285** IndexedDB V1.x→V2 sequential migration is tested.
- [ ] **C286** Sync protocol upgrade path is tested.
- [ ] **C287** Import schema V1.x→V2 migration is tested.
- [ ] **C288** V1 backup restore/migration into V2 is tested.
- [ ] **C289** All changed V2 routes/interfaces/accessibility states are reviewed.
- [ ] **C290** Full representative synthetic V1 project upgrades in place with recovery rehearsal.

## 30 — Production cutover / public SaaS readiness

- [ ] **C291** Final design review has zero unresolved BLOCKING/MAJOR findings.
- [ ] **C292** Final branch private-data/secret scan is clean.
- [ ] **C293** Reviewed final head SHA is recorded and PR is mergeable.
- [ ] **C294** Run 4 is merged before Lot 0 becomes READY.
- [ ] **C295** V1 real-data migration/reconciliation completes before source-of-truth declaration.
- [ ] **C296** Both owners accept critical workflows on real supported devices.
- [ ] **C297** Verified recovery export exists before source-of-truth cutover.
- [ ] **C298** Future public signup/provisioning has separate abuse/legal/operations gate.
- [ ] **C299** Multi-project synthetic isolation remains green before public activation.
- [ ] **C300** Public SaaS release cannot expose/index private wedding data or bypass tenant/security/recovery gates.

---

# Final 300/300 acceptance rule

Mariage OS may claim **300/300** only when:

1. every applicable checkbox is supported by objective evidence at its required phase;
2. no BLOCKING/MAJOR finding is open;
3. no required CI/security/recovery check is bypassed;
4. current release/version/commit evidence is recorded;
5. a context-free developer/LLM can reproduce the project state and reasoning from repository state alone.

Before code exists, documentation can reach **documentation 100%**, but implementation/runtime/production controls intentionally remain unproven rather than being falsely marked complete.
