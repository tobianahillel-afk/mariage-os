# Mariage OS — Product Specification Public-Readiness Addendum

Status: **Normative V1 architecture/product constraint; public self-service remains post-V1 activation**

This addendum refines `PRODUCT-SPECIFICATION.md` where that document describes the initial single-couple production deployment.

There is no contradiction between:

- **V1 real deployment:** private for the intended couple;
- **V1 architecture:** multi-tenant/public-ready;
- **future product mode:** public SaaS self-service after a separate launch gate.

Where wording such as “single-couple deployment” could be interpreted as a structural limitation, this addendum controls.

---

## 1. Product identity

Mariage OS is designed as a wedding-planning product for couples, not as a one-off application whose code/database only knows one specific wedding.

The first real deployment is deliberately private because:

- it protects the zero-cost objective;
- it provides a safe beta/use case;
- it avoids premature public-support/legal/abuse burden;
- it lets the product be validated on the real wedding workflow first.

This launch strategy must not leak into domain architecture as a one-wedding assumption.

---

## 2. Public-ready promise

A compliant V1 architecture must make the following future scenario possible without redesigning core wedding-domain persistence:

```text
Couple A -> Project A
Couple B -> Project B
Couple C -> Project C
```

All use the same application/backend while remaining isolated.

The public transition may require new public-facing features and operational infrastructure, but should **reuse unchanged**:

- wedding domain entities;
- project/member authorization model;
- RLS isolation;
- facts/sources/evidence;
- venues/vendors/guests/seating;
- budget/tasks/decisions/planning/timeline;
- import/export/backup;
- Storage isolation;
- local-first/sync model;
- project-scoped route/domain abstractions.

---

## 3. Initial private policy vs future public policy

### `private_pair` — V1 real production

- only intended owner(s) can provision/join the real project;
- no self-service unrelated project creation;
- public signup/project creation UI disabled;
- real deployment targets €0/month;
- couple project remains private.

### `public_saas` — future activation

- verified users may self-register;
- protected provisioning can create a project under entitlement/anti-abuse policy;
- project invite membership works for partners/collaborators;
- many isolated projects coexist;
- wedding content is still private by default;
- public marketing/help pages may be indexable, private `/app` content is not.

Deployment mode is policy/configuration, not a different database architecture.

---

## 4. UX consequence

Private V1 may streamline away controls the real couple does not need, but must not prevent their later reveal.

Examples:

- project chooser hidden/bypassed when user has one project;
- signup hidden/disabled in private mode;
- public landing may initially be minimal;
- entitlement/billing UI absent while not needed.

Underlying navigation/services remain project-aware.

---

## 5. Non-goal clarification

The following remain post-V1 even though architecture anticipates them:

- self-service public signup;
- commercial pricing/billing;
- multi-project switcher UI for ordinary users;
- support/admin console;
- public marketing/help/legal site beyond what private deployment needs;
- analytics/growth stack;
- public vendor marketplace;
- public wedding sites/guest portal.

They are **activation/product-surface work**, not justification for single-tenant core shortcuts.

---

## 6. Review rule

Every material V1 architecture/domain change is reviewed against:

> Would this still work if 10 unrelated couples used the same backend with different `project_id`s?

If no, the change is accepted only when the limitation is genuinely provider/deployment-specific and does not contaminate domain persistence/authorization/local data.

See:

- `architecture/PUBLIC-SAAS-READINESS.md`;
- `domain/TENANCY-MODEL.md`;
- `security/PUBLIC-ABUSE-PROTECTION.md`;
- `operations/PUBLIC-LAUNCH-GATE.md`;
- `ux/PUBLIC-WEB-SHELL.md`.
