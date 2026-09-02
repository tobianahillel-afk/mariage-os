# Design System Contract

Status: **Normative UX consistency contract**

The design system should make Mariage OS feel calm, elegant and wedding-appropriate while keeping operational screens clear and dense enough for decision work.

## Principles

- elegant, not ornamental;
- calm, not dashboard-noisy;
- warm visual identity with professional data readability;
- summary-first information hierarchy;
- consistent status meaning everywhere;
- mobile-first interaction for visits, desktop-enhanced analysis for tables/comparison.

## Tokens

Implementation centralizes design tokens rather than scattering literal values:

- colors;
- spacing scale;
- typography scale;
- border radii;
- shadow levels;
- z-index layers;
- motion durations;
- breakpoints;
- focus-ring style.

Concrete palette/font selection is finalized during UI implementation, but must pass accessibility/contrast requirements and avoid reliance on bundled proprietary font files.

## Semantic colors

Use semantic roles rather than module-specific ad hoc colors:

- success/confirmed;
- information;
- warning/review;
- danger/blocking/error;
- neutral/unknown;
- accent/favorite.

Color is always paired with text/icon/status label when meaning matters.

## Typography

Two roles may be used:

- expressive/elegant headings sparingly;
- highly readable UI/body/data typography.

Tables, forms and numeric financial data prioritize readability over decorative typography.

## Core components

Standardize at minimum:

- buttons: primary/secondary/tertiary/destructive/icon;
- links/external-link treatment;
- badges/status pills;
- cards;
- list rows;
- table/grid shell;
- tabs;
- accordion/disclosure;
- modal/dialog;
- drawer/bottom sheet;
- toast/undo notification;
- alert/banner;
- text/number/money/date/select fields;
- tri/quad-state fact input;
- rating input;
- source/confidence chip;
- avatar/member indicator;
- empty state;
- skeleton/loading placeholder;
- offline/sync indicator;
- file/media tile;
- conflict-resolution card.

No feature should invent a visually incompatible replacement for an existing generic component without reason.

## Status model

The same semantic status has the same visual treatment across screens.

Examples:

- Confirmed = success label/icon.
- Unknown = neutral + explicit `Unknown`.
- Conflict = warning/error-like explicit `Conflict`, not an empty field.
- Waiting externally = distinct from todo.
- Rejected venue = explicit rejected state, not disappearance.

## Density modes

Desktop analytical tables may be denser than mobile cards.

Do not force desktop-density controls onto touch layouts. Mobile uses progressive disclosure and bottom sheets/drawers where appropriate.

## Empty states

Every primary module has an intentional empty state with one useful next action.

Examples:

- no venues → `Add or import your first venue`;
- no tasks → explain that linked follow-ups will appear here;
- no budget items → `Add first budget item` or import;
- no documents → explain supported document association.

Empty states do not imply failure.

## Loading

Prefer local cached content immediately where available, with subtle sync/loading update rather than blank full-screen spinners.

Use skeletons only when structure is known and they improve perceived stability.

## Destructive action hierarchy

- reversible status change: execute + undo toast when safe;
- delete to trash: confirmation only when context/risk warrants;
- permanent purge/project deletion: strong confirmation + reauthentication.

## External links

External/source/map links are visually distinguishable and open without losing current drafts. Use safe external-link attributes.

## Print

Selected operational screens may define print styles in later lots. At minimum, print output should exclude navigation/action chrome when a feature explicitly supports printing/export.

## Accessibility

All components inherit `quality/ACCESSIBILITY.md` requirements. A component is not complete if only its visual state is designed; keyboard, focus, disabled/loading/error semantics are part of the component contract.
