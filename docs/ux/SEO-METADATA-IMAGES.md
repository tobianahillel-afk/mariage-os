# SEO, Metadata and Image Delivery — Mariage OS

Status: **Normative V1 privacy/performance contract**

Mariage OS is primarily a **private authenticated application**, so traditional dynamic SEO inside the wedding workspace is not a product goal. Search indexing private planning routes would create privacy risk without user value.

## 1. Public vs private surfaces

### Private application routes

Authenticated application routes must not be designed for search-engine indexing.

Rules:

- use `noindex`/equivalent appropriate metadata/header policy for private application surfaces;
- do not create public crawlable pages containing guest, budget, vendor-contact, contract, task or private wedding data;
- do not expose private entity names/queries unnecessarily in externally observable metadata;
- authentication/RLS remains the real privacy boundary; robots directives are defense-in-depth only.

### Optional public landing

If Mariage OS later has a public landing page, that page may use normal SEO and social metadata, but it contains **generic product information only**, never synchronized wedding data.

## 2. Browser document titles

Titles should help orientation without leaking unnecessary PII into browser history/task switchers.

Examples:

- `Venues — Mariage OS`
- `Budget — Mariage OS`
- `Guest list — Mariage OS`
- `Venue detail — Mariage OS`
- `Wedding timeline — Mariage OS`

Avoid putting guest phone/email or sensitive contract/payment detail in `<title>`.

## 3. Social/Open Graph metadata

The authenticated app should use a generic brand preview rather than project-specific private data.

If a public landing exists, it may define:

- product title;
- product description;
- canonical public URL;
- generic branded Open Graph image;
- favicon/app icons;
- theme color;
- social card metadata.

Never generate an Open Graph image from private wedding photos, guest names, budget, date or venue decision without an explicit future sharing feature and privacy review.

## 4. Structured data

Schema.org/JSON-LD is unnecessary for private workspace routes.

If a genuine public product landing is later published, structured data can be considered then. Do not add structured data merely to appear “SEO optimized”.

## 5. PWA metadata

The installed application should have a coherent visual identity through:

- Web App Manifest;
- icons/maskable icons;
- application name/short name;
- neutral base `theme_color`;
- warm neutral `background_color`;
- appropriate display mode.

The runtime may update `<meta name="theme-color">` subtly by module using the domain color system, provided browser support and contrast/readability are acceptable.

## 6. Image loading architecture

### Uploaded/private images

Store:

- immutable original;
- generated preview;
- generated thumbnail.

Use preview/thumbnail in normal UI and fetch original only when the user requests full view/download.

### Remote images

Remote venue/vendor marketing images:

- are treated as external references;
- use privacy-preserving referrer behavior;
- must not receive private query parameters;
- fail gracefully;
- may be archived privately when the couple explicitly chooses to keep a copy.

## 7. Responsive images

Where generated derivatives exist, render responsive resources so phones do not download desktop-size images.

Implementation should support equivalent of:

- known `width`/`height` or CSS `aspect-ratio` to prevent layout shift;
- appropriate `srcset`/`sizes` or derivative selection;
- `loading="lazy"` below the fold;
- `decoding="async"` where beneficial;
- high priority only for the true initial hero image;
- no eager loading of full venue galleries.

## 8. Image transitions

- thumbnail/placeholder → preview may crossfade;
- preview → original keeps container dimensions stable;
- venue card → venue hero may use View Transition progressive enhancement;
- failure falls back to designed module-colored placeholder.

Image motion follows `MOTION-INTERACTION.md` and reduced-motion policy.

## 9. Alt text

Meaningful images require useful alt text.

Examples:

- venue exterior: `Exterior terrace overlooking the valley`;
- room plan/diagram: describe its purpose;
- decorative texture: empty alt;
- icon with adjacent visible label: usually decorative/empty alt.

Do not mechanically place file names or SEO keyword stuffing into alt text.

## 10. Performance and quota

Image UX must respect both performance and free-tier constraints.

- lazy load nonessential imagery;
- avoid duplicating originals;
- deduplicate identical binaries by hash;
- garbage-collect orphan derivatives;
- use soft previews before original download;
- essential structured wedding data always outranks decorative media under quota pressure.

## 11. Dynamic content and search engines

Mariage OS must not implement server-side rendering/prerendering solely to make authenticated dashboard content indexable.

If a public marketing site is later desired, it should be a separate public surface with its own content and metadata strategy rather than exposing/private-rendering the wedding workspace.

## 12. Acceptance rule

SEO/metadata work is accepted only if it improves public discovery or installed-app polish **without increasing private-data exposure**.

For V1, privacy, PWA polish, image performance and social-preview safety are more important than search ranking of private application routes.
