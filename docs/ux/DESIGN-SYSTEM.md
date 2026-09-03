# Design System Contract

Status: **Normative UX consistency and visual-quality contract**

Mariage OS must feel calm, elegant, warm and wedding-appropriate while keeping operational screens clear enough for real decision work. It must not look like a generic database/admin interface merely because the underlying data model is rich.

This document freezes visual principles and component semantics. Exact palette/font tokens are chosen during UI implementation within these constraints.

## Principles

- elegant, not ornamental;
- calm, not dashboard-noisy;
- warm visual identity with professional data readability;
- premium enough to feel intentionally designed, without decorative excess;
- summary-first information hierarchy;
- consistent status meaning everywhere;
- whitespace/typography/grouping before borders and boxes;
- mobile-first interaction for visits and quick actions;
- desktop-enhanced analysis for tables/comparison;
- images where they support emotional/visual decisions, not mechanically on every screen;
- operational efficiency must remain strong even when the interface is visually refined.

## Visual anti-patterns

Avoid:

- generic admin CRUD appearance;
- every section inside an equally weighted bordered card;
- every status using a different arbitrary color;
- dozens of dense widgets competing on Dashboard;
- decorative wedding styling on financial/task screens that reduces readability;
- huge hero images that push the venue decision summary out of the first viewport;
- dense tables as the universal visual language;
- tiny controls or typography used only to fit more information;
- decorative motion that delays routine work;
- visually different components for the same semantic action across modules.

## Design tokens

Implementation centralizes tokens rather than scattering literal values:

- background/surface roles;
- text roles;
- semantic colors;
- spacing scale;
- typography scale;
- border radii;
- border emphasis;
- shadow/elevation levels;
- icon sizes;
- z-index layers;
- motion durations/easing;
- breakpoints;
- content max-widths;
- focus-ring style.

Exact palette/font selection is finalized during UI implementation but must:

- pass accessibility/contrast requirements;
- avoid proprietary-font dependency for correct operation;
- work consistently on phone/tablet/desktop;
- preserve semantic status distinctions;
- match the calm/warm direction rather than a generic enterprise theme.

## Surface hierarchy

Prefer a small, understandable number of surface levels:

1. application/background;
2. primary content surface;
3. elevated contextual surface such as drawer/dialog.

Do not create many barely distinguishable card/elevation styles.

Use whitespace and typography to separate ordinary sections. Borders/shadows are used only when they communicate containment, selection or elevation.

## Semantic colors

Use roles rather than module-specific ad hoc colors:

- success/confirmed;
- information;
- warning/review;
- danger/blocking/error/destructive;
- neutral/unknown;
- primary accent/action;
- favorite/personal preference accent where needed.

Rules:

- neutral surfaces dominate operational screens;
- accent guides attention rather than coloring everything;
- danger treatment is reserved for genuine danger/blocking/destruction;
- unknown is neutral, not error red;
- waiting externally is not visually equivalent to failure;
- color always has text/icon/status support when meaning matters.

## Typography

Two roles may be used:

### UI/data typography
Highly readable neutral type for navigation, forms, tables, notes, money and operational content.

### Expressive heading typography
Optional elegant display/headline role used sparingly for project title, countdown or emotionally appropriate section headings.

Rules:

- dense data never uses decorative type;
- body text remains comfortably readable on mobile;
- numerical/financial values align consistently;
- hierarchy is created with size/weight/spacing, not excessive all-caps;
- long detail text uses readable line length rather than full desktop width.

## Photography and imagery

Venue photography is important because venue selection is visual/emotional.

Use:

- consistent gallery aspect ratios;
- a controlled hero image on Venue Detail;
- reserved image dimensions to avoid layout shift;
- clear fallback when remote image is unavailable;
- original/preview quality appropriate to context.

Avoid:

- unrelated decorative stock imagery;
- giant hero images hiding operational information;
- inconsistent arbitrary crop ratios;
- decorative imagery on Tasks/Budget simply to make them feel wedding-themed.

## Iconography

- one coherent icon family/style;
- icons complement labels rather than replace unfamiliar concepts;
- status icons are consistent across modules;
- icon-only actions require accessible labels/tooltips where appropriate;
- favorite/partner cues may be subtle and warm but must not make collaboration feel competitive.

## Core components

Standardize at minimum:

- buttons: primary/secondary/tertiary/destructive/icon;
- links/external-link treatment;
- badges/status pills;
- cards;
- list rows;
- table/grid shell;
- comparison matrix shell;
- tabs/segmented controls;
- accordion/disclosure;
- modal/dialog;
- drawer/bottom sheet;
- toast/undo notification;
- alert/banner;
- text/number/money/date/select fields;
- tri/quad-state fact input;
- rating input;
- source/confidence indicator;
- avatar/member indicator;
- empty state;
- skeleton/loading placeholder;
- offline/sync indicator;
- file/media tile;
- conflict-resolution card;
- summary metric block;
- section heading/action pattern;
- filter/search toolbar;
- mobile bottom action bar where explicitly needed.

No feature invents a visually incompatible replacement for an existing generic component without documented reason.

## Button/action hierarchy

At a given decision point:

- one dominant primary action where appropriate;
- secondary actions visually quieter;
- tertiary/context actions do not compete for attention;
- destructive actions are visually separated from routine primary actions;
- icon-only controls are reserved for familiar/compact actions.

A screen with five equally strong buttons is a design defect.

## Status model

The same semantic status has the same visual treatment across screens.

Examples:

- Confirmed = success label/icon.
- Unknown = neutral + explicit `Unknown`/localized equivalent.
- Conflict = warning/review treatment + explicit label.
- Waiting externally = information/neutral waiting state, distinct from todo and error.
- Rejected venue = explicit rejected state, not disappearance.
- Pending sync = compact local/cloud state, not a fake “Saved” confirmation.

## Density modes

Density is contextual rather than globally “compact”.

### Calm/summary density
Dashboard, Venue Gallery, Venue Detail summary.

### Operational density
Tasks, Decisions, Timeline, Seating.

### Analytical density
Guest table, Venue Table, Payments, Compare.

Desktop analytical tables may be denser than mobile lists/cards. Do not force desktop-density controls onto touch layouts.

## Cards

Cards are used for meaningful objects/summaries, not as wrappers around every paragraph.

A default card should expose only the information needed to decide whether to open/act on it.

Venue cards prioritize photo, identity/status, blockers, capacity/price/access context, missing information and partner ratings rather than every criterion.

## Tables

Tables use:

- limited decision-relevant default columns;
- clear row focus/selection;
- consistent numeric alignment;
- meaningful column grouping;
- configurable secondary columns where needed;
- mobile-specific list/detail alternative.

Every database field becoming a table column is prohibited.

## Empty states

Every primary module has an intentional empty state with one useful next action.

Examples:

- no venues → `Add or import your first venue`;
- no tasks → explain that linked follow-ups will appear here;
- no budget items → add/import first item;
- no documents → explain supported associations.

Empty states may have slightly more warmth/personality than dense operational screens, but action remains immediately visible.

## Loading

Prefer local cached content immediately where available with subtle refresh/sync indication rather than blank full-screen spinners.

Use skeletons only when they stabilize a known layout.

## Motion

Motion communicates context/state rather than decorates:

Allowed examples:
- drawer/bottom-sheet transition;
- expand/collapse;
- small reorder feedback;
- undo/success feedback;
- sync-state transition.

Avoid long entrance animation or routine celebratory animation that slows planning work. Respect reduced-motion preferences.

## Destructive action hierarchy

- reversible state change: immediate + undo where safe;
- trash/archive: proportionate confirmation where needed;
- permanent purge/project deletion/destructive restore: strong confirmation + reauthentication.

## External links

External/source/map links are visually distinguishable and open without losing current drafts. Use safe external-link attributes and privacy rules.

## Print/export

Operational print outputs such as Seating/Timeline/vendor packets:

- remove navigation/action chrome;
- prioritize legibility;
- retain headings/context/version/date;
- avoid interactive-only status affordances;
- do not leak unrelated private data.

## Accessibility

All components inherit `quality/ACCESSIBILITY.md` requirements. A component is not complete if only its visual state is designed; keyboard, focus, disabled/loading/error semantics are part of the component contract.

## Visual review evidence

Major user-facing feature PRs retain synthetic-data screenshots at minimum for:

- representative desktop;
- narrow mobile;
- important empty state where applicable;
- important error/offline/conflict state where applicable;
- dense table/operational mode where applicable.

Reviewer applies `UX-REVIEW-CHECKLIST.md` and explicitly assesses:

- clarity/hierarchy;
- calmness;
- readability;
- wedding appropriateness;
- operational efficiency;
- consistency with existing components;
- mobile adaptation.

A screen that is technically correct but clearly resembles generic admin CRUD receives a MAJOR UX finding and cannot be accepted until corrected.
