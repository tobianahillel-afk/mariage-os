# Mariage OS — Public Guest Communications Requirements

Status: **NORMATIVE PUBLIC-READINESS V1 REQUIREMENT ADDENDUM**

These requirements are architectural/test requirements in private V1 even though public self-service activation is post-V1.

| ID | Priority | Requirement |
|---|---|---|
| PUB-COM-001 | P0 | Communication/contact/campaign entities are project-scoped and cross-project access/references are denied. |
| PUB-COM-002 | P0 | Guest capability authorization is independent of project membership and scoped to one invitation/household. |
| PUB-COM-003 | P0 | Provider credentials are not hard-coded globally into domain/UI and can be abstracted through secure environment/provider connection policy. |
| PUB-COM-004 | P1 | Per-project communication caps/entitlements can be enforced without rewriting campaign domain. |
| PUB-COM-005 | P1 | Platform-managed and future tenant-bound provider topologies remain possible behind provider ports. |
| PUB-COM-006 | P0 | Webhook/provider event mapping cannot use caller-supplied tenant identity as authorization. |
| PUB-COM-007 | P1 | Public launch can add abuse/complaint/quota/legal controls without changing guest RSVP data model. |
| PUB-COM-008 | P1 | Guest portal branding/public identity is project-scoped but private project fields remain allowlisted/hidden. |
| PUB-COM-009 | P0 | Synthetic tests include at least two projects and cross-tenant guest/campaign/webhook attacks. |
| PUB-COM-010 | P1 | No behavioral advertising/contact monetization dependency is introduced by communications architecture. |