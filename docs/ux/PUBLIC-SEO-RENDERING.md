# Mariage OS — Public SEO Rendering Contract

Status: **Public-readiness architecture contract**

Future public marketing pages must be search/social-friendly without forcing the authenticated Mariage OS application to migrate to a new frontend framework.

---

## 1. Split rendering strategy

### Private app

`/app/**`

- Vite/TypeScript SPA/PWA;
- authenticated/project-scoped;
- local-first;
- non-indexable/private metadata;
- no requirement for server-side rendering.

### Public marketing/help/legal pages

Examples:

- `/`;
- `/features`;
- `/security`;
- `/help`;
- `/privacy`;
- `/terms`.

These should be emitted as real crawlable HTML at build time (static files/multi-page build/prerender equivalent), not depend on executing client JavaScript merely to expose title/headings/core copy.

This keeps the existing Vite stack while supporting strong public SEO fundamentals.

---

## 2. No framework migration required by default

Public launch must not automatically trigger migration to React/Next/Nuxt/etc.

Use the simplest maintained approach compatible with:

- Vite multi-page/static generation;
- shared CSS/design tokens;
- shared small UI components where useful;
- Cloudflare Pages static hosting;
- canonical metadata at build output.

A future framework/SSR migration requires its own ADR and demonstrated product need beyond ordinary marketing SEO.

---

## 3. Build output

Indexable page output must contain before JS execution:

- page `<title>`;
- meta description;
- canonical link;
- robots policy;
- Open Graph/Twitter tags where relevant;
- semantic H1/content/navigation;
- public-safe social image reference;
- structured data only if explicitly justified.

Client JavaScript may enhance behavior after load but is not the only source of core public content/metadata.

---

## 4. Sitemap/robots separation

Build/deployment generates or maintains:

- sitemap containing only intentionally public canonical URLs;
- robots directives consistent with public/private route policy;
- no `/app/p/:projectId/**` URLs in sitemap;
- no guest/vendor/wedding entity URLs derived from private database;
- no preview build indexed accidentally.

Preview/staging deployments should be non-indexable.

---

## 5. Public metadata is content-driven, not wedding-data-driven

Public marketing metadata may vary by public page/locale/content version.

It must not query private wedding projects to construct SEO pages.

No future shortcut such as:

```text
/venues/<private venue id> -> public SEO page
```

without a separately reviewed public-data feature/model.

---

## 6. Performance

Public marketing pages should target excellent perceived/Core Web Vitals behavior:

- minimal initial JS;
- responsive public-safe images;
- reserved media dimensions;
- fonts loaded conservatively;
- no giant app bundle required merely to render landing copy;
- motion remains non-blocking/reduced-motion aware.

The authenticated app bundle may be loaded lazily only after login/navigation into `/app` where practical.

---

## 7. Shared branding without shared privacy risk

Public shell can share:

- brand tokens;
- color palette;
- typography;
- icon system;
- public demo components.

It must not import production data fixtures, private project config or authenticated cache into its build.

Public screenshots use synthetic/public-safe assets.

---

## 8. Public authentication pages

`/login` and future `/signup` may be interactive client-enhanced forms, but their static shell should still provide:

- correct title/description/robots policy;
- accessible form structure after hydration/enhancement;
- brand continuity;
- no exposure of project data.

Whether Auth pages themselves are indexed is a deliberate SEO decision; they do not need ranking value by default.

---

## 9. Optional future dynamic public content

If Mariage OS later adds a blog/help knowledge base/changelog with frequently changing public content, possible solutions include build-time content generation or a separate public-content layer.

Do not connect search-engine crawling directly to private Supabase project tables.

---

## 10. Acceptance

Before public launch:

- fetch built public HTML without running JS and verify meaningful content/metadata;
- verify sitemap contains no private app routes;
- verify `/app/**` noindex/private policy;
- verify preview/staging noindex;
- run Lighthouse/SEO/accessibility/performance review on public pages;
- verify public build contains no private production data.
