# Authentication and Couple Onboarding Feature Contract

Status: **Normative V1 feature contract**

## Purpose

Get the two partners into exactly one private wedding project with secure, recoverable accounts and enough initial project settings to make the rest of the application meaningful.

Authentication must be simple for the couple but may never substitute UI assumptions for backend authorization.

---

## 1. Entry states

### Signed out

Show:

- Mariage OS identity;
- email/account sign-in entry;
- clear statement that project data is private;
- no project data or project existence leaked.

### Signed in, no active project membership

Possible flows:

- create new wedding project if allowed for the initiating owner;
- accept pending invitation;
- display no foreign/public project list.

### Signed in, active project

Route to last safe route or Dashboard.

### Session expired

If user has local pending work:

- keep local work;
- show reauthentication required to sync;
- after successful authentication, continue synchronization with the same project membership validation.

---

## 2. First owner project creation

Minimum fields:

- project display name;
- owner display name/profile if not set.

Recommended onboarding fields, all editable later:

- partner names/display names;
- target/known wedding date or date unknown;
- project timezone (default Europe/Paris);
- locale (default fr-FR);
- currency (default EUR);
- target guest count;
- target budget/reserve preferences where available;
- reference address/origin for access comparisons;
- initial venue criteria priorities.

Do not block project creation because optional planning information is unknown.

After creation, first user becomes active `owner` through a transaction/function that cannot create an ownerless project.

---

## 3. Invite partner

Owner can invite the partner using the supported Supabase invitation/auth flow.

Invitation model stores:

- project;
- inviter;
- intended email/identity as supported;
- invited role (`owner` for normal couple flow);
- invitation status/time/expiry where provider flow allows.

Requirements:

- invitation token is not stored/exposed in public logs;
- wrong signed-in user cannot accept an invitation intended for another identity unless explicitly reissued;
- accepting invitation is idempotent;
- invitation does not create duplicate `project_members` rows;
- after acceptance both owners see the same project.

---

## 4. MFA enrollment

Production owners follow `security/AUTHENTICATION.md`.

Onboarding/Settings supports:

1. explain MFA purpose;
2. enroll TOTP factor;
3. verify code;
4. confirm strong-auth state;
5. encourage/configure second recovery factor according to supported policy;
6. never display/store TOTP secret after enrollment beyond provider-required flow.

If MFA is required before production cutover, Dashboard shows a blocking security setup item until both owners satisfy policy.

---

## 5. Reference addresses/origins

Project settings can define one or more useful origins, e.g.:

- Paris reference;
- home;
- family origin.

V1 may begin with one default reference origin.

Address is private project data, not committed/logged publicly.

Route/map links can use it after user action; external navigation must not expose other private project data.

---

## 6. Initial criteria setup

Onboarding can seed default venue criteria from `domain/DEFAULT-CRITERIA.md`.

For each criterion, project may configure:

- blocking;
- important;
- bonus/informational;
- optional weight.

Current default use case highlights as blocking:

- external caterer allowed;
- target guest capacity;
- one large shared reception room;
- two dance areas feasible;
- chuppah/ceremony requirement;
- viable rain backup.

Users can change priorities later; changing priority recalculates compatibility rather than rewriting historical facts.

---

## 7. Initial data choice

Onboarding offers:

- start empty;
- import existing data later;
- go directly to Import Center when ready.

Do not require importing private data before security/project setup is complete.

---

## 8. Account/project switch

V1 is optimized for one active wedding project. If architecture supports multiple memberships, project switch must be explicit and every local cache/sync queue is scoped by project ID.

Never show project A cached data after switching to project B.

---

## 9. Logout

Normal logout:

- ends cloud auth session;
- stops realtime/subscriptions;
- prevents cached private content from remaining visible inside the app to a new unauthenticated user;
- handles pending changes explicitly before logout if they are not synchronized.

Device-local cache purge on logout is a deliberate security/UX decision: V1 implementation must follow the chosen policy from security/local-data design, not silently discard unsynced work.

A `Log out and remove local data from this device` option may be separate from ordinary logout.

---

## 10. Account recovery/change

Settings must support provider-available secure flows for:

- password/email recovery if password auth used;
- changing email with re-verification;
- replacing lost MFA factor according to security policy;
- signing out compromised sessions/devices where provider capability allows.

No custom insecure account-recovery bypass is implemented.

---

## 11. Empty/onboarding dashboard

Before enough planning data exists, Dashboard displays setup actions instead of fake alerts:

- invite partner;
- add/set wedding date if known;
- target guest count;
- set budget target if desired;
- review non-negotiable venue criteria;
- import/add first venue/guest/vendor.

---

## Acceptance criteria

- anonymous user cannot access project data;
- project creator becomes one owner atomically;
- partner invitation can be accepted once and creates one active membership;
- a third unrelated account cannot join by guessing project ID;
- both partners see the same project after sync;
- no optional onboarding field blocks creation;
- session expiry preserves durable local pending edits;
- cross-project cache is never shown after account/project switch;
- MFA enrollment/recovery behavior matches security policy;
- logout does not silently discard pending work;
- onboarding works on mobile and desktop.

## Required E2E/security tests

- create project → invite partner → partner accepts → both edit one venue;
- invalid/expired invite;
- wrong identity invite acceptance attempt;
- session expiry with pending offline edit;
- MFA required/recent-auth protected action;
- logout/relogin on same device;
- cross-project IDOR direct request denied by RLS.
