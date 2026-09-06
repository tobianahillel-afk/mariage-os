# Lot 1 — Reconciliation and Integration Pass

Status: **IN_PROGRESS — integration finding remediation required before Lot acceptance**

## Mechanical Lot reconciliation

All planned Work Packets `WP-1.1` through `WP-1.9` are **ACCEPTED**.

The authoritative packet coverage matrix is `LOT-1-COVERAGE-MATRIX.md`.

Mechanical result:

```text
required current-lot responsibilities - assigned packet responsibilities = ∅
required packet-owned current-lot responsibilities - accepted/evidenced responsibilities = ∅
```

No packet-owned Feature/control responsibility remains unassigned or unaccepted. Lot-level closure itself remains intentionally outside packet ownership and requires this separate Integration Pass plus Lot acceptance.

## Integration Pass scope

The Integration Pass re-checks the Lot as one foundation rather than assuming accepted packets compose correctly. It covers at least:

- controlled initial-owner bootstrap + partner invitation + second-owner project access;
- protected route/session/membership behavior;
- cross-project isolation across DB, local cache and Storage;
- session expiry, reauthentication, pending-work preservation and explicit logout purge;
- public RSVP capability separation from project-member authority;
- no provider SDK/secret or Lot-2+ business scope leakage;
- exact-head full verification after any integration repair.

## Existing integrated evidence reviewed

Reviewed clean before the finding below:

- `private_provisioning_test.sql` proves the real private bootstrap RPC creates the intended verified first owner and atomically consumes bootstrap state;
- `partner_invitation_test.sql` proves identity-bound invitation creation/acceptance, wrong-identity/unverified/replay/expiry/revocation denial and creation of the second active owner membership;
- `shell-routing.spec.ts` proves protected route membership behavior, generic outsider denial, safe return paths, project-context-preserving navigation, session expiry/reauth, pending local work preservation, explicit logout purge and cross-project local-cache isolation;
- the public `/rsvp/:token` Playwright flow remains separate from private navigation/member authority and removes the bearer token from the browser URL/application state;
- WP-1.9 directly proves private Storage isolation, A/B/C multi-project behavior, revoked/outsider/anon/guest-like denial and Realtime non-exposure;
- no Lot-2+ product domain or outbound communication provider surface is part of the Lot-1 implementation.

## `LOT1-IP-001` — MAJOR — explicit synthetic two-owner Playwright journey missing

The binding Lot-1 acceptance contract requires a **synthetic two-owner E2E**. The repository E2E contract defines E2E as Playwright/user-perspective behavior and lists the authentication/project journey “invited owner signs in and opens project”.

Current authoritative server tests prove bootstrap and partner invitation/acceptance, but they are separate pgTAP files. Current Playwright tests prove one authenticated member can open a protected project and an outsider is denied, but they do not explicitly demonstrate two distinct owner identities independently opening the same project.

This is an integration-evidence gap, not a discovered production authorization defect.

### Bounded remediation

- add one small dedicated Playwright spec using two isolated browser contexts;
- represent two distinct synthetic verified owner identities/devices with access to the same project through the existing E2E composition harness;
- prove both independently render the same protected project shell and project-scoped navigation;
- retain existing outsider/cross-project denial evidence rather than duplicating it unnecessarily;
- do not invent a browser invitation-acceptance UI: Lot 1 intentionally exposes only the invitation verification shell, while the authoritative invitation lifecycle remains server-side and is already directly tested;
- change no production authorization logic unless the new E2E uncovers a real defect;
- rerun exact-head full CI and then repeat the Lot Integration Pass.

Integration Pass result: **FAILED pending `LOT1-IP-001` remediation**.

Lot 1 remains `IN_PROGRESS`. Lot 2+ remains forbidden.
