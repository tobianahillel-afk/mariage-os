# Motion and Micro-interactions — Mariage OS

Status: **Normative V1 motion/interaction contract**

Motion should make the interface feel polished, connected and understandable. It must never be decorative noise or a requirement for understanding state.

## 1. Motion personality

Mariage OS motion is:

- soft;
- quick;
- intentional;
- spatially coherent;
- slightly editorial;
- never bouncy by default;
- reduced or removed when the user prefers reduced motion.

The goal is “motion with manners”, not a showcase reel.

## 2. Timing scale

Recommended timing tokens:

- `motion-instant`: 80ms — tiny pressed/hover feedback;
- `motion-fast`: 140ms — chips, small state changes;
- `motion-standard`: 220ms — drawers, tabs, card state;
- `motion-page`: 300ms — major route/context transition;
- `motion-celebration`: 450–600ms — rare meaningful celebratory moments.

Exact implementation may tune values slightly, but unrelated components must not invent arbitrary timings.

## 3. Easing

Use a small shared easing set:

- standard ease-out for entering/focus;
- standard ease-in for exit;
- smooth emphasized curve for page/context transitions;
- no elastic/bounce easing for routine product interactions.

## 4. Route transitions

Where browser support is adequate, use the View Transition API as progressive enhancement.

Approved behaviors:

- subtle crossfade/translate between major routes;
- selected venue card image/title can visually continue into venue detail;
- compare → detail may preserve the selected venue context;
- timeline/guest/seating route changes remain simple and stable rather than cinematic.

Fallback without View Transitions must remain fully functional.

## 5. Cards and galleries

Venue cards may use:

- image zoom approximately 1–2% on hover/focus where pointer exists;
- tiny elevation/lift;
- accent border/tint on selection;
- favorite/status changes that animate locally without moving unrelated cards.

Do not create large scale/3D tilt effects.

## 6. Tables and lists

Dynamic table/list changes should preserve spatial comprehension.

### Sort
When sort changes:

- rows move/reorder smoothly where practical;
- avoid flashing the entire table blank;
- maintain selected/focused row identity;
- preserve scroll position when safe.

### Filter
When filters change:

- removed rows fade/contract subtly;
- retained rows do not unnecessarily remount;
- result count updates immediately;
- active filters remain visually persistent.

### Inline edit
On save:

- show local saved/pending state close to the edited field/row;
- do not shift columns or row height unnecessarily;
- error returns focus/context to the affected value.

### Bulk actions
Selected rows gain a stable selection treatment and contextual action bar. The table should not reflow unpredictably when selection begins.

## 7. Drawers, sheets and modals

- desktop drawer enters from the contextually logical side;
- mobile bottom sheet enters vertically;
- background may dim subtly;
- focus moves into the surface and returns on close;
- closing animation does not delay destructive safety behavior;
- no nested animated modals unless unavoidable.

## 8. Navigation

Active domain color may transition gently as the user changes modules.

Sidebar/bottom navigation should feel stable. Do not animate the entire navigation tree on every route.

The active marker may slide/fade between items if this remains accessible and performant.

## 9. Numbers and progress

Counters/progress may animate on first meaningful reveal only when it helps comprehension.

Do not animate money continuously or count from zero on every navigation; financial numbers should feel trustworthy and stable.

## 10. Optimistic and sync states

A local edit may transition:

`editing → saved locally/pending → synchronized`

using a small icon/label change rather than dramatic toast spam.

Errors/conflicts remain visible until resolved; they do not disappear after a decorative animation.

## 11. Celebratory moments

Rare restrained celebrations are allowed for milestones such as:

- both partners finalize the selected venue;
- final seating completeness achieved;
- project reaches a major planning phase;
- final wedding timeline frozen.

The effect should be brief and tasteful. No routine completion confetti.

## 12. Images

Image loading should feel deliberate:

- fixed aspect-ratio placeholder prevents layout shift;
- low-resolution/neutral placeholder may fade into preview;
- preview → original swap must not resize the container;
- failed remote image becomes a designed placeholder without layout collapse.

## 13. Performance

Prefer `transform` and `opacity` for animation where possible. Avoid animating layout-heavy properties such as width/height when a transform-based solution exists.

Do not use `transition: all` globally.

Motion must not meaningfully delay first interaction or cause large layout shifts.

## 14. Reduced motion

`prefers-reduced-motion: reduce` is binding.

When reduced motion is requested:

- remove large route translations/zooms;
- disable image/card scale effects;
- replace motion with instantaneous state change or short opacity change where appropriate;
- preserve all semantic feedback.

No critical state, relationship or result may require seeing an animation.

## 15. Testing

Major animated interactions require:

- desktop/pointer review;
- mobile/touch review;
- reduced-motion review;
- keyboard/focus review;
- no layout-jank under realistic populated datasets.
