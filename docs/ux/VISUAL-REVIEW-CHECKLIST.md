# Visual Design Review Checklist — Mariage OS

Status: **Normative visual acceptance gate**

A screen can be functionally correct and still fail this checklist.

## 1. Identity

- [ ] The screen looks like Mariage OS, not generic admin SaaS.
- [ ] Warm neutral foundation is visible.
- [ ] Current domain accent is present but controlled.
- [ ] Semantic colors remain semantically correct.
- [ ] Wedding context appears where relevant without cliché.
- [ ] The visual composition feels intentionally designed rather than generated from default components.

## 2. Color

- [ ] Colors come from `COLOR-SYSTEM.md` tokens.
- [ ] Domain color and status color are not confused.
- [ ] More than one hue may appear when useful, but one screen still has a clear dominant hierarchy.
- [ ] Soft tinted surfaces are used more often than large saturated fills.
- [ ] Filled controls use validated accessible foreground/background contrast.
- [ ] Disabled/unknown states remain readable.
- [ ] Charts use stable curated category colors.
- [ ] Color is never the only state indicator.

## 3. Typography

- [ ] Heading/body roles follow the two-role typography direction.
- [ ] Display typography is used sparingly.
- [ ] Dense data uses highly readable UI typography.
- [ ] Numeric/financial values scan cleanly.
- [ ] Hierarchy is evident through size/weight/space, not ten different colors.

## 4. Layout / surfaces

- [ ] Not every group is a rounded bordered card.
- [ ] Important surfaces have stronger hierarchy than secondary surfaces.
- [ ] White/neutral space is intentional.
- [ ] Long narrative content has readable line length.
- [ ] Analytical workspaces use width when it helps.
- [ ] The page has one dominant visual focal point or clearly ordered focal sequence.

## 5. Photography

Where photography is relevant:

- [ ] Images have consistent intentional aspect ratios.
- [ ] Card/hero crops do not distort the original.
- [ ] Missing/failed image state is designed.
- [ ] Large images actually aid recognition/emotion/decision.
- [ ] Gallery does not eagerly load all originals.
- [ ] Remote-image privacy rules are respected.

Where photography is not relevant:

- [ ] Decorative stock imagery has not been added merely to make the page prettier.

## 6. Components

- [ ] Button hierarchy is obvious.
- [ ] Only one action dominates unless a true balanced decision exists.
- [ ] Chips/pills are not overused as decoration.
- [ ] Icons come from one optical family.
- [ ] Radius/shadow choices match component role.
- [ ] Reusable component exists before creating near-duplicate visual variant.

## 7. Motion

- [ ] Motion follows `MOTION-INTERACTION.md`.
- [ ] Routine interactions do not bounce or overshoot.
- [ ] Sort/filter/reorder changes preserve spatial comprehension.
- [ ] Route transition preserves context rather than showing off.
- [ ] Reduced-motion path is reviewed.
- [ ] Animations do not create layout jank.

## 8. “Wow” without noise

Reviewer must identify what makes the screen feel premium.

Acceptable answers include:

- exceptional venue photography composition;
- strong information hierarchy;
- elegant colored contextual surface;
- seamless card→detail transition;
- excellent compare highlighting;
- restrained wedding countdown composition;
- polished timeline/seating workspace;
- refined typography/spacing.

Unacceptable answers:

- “there is a big gradient”;
- “everything has shadows”;
- “we added more colors”;
- “there are lots of animations”.

## 9. Multi-module coherence

Review the feature beside at least one neighboring module.

- [ ] It has enough domain identity to orient the user.
- [ ] It still shares global shell/typography/surface grammar.
- [ ] Switching modules feels like moving through one product, not separate mini-apps.

## 10. Commercial-quality test

Ask explicitly:

1. Does this look like a product someone could reasonably pay for?
2. Is the first impression polished enough for a wedding product?
3. Does real data still look good, not only a sparse demo?
4. Would a non-technical partner know what to do next?
5. Is there any visible “AI-generated dashboard” cliché?
6. Does the interface feel warm without sacrificing trust?

Any clear “no” produces a visual finding.

## 11. Evidence

Major visual PRs provide synthetic-data evidence for:

- desktop populated state;
- mobile populated state;
- empty state;
- at least one dense/realistic state;
- domain navigation context;
- reduced-motion interaction when motion is material.

Visual review result is recorded with PASS / PASS_WITH_MINOR / FAIL.

A MAJOR visual finding blocks Feature `ACCEPTED` and integration checkpoint PASS.
