# Design System Contract

Status: **Normative UX consistency and visual-quality contract**

Mariage OS must feel calm, elegant, warm, colorful and wedding-appropriate while keeping operational screens clear enough for real decision work. It must not look like a generic database/admin interface merely because the underlying data model is rich.

Read this document together with:

- `VISUAL-SYSTEM.md` — visual entry point/precedence;
- `VISUAL-IDENTITY.md` — brand personality;
- `COLOR-SYSTEM.md` — frozen color architecture and domain accents;
- `MOTION-INTERACTION.md` — motion/micro-interactions;
- `SCREEN-BLUEPRINTS.md` — major screen composition;
- `UX-REVIEW-CHECKLIST.md` and `VISUAL-REVIEW-CHECKLIST.md` — acceptance gates.

The **color architecture is now frozen for V1**. Exact font family selection remains an implementation-time visual decision subject to this contract and accessibility/licensing requirements.

## Principles

- elegant, not ornamental;
- calm, not dashboard-noisy;
- warm visual identity with professional data readability;
- multi-color but role-controlled;
- premium enough to feel intentionally designed, without decorative excess;
- summary-first information hierarchy;
- consistent status meaning everywhere;
- whitespace/typography/grouping before borders and boxes;
- mobile-first interaction for visits and quick actions;
- desktop-enhanced analysis for tables/comparison;
- images where they support emotional/visual decisions, not mechanically on every screen;
- operational efficiency remains strong even when the interface is visually refined.

## Visual anti-patterns

Avoid:

- generic admin CRUD appearance;
- one purple/blue accent used across the entire app;
- random unique colors without stable roles;
- every section inside an equally weighted bordered card;
- every status using a different arbitrary color;
- dozens of dense widgets competing on Dashboard;
- decorative wedding styling on financial/task screens that reduces readability;
- huge hero images that push the venue decision summary out of the first viewport;
- dense tables as the universal visual language;
- tiny controls or typography used only to fit more information;
- decorative motion that delays routine work;
- visually different components for the same semantic action across modules;
- generic AI-dashboard gradients/glassmorphism as the primary visual identity.

## Design tokens

Implementation centralizes tokens rather than scattering literal values:

- warm background/surface roles;
- brand colors;
- domain accent colors;
- semantic status colors;
- text roles;
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

`COLOR-SYSTEM.md` controls color values/roles. Implementations may generate additional tonal variants from the frozen families only when the semantic/domain relationship remains obvious and contrast is verified.

Font selection must:

- pass accessibility/readability requirements;
- avoid proprietary-font dependency for correct operation;
- work consistently on phone/tablet/desktop;
- preserve the editorial-display vs UI/data role split;
- match the warm/editorial direction rather than a generic enterprise theme.

## Surface hierarchy

Prefer a small understandable number of surface levels:

1. warm application canvas;
2. primary content surface;
3. soft domain-tinted contextual surface;
4. elevated contextual surface such as drawer/dialog;
5. visual/editorial image surface where the domain benefits.

Do not create many barely distinguishable card/elevation styles.

Use whitespace and typography to separate ordinary sections. Borders/shadows communicate containment, selection or elevation rather than decorate every object.

## Color model

The application has four color layers:

1. neutral foundation;
2. global brand family;
3. stable domain accent families;
4. global semantic state colors.

Domain colors create orientation between modules; semantic colors communicate state. They are never interchangeable.

Examples:

- venue olive does not mean success;
- guest blue does not mean information state unless the semantic context separately says so;
- destructive actions use danger red even inside an olive venue page;
- conflict uses the conflict semantic treatment regardless of module.

Soft tinted surfaces should carry most domain color. Large saturated blocks are reserved for deliberate focal elements.

## Typography

Two roles are supported:

### UI/data typography
Highly readable neutral type for navigation, forms, tables, notes, money and operational content.

### Expressive/editorial heading typography
Optional elegant display/headline role used sparingly for project title, countdown, venue/editorial hero or emotionally appropriate headings.

Rules:

- maximum two primary type families in V1;
- dense data never uses decorative type;
- body text remains comfortably readable on mobile;
- numerical/financial values align consistently;
- hierarchy is created with size/weight/spacing, not excessive all-caps;
- long detail text uses readable line length rather than full desktop width.

