# Color System — Mariage OS

Status: **Normative V1 color architecture**

Mariage OS is intentionally **multi-color**, but color is controlled by role. The application must feel rich and designed, not random.

## 1. Architecture

The palette has four layers:

1. **neutral canvas/surfaces** — shared by the whole application;
2. **brand colors** — identify Mariage OS globally;
3. **domain accents** — create visual orientation between major modules;
4. **semantic colors** — success/warning/error/info/conflict and must never be replaced by domain accents.

A module may use its accent, but semantic state always wins when meaning is involved.

## 2. Neutral foundation

| Token | Hex | Purpose |
|---|---|---|
| `paper-0` | `#FFFDFC` | highest surface / modal / clean card |
| `paper-50` | `#FAF7F3` | primary application canvas |
| `paper-100` | `#F3EEE9` | grouped/subtle contextual surface |
| `stone-200` | `#E4DDD8` | soft separators/borders |
| `stone-400` | `#AAA09F` | disabled/secondary decorative details |
| `stone-600` | `#746B6E` | secondary text |
| `ink-800` | `#3A3336` | strong secondary text |
| `ink-950` | `#211C1E` | primary text |

Pure white is not the default page background. Warm neutrals are part of the identity.

## 3. Brand family

| Token | Hex | Purpose |
|---|---|---|
| `brand-plum-700` | `#7A3E5D` | primary global brand/CTA where appropriate |
| `brand-plum-100` | `#F1E3EB` | brand-tinted surface |
| `brand-rose-500` | `#C8657D` | expressive highlight only |
| `brand-rose-100` | `#FAE7EC` | soft celebratory/editorial background |

Primary text on `brand-plum-700` may be white when contrast validation passes. Lighter brand colors are not automatically button backgrounds.

## 4. Domain accent families

Each domain has a deep accent and soft contextual surface.

| Domain | Deep accent | Soft surface |
|---|---|---|
| Venues | Olive `#687A47` | `#E8EDDF` |
| Vendors | Terracotta `#A8563E` | `#F6E3DA` |
| Guests | Blue `#5574B8` | `#E5ECFA` |
| Seating | Teal `#397A73` | `#DCEFEB` |
| Budget | Ochre `#8D6519` | `#F8ECCF` |
| Tasks | Deep aqua `#33736D` | `#DDF0ED` |
| Decisions | Plum `#7A3E5D` | `#F1E3EB` |
| Planning | Indigo `#555A9C` | `#E8E9F7` |
| Timeline | Coral `#A9535A` | `#F8E2E2` |
| Documents | Slate `#586473` | `#E7EBEF` |
| Inbox/Search | Berry `#98506F` | `#F4E4EB` |
| Settings/System | Graphite `#5F595C` | `#ECE9E9` |

This gives the product a visibly richer palette than a one-accent SaaS while preserving one coherent neutral foundation.

## 5. Semantic palette

Semantic meaning is stable application-wide.

| Meaning | Strong | Soft |
|---|---|---|
| Success / confirmed | `#2F7A5F` | `#DCEDE5` |
| Information | `#3F6FA8` | `#E1EBF7` |
| Warning / review | `#956213` | `#F7EACD` |
| Danger / destructive | `#B84A4A` | `#F8DDDD` |
| Conflict | `#76519A` | `#ECE2F4` |
| Unknown / neutral | `#746B6E` | `#EEEAEA` |

Semantic color is always paired with label/icon where it communicates state.

## 6. Usage by module

A domain accent may appear in:

- active sidebar/bottom-navigation indicator;
- page eyebrow or section marker;
- selected tab underline;
- small metric icon/background;
- contextual empty state;
- charts belonging specifically to that domain;
- subtle page/header tint;
- selected comparison columns;
- PWA browser `theme-color` where supported and appropriate.

A domain accent should **not** color every button, every row, or every border.

## 7. Global actions vs domain actions

Use `brand-plum-700` for truly global product actions such as initial setup, generic Continue, or primary confirmation when no domain context is stronger.

Use the current domain accent for a positive domain-local action where visual orientation benefits, for example:

- `Add venue` may use venue olive;
- `Add guest` may use guest blue;
- `Add payment` may use budget ochre only if contrast is validated;
- `Create decision` may use decision plum.

Destructive actions always use semantic danger, never the domain accent.

## 8. Charts and data visualization

Charts should use a curated sequence rather than arbitrary auto-generated colors.

Recommended categorical order:

1. Blue `#5574B8`
2. Terracotta `#A8563E`
3. Teal `#397A73`
4. Plum `#7A3E5D`
5. Olive `#687A47`
6. Indigo `#555A9C`
7. Coral `#A9535A`
8. Ochre `#8D6519`

Rules:

- do not encode critical meaning by color alone;
- preserve stable category-color mapping within a screen/feature;
- avoid pie charts with ten near-identical shades;
- labels/tooltips remain explicit;
- financial positive/negative semantics use semantic colors rather than domain palette when meaning requires it.

## 9. Gradient policy

Gradients are allowed but not the default design language.

Approved examples:

- subtle dashboard wedding hero blending brand plum → rose → warm paper;
- selected milestone/celebration accent;
- decorative public landing artwork.

Avoid gradients inside dense tables/forms or behind long body text.

## 10. Contrast policy

All final token pairings must be validated against `quality/ACCESSIBILITY.md` before implementation acceptance.

Do not assume a palette hex is safe for white text simply because it is “dark-looking”.

Rules:

- body text uses high-contrast ink colors on light surfaces;
- colored soft surfaces use dark ink/domain-deep text;
- filled buttons use only combinations that meet the required contrast target;
- disabled state remains readable and distinguishable;
- focus indicators must remain visible against all domain surfaces.

## 11. Dark mode

Dark mode is not required to alter the V1 product semantics. If implemented in V1 or later, it must derive from the same semantic/domain token system rather than ad-hoc inverted colors.

## 12. Anti-patterns

Reject:

- one purple accent used everywhere;
- random unique color for every screen;
- every card receiving a tinted background;
- red used decoratively where it could be mistaken for error;
- green used for venue identity where it can be mistaken for success without context;
- low-contrast pastel text;
- rainbow charts with unstable category mapping;
- gradients that make the product look like a generic AI dashboard.
