# Mariage OS — Public SaaS Launch Gate

Status: **Future release gate; not required to operate private V1**

This checklist defines the difference between “the app can technically accept another user” and “Mariage OS is ready to be offered publicly”.

Public self-service must not be enabled until this gate passes.

---

## 1. Launch model

Private V1 mode:
- one intended couple in real production;
- no public self-service project provisioning;
- public-ready tenant architecture retained.

Public launch mode:
- unrelated verified users may register;
- users may create isolated wedding projects under entitlement policy;
- invitations add members to projects;
- every wedding project remains private by default.

The switch is a deliberate release/configuration event, not a UI toggle.

---

## 2. Product readiness

- [ ] public landing page clearly explains product;
- [ ] signup/login/recovery/onboarding polished;
- [ ] project creation flow exists and is idempotent;
- [ ] project chooser/switcher works for multiple projects;
- [ ] account settings are distinct from project settings;
- [ ] account deletion/export exists;
- [ ] project deletion/export exists;
- [ ] invitation flows work without operator intervention;
- [ ] help/support entry exists;
- [ ] public users cannot reach private operator-only flows;
- [ ] no private-V1 wording such as “the two configured owners” leaks into generic public UX.

---

## 3. Multi-tenant proof

Using synthetic users/projects, prove:

- [ ] at least 3 unrelated projects coexist;
- [ ] one synthetic user belongs to 2 projects;
- [ ] another user belongs to exactly 1 project;
- [ ] unrelated project CRUD is denied;
- [ ] cross-project FK injection is denied;
- [ ] Storage cross-project read/write is denied;
- [ ] Realtime does not leak cross-project events;
- [ ] global Search stays within active/authorized project;
- [ ] IndexedDB account/project isolation works;
- [ ] backup/import target-project rules work;
- [ ] project switch preserves/clears correct context.

Any cross-tenant leak is a public-launch BLOCKER.

---

## 4. Authentication/abuse

- [ ] email verification configured as intended;
- [ ] Turnstile/CAPTCHA enabled for public Auth abuse-sensitive flows;
- [ ] Auth rate limits reviewed/tuned/documented;
- [ ] provisioning rate/entitlement controls implemented;
- [ ] invite issuance/resend controls implemented;
- [ ] password recovery tested;
- [ ] MFA behavior documented/available;
- [ ] public email enumeration reviewed;
- [ ] retry/rate-limit UX tested;
- [ ] transactional email provider/SMTP capacity suitable for expected public traffic;
- [ ] no privileged service secret in client bundle.

---

## 5. Security

- [ ] ASVS applicable controls updated for public threat surface;
- [ ] final RLS allow+deny matrix green;
- [ ] Storage policy matrix green;
- [ ] Security Advisor reviewed;
- [ ] Critical/High known vulnerabilities = 0;
- [ ] CSP/headers validated with public marketing/Auth dependencies;
- [ ] Turnstile CSP/hostname configuration validated;
- [ ] file/import adversarial suite green;
- [ ] dependency/secret scans green;
- [ ] support/admin privileged boundary reviewed if present;
- [ ] incident response/security contact process exists.

---

## 6. Quotas/free-tier/capacity

Public launch requires a capacity decision rather than assuming private-V1 free-tier headroom scales indefinitely.

- [ ] current provider limits/pricing reviewed;
- [ ] projected users/projects/storage/realtime/egress modeled;
- [ ] per-project/account entitlement policy implemented;
- [ ] Storage exhaustion behavior tested;
- [ ] media quota exhaustion does not block structured wedding work;
- [ ] expensive queries/imports bounded;
- [ ] pagination/indexes verified under public synthetic load;
- [ ] Realtime subscription strategy load-tested appropriately;
- [ ] alerts/monitoring for provider quota pressure defined;
- [ ] no automatic paid upgrade/charge behavior surprises users/operator.

Public launch may require moving to a paid provider tier. That commercial decision is separate from the product's public-ready architecture.

---

## 7. Email/deliverability

- [ ] confirmation email tested;
- [ ] password reset tested;
- [ ] partner invitation email tested if automated;
- [ ] custom domain/from identity configured as needed;
- [ ] provider link tracking does not break auth links;
- [ ] email scanners/single-use links considered;
- [ ] bounce/complaint handling appropriate to provider;
- [ ] no sensitive wedding payload in unnecessary email metadata.

---

## 8. Legal/privacy readiness

This checklist triggers legal review appropriate to launch jurisdictions.

- [ ] Privacy Policy published/versioned;
- [ ] Terms published/versioned;
- [ ] required consent evidence captured;
- [ ] account/project deletion documented;
- [ ] data export documented;
- [ ] retention policy documented;
- [ ] subprocessors/provider inventory prepared;
- [ ] cookies/analytics decision made;
- [ ] consent mechanism added if required;
- [ ] support/contact information published;
- [ ] privacy-safe diagnostics/logging verified;
- [ ] public project/content sharing remains off unless separately designed.

---

## 9. SEO/public web

- [ ] public pages have unique title/description/canonical/Open Graph as applicable;
- [ ] public sitemap contains public content only;
- [ ] robots policy reviewed;
- [ ] `/app/**` remains `noindex`/excluded from public discovery;
- [ ] no private dynamic page metadata contains wedding data;
- [ ] public marketing images contain no real private wedding data;
- [ ] structured data, if added, applies only to legitimate public marketing content.

---

## 10. UX/accessibility

- [ ] public landing/signup/onboarding follow visual identity;
- [ ] Auth/signup forms pass accessibility review;
- [ ] Turnstile does not create inaccessible dead ends;
- [ ] project chooser works mobile/desktop;
- [ ] new user can reach first useful wedding action without understanding tenant architecture;
- [ ] empty-state onboarding is polished;
- [ ] no public user sees private developer/operator concepts;
- [ ] all critical public routes have mobile path.

---

## 11. Operations/support

- [ ] documented deployment/release procedure;
- [ ] incident response owner/channel;
- [ ] privacy/security contact method;
- [ ] user support/contact flow;
- [ ] safe diagnostics flow;
- [ ] backup/recovery tested under multi-project synthetic data;
- [ ] provider outage/degraded-mode messaging reviewed;
- [ ] abuse response procedure documented;
- [ ] project/account deletion support procedure documented;
- [ ] operator access does not rely on putting service-role credentials in customer UI.

---

## 12. Observability

Before public launch define the minimum privacy-safe operational signals needed for:

- availability/error rates;
- auth/signup failures;
- quota/storage pressure;
- failed background/control-plane operations;
- security/abuse alerts;
- release regressions.

Do not send guest names, project notes, contracts or other wedding content to telemetry merely to obtain generic error monitoring.

---

## 13. Quality evidence

- [ ] complete `npm run verify`/CI green;
- [ ] critical mutation-testing targets green;
- [ ] public signup/project creation E2E;
- [ ] cross-tenant adversarial suite;
- [ ] multi-project project-switch E2E;
- [ ] public SEO/noindex verification;
- [ ] public Auth rate-limit/CAPTCHA scenarios;
- [ ] account deletion/export E2E;
- [ ] project deletion/export E2E;
- [ ] backup/restore across multiple synthetic projects;
- [ ] supported real devices/browsers reviewed.

---

## 14. Activation decision

`public_saas` may be enabled only after:

- zero unresolved BLOCKING/MAJOR public-launch findings;
- documented operator approval;
- production configuration review;
- recovery export/snapshot before the launch change;
- rollback plan to return provisioning to `invite_only`/closed without harming existing projects.

Public mode can be disabled for new signups/project creation during an incident without making existing customer projects unreadable.