## Photography and imagery

Venue photography is important because venue selection is visual/emotional.

Use:

- consistent editorial gallery aspect ratios;
- controlled hero image on Venue Detail;
- reserved image dimensions to avoid layout shift;
- designed tinted fallback when remote image is unavailable;
- appropriate thumbnail/preview/original level;
- card→detail continuity where motion support permits.

Avoid:

- unrelated decorative stock imagery;
- giant hero images hiding operational information;
- inconsistent arbitrary crop ratios;
- decorative imagery on Tasks/Budget merely to make them wedding-themed.

See `SEO-METADATA-IMAGES.md` for delivery/privacy/performance behavior.

## Iconography

- one coherent icon family/style;
- icons complement labels rather than replace unfamiliar concepts;
- status icons are consistent across modules;
- icon-only actions require accessible labels/tooltips where appropriate;
- domain icons may use their accent family;
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

Global actions normally use the brand family. Domain-local positive actions may use the current domain family where `COLOR-SYSTEM.md` allows it. Destructive actions always use semantic danger.

A screen with five equally strong buttons is a design defect.

## Status model

The same semantic status has the same visual treatment across screens.

Examples:

- Confirmed = success label/icon.
- Unknown = neutral + explicit `Unknown`/localized equivalent.
- Conflict = conflict/review treatment + explicit label.
- Waiting externally = information/neutral waiting state, distinct from todo and error.
- Rejected venue = explicit rejected state, not disappearance.
- Pending sync = compact local/cloud state, not a fake `Saved` confirmation.

## Density modes

Density is contextual rather than globally compact.

### Calm/summary density
Dashboard, Venue Gallery, Venue Detail summary.

### Operational density
Tasks, Decisions, Timeline, Seating.

### Analytical density
Guest table, Venue Table, Payments, Compare.

Desktop analytical tables may be denser than mobile lists/cards. Do not force desktop-density controls onto touch layouts.

## Cards

Cards are used for meaningful objects/summaries, not as wrappers around every paragraph.

A default card exposes only the information needed to decide whether to open/act on it.

Venue cards prioritize photo, identity/status, blockers, capacity/price/access context, missing information and partner ratings rather than every criterion.

Domain cards may use soft domain surfaces/accent details, but the page should not become a patchwork of saturated tiles.

## Tables

Tables use:

- limited decision-relevant default columns;
- clear row focus/selection;
- consistent numeric alignment;
- meaningful column grouping;
- configurable secondary columns where needed;
- mobile-specific list/detail alternative;
- stable motion during sort/filter where practical.

Every database field becoming a table column is prohibited.

## Empty states

Every primary module has an intentional empty state with one useful next action.

Examples:

- no venues → `Add or import your first venue`;
- no tasks → explain that linked follow-ups will appear here;
- no budget items → add/import first item;
- no documents → explain supported associations.

Empty states may use more illustration/color warmth than dense operational screens, but action remains immediately visible.

## Loading

Prefer local cached content immediately where available with subtle refresh/sync indication rather than blank full-screen spinners.

Use skeletons only when they stabilize a known layout.

Image placeholders preserve aspect ratio and visual balance.

## Motion

`MOTION-INTERACTION.md` controls motion behavior.

Motion communicates context/state rather than decorates. View Transitions may enhance card→detail/route continuity when supported, but functionality cannot depend on them.

Routine interfaces avoid bounce/overshoot. Reduced-motion preferences are binding.

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

Contrast is validated on the actual token pairing. Do not infer accessibility from the color name or subjective darkness.

## Visual review evidence

Major user-facing feature PRs retain synthetic-data evidence at minimum for:

- representative desktop;
- narrow mobile;
- important empty state where applicable;
- important error/offline/conflict state where applicable;
- dense table/operational mode where applicable;
- realistic domain color context;
- reduced-motion variant when significant motion exists.

Reviewers apply both `UX-REVIEW-CHECKLIST.md` and `VISUAL-REVIEW-CHECKLIST.md`.

A screen that is technically correct but clearly resembles generic admin CRUD or violates the frozen multi-color visual thesis receives a MAJOR UX/visual finding and cannot be accepted until corrected.
