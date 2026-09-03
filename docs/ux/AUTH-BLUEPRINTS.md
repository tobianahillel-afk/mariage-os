# Mariage OS — Authentication & Onboarding UX Blueprints

Status: **Normative UX composition reference**

Purpose: define the visual/interaction structure of login, first-owner setup, partner invitation, MFA/recovery and safe logout so these security-critical screens are as deliberate as the wedding-planning screens.

Security semantics remain governed by `security/AUTHENTICATION.md` and `security/BOOTSTRAP-INVITATIONS.md`.

---

## 1. Login `/login`

Primary job: **Access my private wedding safely.**

Layout:

```text
Mariage OS
Private wedding workspace

Email
[________________________]

Authentication action appropriate to configured provider flow
[ Continue / Sign in ]

Recovery/help link

Security/privacy reassurance, concise
```

Rules:
- one centered readable panel, not a marketing landing page;
- no project/partner/venue data shown before authorized context resolves;
- generic errors avoid revealing whether unrelated project/user exists;
- loading/submitting prevents accidental duplicate action;
- return to intended safe internal route after successful auth;
- if MFA challenge is required, transition into the MFA step rather than rendering project data first.

Offline signed-out state:
- explains that sign-in requires connectivity;
- does not expose cached private project content.

---

## 2. First-owner bootstrap `/onboarding`

Primary job: **Create the one intended Mariage OS wedding workspace safely and configure enough context to start.**

This is a guided workflow, not a large project-settings form.

Recommended steps:

```text
1 Welcome
2 Project basics
3 Date options
4 Reference locations
5 Initial criteria
6 Partner invitation
7 Security/recovery
8 Ready summary
```

### Step 1 — Welcome
- explain private two-partner model;
- explain real data remains private/cloud-backed;
- confirm this deployment creates the intended project, not a public SaaS account farm.

### Step 2 — Project basics
Ask only:
- project/wedding display name;
- locale/timezone/currency defaults.

Do not force budget/guest details yet if unknown.

### Step 3 — Date options
- add one or several candidate dates;
- allow none if truly undecided;
- selection is explicit rather than implicit “first date wins”.

### Step 4 — Reference locations
- default Paris/home/other origin as user enters;
- private address disclosure clearly treated as project-private;
- optional if user prefers to add later.

### Step 5 — Initial venue criteria
- show a curated initial set with priority/evaluation already seeded;
- user may confirm/adjust important criteria;
- do not expose raw JSON/evaluation-rule syntax.

### Step 6 — Invite partner
- enter intended verified email;
- explain one-time/expiry semantics in plain language;
- generated invite action/link shown only as needed;
- do not expose token hash/internal details.

### Step 7 — Security/recovery
- guide MFA/recovery readiness according to rollout stage;
- clearly distinguish required before real-data cutover vs can-complete-later setup tasks where policy allows.

### Step 8 — Ready summary
Show:
- project basics;
- date candidates;
- partner invite status;
- security setup status;
- next useful action, e.g. add/import venues.

One primary CTA: `Open Mariage OS`.

---

## 3. Partner invitation `/invite/:token`

Primary job: **Join the exact private wedding my partner invited me to.**

Before auth/validation:
- no private project details beyond minimal safe generic invite context;
- ask user to sign in/verify intended email through configured auth flow.

After identity validation:

```text
You're joining a private Mariage OS wedding workspace.
Invited email: <safe current identity context>
Role: Owner

[Join project]
```

Wrong account:
- clear non-leaking message that the signed-in account does not match invitation recipient;
- action to switch account safely.

Expired/revoked/replayed invitation:
- generic safe message;
- no project data leak;
- contact partner to issue a new invitation.

After successful acceptance:
- remove/sanitize token from visible navigation/history where practical;
- land on Dashboard/setup state;
- prompt security/MFA completion when required.

---

## 4. MFA challenge / setup

Primary job: **Prove/strengthen account access without confusion.**

MFA setup page:
- concise reason;
- provider-supported enrollment instructions;
- QR/secret handling according to provider UI/security;
- confirmation code field;
- recovery guidance.

MFA challenge:
- one code field/action;
- clear retry/recovery link;
- no unrelated project content.

Do not make MFA look like an optional marketing upsell when it is required for production cutover.

---

## 5. Recovery

Primary job: **Recover access without bypassing project authorization.**

Recovery UX follows provider-supported verified flow.

Screen distinguishes:
- password/auth mechanism recovery;
- lost MFA factor/recovery route;
- changed email/account identity.

Never offer a custom “prove you know wedding details” bypass.

After recovery, project membership is revalidated before project content/sync resumes.

---

## 6. Session expired while work exists

This is **not** logout.

Banner/sheet:

```text
Your session expired.
Your recent work is still saved on this device and has not been lost.
Synchronization is paused until you sign in again.

[Sign in again]
```

Rules:
- keep eligible local cached context visible according to frozen offline policy;
- clearly mark cloud sync paused;
- do not claim cloud-confirmed save;
- after reauth, membership is rechecked before queued sync.

---

## 7. Safe logout with pending work

If no pending work:
- ordinary sign-out confirmation may be lightweight;
- private local project cache is purged after successful logout according to policy.

If pending work exists, open explicit sheet/workflow:

```text
You have 4 changes that are saved only on this device.
Signing out now cannot silently discard them.

Recommended
[Sync now]

If you cannot sync
[Export/recover local work]

Danger
[Discard local pending work and sign out]
```

Discard path:
- strong warning;
- explicit confirmation;
- no accidental primary-button placement.

After safe logout:
- project content no longer visible;
- private IndexedDB/cache/media purged according to policy;
- static PWA shell may remain.

---

## 8. Members/security settings

`/settings/members`:
- two-owner context;
- invite pending/accepted/revoked state;
- no generic public user-management admin table;
- dangerous member/revocation actions protected and clearly separated.

`/settings/security`:
- MFA state;
- session/recovery guidance;
- safe logout;
- local-data/device considerations;
- no raw provider token/session details for ordinary users.

---

## 9. Mobile requirements

- single-column form;
- email/code keyboards appropriate;
- primary CTA not hidden by virtual keyboard;
- invite link/token route remains usable from mobile mail/messaging app;
- no QR-only recovery path without alternative when setup occurs on same phone;
- safe logout pending-work choices remain readable and not crowded.

---

## 10. Auth UX acceptance

A security flow fails UX review if:
- it leaks project details before authorization;
- it presents multiple confusing authentication actions simultaneously;
- it hides why MFA is required;
- it treats session expiry as lost data;
- it silently signs out while pending edits exist;
- it exposes provider/backend jargon as primary explanation;
- it resembles a generic multi-tenant admin user-management panel;
- invitation error states reveal unnecessary project/user existence information.
