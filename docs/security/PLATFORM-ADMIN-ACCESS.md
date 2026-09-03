# Mariage OS — Platform Administrator / Support Access

Status: **Normative public-readiness operations security contract**

Purpose: prevent future public SaaS operations/support requirements from turning into a hidden universal-access backdoor.

## 1. Separate project roles from platform operations

Project roles (`owner`, `editor`, `viewer`) authorize access to wedding projects.

Platform/operator privileges are a separate trust domain and must never be represented by adding a user as an invisible owner of every project.

## 2. V1 private deployment

V1 has no in-app support/admin impersonation capability.

Production operator access is limited to the minimum needed to operate Supabase/Cloudflare/GitHub and is governed outside ordinary user sessions.

No service-role key or platform secret is exposed to the PWA.

## 3. Public SaaS principle

A future public launch must not create a permanent `support` account that can browse every wedding through normal UI.

Preferred order for support:

1. diagnostics that reveal no customer content;
2. user-provided sanitized diagnostic export;
3. user-guided reproduction;
4. narrowly scoped, time-limited privileged support access only if genuinely necessary and separately security-reviewed.

## 4. If privileged support access is ever introduced

It requires a dedicated design/security review and at minimum:

- separate platform identity/role from project membership;
- explicit support ticket/reason;
- least-privilege scope;
- short expiry;
- strong authentication;
- auditable start/end/operator/project/reason;
- visible customer notification/consent where legally/product-appropriate;
- no silent role insertion into the wedding project;
- sensitive export/download disabled unless separately authorized;
- no access to raw auth secrets/passwords/MFA secrets;
- no permanent impersonation token;
- emergency access (“break glass”) separately controlled and reviewed.

## 5. Service-role / database operator access

Supabase service-role or database-owner capabilities bypass ordinary RLS and are therefore highly privileged.

Rules:

- server/ops only, never client bundle;
- never committed to Git;
- minimum number of holders/integrations;
- rotate after suspected exposure;
- do not use service-role for ordinary browser workflows;
- automated jobs using elevated credentials must be narrowly scoped and reviewed;
- production DB console access is treated as privileged operational access and minimized.

## 6. Production data handling by maintainers

Developers/support staff do not copy real wedding data into:

- GitHub issues/PRs;
- local fixtures;
- screenshots used for public review;
- logs/analytics;
- demo environments.

Debugging uses synthetic/reproducible fixtures whenever possible.

## 7. Public analytics/observability

Operational telemetry must not become an authorization bypass or data exfiltration channel.

No event pipeline should receive guest lists, document contents, budgets, private notes or access tokens by default.

## 8. Tests/review

Before public launch verify:

- no global in-app admin role grants blanket tenant read;
- service-role secrets are absent from frontend/public artifacts;
- operator procedures are documented;
- sanitized diagnostics suffice for normal support paths;
- any privileged support capability has dedicated authorization/audit tests and security review.