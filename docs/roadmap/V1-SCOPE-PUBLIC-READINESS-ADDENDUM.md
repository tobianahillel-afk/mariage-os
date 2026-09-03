# V1 Scope — Public-Readiness Addendum

Status: **Normative clarification to `V1-SCOPE.md`**

`V1-SCOPE.md` correctly keeps **public self-service multi-couple SaaS activation** post-V1.

This addendum clarifies that **public-ready core architecture is part of V1 platform foundation**, not post-V1 work.

Required V1 foundation therefore additionally includes:

- multi-project-capable schema/domain;
- users may belong to multiple synthetic projects;
- explicit project context in authenticated routes/services/repositories;
- account/project-scoped IndexedDB/local queue;
- project-membership RLS;
- same-project referential integrity;
- Storage/Reatime tenant isolation;
- deployment-policy project provisioning abstraction;
- public/private SEO shell boundary;
- `PUB-*` architecture regression requirements;
- multi-project synthetic tests at integration checkpoints.

Still post-V1 activation:

- public signup UI;
- self-service public project provisioning;
- public CAPTCHA/rate-limit rollout;
- public transactional email scale;
- public legal/consent/support operations;
- project chooser UI for ordinary multi-project users;
- public entitlement/plan/billing UI;
- public marketing/help site beyond private-deployment needs.

No implementation may interpret “public SaaS is post-V1” as permission to build single-project core architecture.
