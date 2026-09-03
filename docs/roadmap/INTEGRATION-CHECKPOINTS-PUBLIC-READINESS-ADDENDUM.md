# Integration Checkpoints — Public-Readiness Addendum

Status: **Normative addendum to `INTEGRATION-CHECKPOINTS.md`**

Every checkpoint must re-evaluate the frozen public-ready property even though private V1 does not expose public self-service.

Add a required checkpoint dimension:

## Public-readiness / tenancy

Result: `PASS | PASS_WITH_FOLLOW_UP | FAIL | NOT_APPLICABLE`

Review:

- no new single-project/global singleton assumptions;
- project context remains explicit in services/routes/local data;
- synthetic multi-project tests still pass;
- same user can belong to multiple synthetic projects;
- unrelated tenants remain isolated in DB/Storage/Realtime/local cache;
- project-owned external IDs/codes remain safely scoped;
- no feature introduced a global unscoped query/listener/cache;
- entitlement/quota decisions remain centralized rather than scattered;
- public/private SEO boundary remains intact;
- private deployment provisioning restriction remains policy, not domain schema;
- new provider integrations do not require privileged browser secrets;
- public activation delta has not unexpectedly grown into a core rewrite.

Any new cross-tenant leak or single-couple domain shortcut is `BLOCKING`/`MAJOR` according to impact and prevents checkpoint PASS.

Checkpoint reports add:

```text
- Public-readiness / tenancy: PASS
```

and list relevant `PUB-*` requirement evidence.

### Minimum recurring synthetic proof

At least once per checkpoint group, retain evidence for:

1. Project A + Project B coexist.
2. User X belongs to A and B.
3. User Y belongs to A only.
4. User Y cannot read/mutate B.
5. Project route/cache/subscription for A cannot return B data.

This is required even if the real production database still contains only the couple's one wedding project.
