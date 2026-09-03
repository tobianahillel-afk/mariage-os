# Mariage OS — Public Web Shell and Private App UX

Status: **Normative public-readiness UX/SEO boundary**

Mariage OS private V1 is an authenticated application, but the route/layout architecture must allow a polished public product shell later without entangling private wedding data with public SEO/content.

---

## 1. Two visual/application zones

### Public product shell

Purpose:
- explain Mariage OS;
- build trust;
- allow authentication/signup when enabled;
- host legal/help/security content;
- support search-engine/social metadata.

Typical future routes:

```text
/
/features
/how-it-works
/security
/help
/privacy
/terms
/login
/signup
```

### Private wedding workspace

Purpose:
- authenticated wedding planning;
- tenant-scoped private content;
- PWA/local-first work.

Canonical family:

```text
/app/p/:projectId/...
```

Private app routes are not public content pages and must not be indexed/shared as if they were.

---

## 2. Shared identity, different density

Both zones share Mariage OS brand tokens:

- logo/wordmark;
- color system;
- typography;
- icon family;
- motion principles;
- illustration/photography philosophy;
- accessibility rules.

But density differs.

### Public shell
More editorial, spacious and demonstrative.

May use:
- larger typography;
- richer branded gradients/color composition;
- curated synthetic screenshots;
- product storytelling;
- subtle motion;
- feature narratives.

### Private app
More operational and information-dense.

Prioritizes:
- calm surfaces;
- fast navigation;
- module accents;
- real wedding photos where useful;
- predictable interaction;
- minimal distraction.

Do not make the private app look like a marketing landing page.

---

## 3. Public homepage information architecture

Future homepage should answer in order:

1. What is Mariage OS?
2. What problem does it replace?
3. Why is it different from spreadsheets/multiple apps?
4. What can a couple manage?
5. How does collaboration work?
6. Is it private/secure?
7. What does the interface look like?
8. How do I start?

Suggested sections:

- Hero: one clear proposition + primary CTA;
- visual product preview;
- `Everything for the wedding, one source of truth` explanation;
- venues/vendors/guests/budget/tasks/decisions visual feature story;
- couple collaboration story;
- import-from-spreadsheet story;
- privacy/offline/recovery trust section;
- mobile + desktop story;
- final CTA.

Avoid generic SaaS cliché sections disconnected from real wedding-planning jobs.

---

## 4. Public visual assets

Never use real private wedding data in public screenshots/SEO images.

Use a synthetic demo project with:

- fictional couple names;
- fictional guests/contact info;
- fictional budget;
- either licensed/public-safe venue imagery or designed illustrative/demo assets;
- synthetic contracts/documents;
- no copied private notes from production.

Maintain a dedicated `demo/public-marketing` fixture strategy separate from test golden-project data if presentation needs differ.

---

## 5. Auth transition

Public shell → authenticated app must feel continuous but clear.

Login/signup pages:

- share public brand and app form components;
- explain what happens next;
- do not expose tenant/project internals;
- handle verification/recovery/rate limits cleanly;
- when public mode is disabled, signup route explains invite/private access rather than showing a broken form.

After login:

- one authorized project → go directly to that project;
- multiple projects → project chooser;
- zero projects + private mode → invitation/recovery state;
- zero projects + public mode → create-project onboarding.

---

## 6. Project chooser

Future multiple-project users need a simple chooser, not an enterprise organization dashboard.

Project card may show:

- project/couple display name;
- wedding date/countdown if configured;
- role;
- last accessed;
- small brand/project color or image if chosen.

Never show private guest/budget details before entering the project unnecessarily.

Single-project private V1 can bypass this screen automatically.

---

## 7. SEO contract

Public pages may be indexable.

Each indexable page defines:

- unique `<title>`;
- meta description;
- canonical URL;
- Open Graph/Twitter metadata where useful;
- public-safe image;
- semantic headings;
- sitemap eligibility;
- structured data only when actually applicable.

Private app pages:

- are excluded from public sitemap;
- use noindex policy appropriate to deployment;
- never put guest/budget/vendor/private project content into social preview metadata;
- do not derive public SEO pages automatically from private wedding entities.

---

## 8. Metadata and theme color

Public shell may use a stable brand theme color and public social image.

Private PWA may adapt subtle `theme-color`/module presentation according to the frozen color system, provided:

- browser behavior remains predictable;
- accessibility is preserved;
- it does not encode private state into URLs/metadata;
- social metadata stays generic/private-safe.

---

## 9. Public navigation

Future public top navigation should remain small:

- Product/Features;
- Security/Privacy or trust entry;
- Help;
- Login;
- Start/Sign up CTA when enabled.

Do not expose the entire authenticated app IA in the public nav.

Authenticated shell switches to the app navigation system after project entry.

---

## 10. Design quality gate

Public launch visual review asks:

- Does the landing feel wedding-specific without becoming cliché?
- Does it visually belong to the same product as the app?
- Are screenshots/demo states realistic and data-safe?
- Does the user understand the value in under one scroll?
- Is there one obvious CTA?
- Are trust/privacy claims factual and supported?
- Is mobile marketing quality equivalent to desktop?
- Does authentication transition smoothly into the workspace?

A generic AI-generated SaaS landing page with arbitrary gradients, fake testimonials, meaningless metrics or copied wedding-site styling fails this review.
