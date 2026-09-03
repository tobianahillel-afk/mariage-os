# Visual Identity — Mariage OS

Status: **Normative V1 visual-direction contract**

## 1. Brand idea

Mariage OS should feel like an **editorial wedding magazine merged with a calm, premium operating system**.

It must communicate at the same time:

- intimacy and emotion;
- confidence and organization;
- premium finish without luxury cliché;
- collaboration between two people, not enterprise workflow software;
- serious handling of money, contracts and guests without becoming visually cold;
- joy without visual noise.

The intended emotional response is:

> “This is beautiful enough to belong to our wedding, but structured enough that I trust it with our decisions.”

## 2. Visual personality

Use these attributes as design filters:

- warm;
- editorial;
- composed;
- tactile;
- modern;
- confident;
- colorful;
- generous;
- photographic where emotion matters;
- precise where data matters.

Avoid:

- generic AI/SaaS gradients everywhere;
- monochrome purple startup UI;
- sterile corporate dashboard language;
- pink/gold/petal clichés everywhere;
- excessive glassmorphism;
- too many identical rounded cards;
- every panel having a border/shadow;
- icon-only interfaces with unclear meaning;
- visual density that resembles an admin console.

## 3. Signature visual idea

The application uses a **warm paper-like neutral canvas** with a family of module accents, large photographic moments where useful, and controlled editorial typography.

The visual hierarchy should feel layered rather than boxed:

1. neutral page canvas;
2. elevated content surface;
3. tinted contextual surface using the current domain accent;
4. image/editorial hero when emotionally useful;
5. precise controls/data surfaces beneath.

Color therefore creates orientation, not decoration alone.

## 4. Domain identity

Each major functional area receives a stable accent family. The accent appears in navigation state, section markers, selected controls, small charts, empty-state illustrations and contextual surfaces.

It must **not** replace semantic success/warning/error colors.

Recommended domain families:

- Venues → olive/sage;
- Vendors → terracotta/apricot;
- Guests → blue/sky;
- Seating → teal/mint;
- Budget → ochre/gold;
- Tasks → teal-deep/aqua;
- Decisions → plum/rose;
- Planning → indigo/lavender;
- Wedding Timeline → coral/rose;
- Documents → slate/stone;
- Inbox/Search → berry/soft rose;
- Settings/System → neutral graphite.

The current domain accent may lightly tint page chrome or contextual areas, but the main canvas remains neutral so screens still belong to the same application.

## 5. Photography

Photography is a first-class design material only when it improves recognition, comparison or emotion.

High-visuality areas:

- venue gallery;
- venue detail hero;
- visit/photo review;
- selected/finalist venue moments;
- optional dashboard wedding hero/countdown.

Low-visuality areas:

- budget;
- payments;
- task management;
- security/settings;
- imports;
- diagnostics.

Rules:

- preserve original photo bytes when archived;
- generate separate previews/thumbnails;
- use consistent editorial crops such as 4:3 and 16:10;
- avoid arbitrary image aspect-ratio changes between cards;
- do not stretch images;
- use `object-fit: cover` for card crops and provide full-view access;
- remote marketing images are secondary to project data and may fail gracefully;
- cards with missing images use designed tinted placeholders, not broken-image icons.

## 6. Typography direction

Use a two-role system:

### Editorial display role
Used sparingly for:

- dashboard wedding countdown/title;
- major venue heading;
- occasional section intro;
- public landing page if present.

It may use an elegant serif or humanist display face available under a suitable web license.

### Product/UI role
Used for:

- navigation;
- forms;
- tables;
- guest names;
- budget values;
- status labels;
- controls.

It must be highly readable and numerically clear.

Do not use more than two primary type families in V1.

## 7. Shape language

Use a mixed radius system rather than making every element equally rounded.

Suggested roles:

- compact controls/chips: small radius;
- standard cards/inputs: medium radius;
- photographic/editorial feature cards: larger radius;
- pills only where the semantics truly benefit from a pill.

This variation prevents the generic “everything is one floating rounded card” look.

## 8. Iconography

Icons should be consistent in stroke/optical size and serve recognition.

- one primary icon family;
- no mixture of unrelated icon styles;
- domain icons may inherit domain accent;
- critical states pair icon + text;
- decorative wedding symbols are rare and restrained.

## 9. Decorative language

Permitted in moderation:

- thin editorial dividers;
- subtle grain/paper texture on public/hero surfaces only if performance-safe;
- restrained multi-color gradient highlights;
- soft tinted blocks;
- image collage composition for venue/editorial contexts;
- small celebratory moments after meaningful milestones.

Not permitted as default decoration:

- sparkles everywhere;
- animated hearts on routine actions;
- confetti after every completed task;
- heavy blur backgrounds;
- full-screen gradient meshes on data-heavy screens.

## 10. “Wow” moments

The wow factor should come from composition and continuity rather than visual excess.

Approved examples:

- dashboard opens on a beautiful countdown/phase composition with current wedding context;
- venue gallery uses strong photography and elegant status/compatibility overlays;
- opening a venue can transition the selected card image into the venue hero;
- comparison view smoothly reorders and highlights differences;
- final venue selection can have one restrained celebratory transition;
- wedding-day timeline can use elegant chronology and location accents;
- color subtly follows the current domain throughout navigation and controls.

## 11. Commercial UX test

For every major screen ask:

1. Would this look credible in a polished paid consumer product?
2. Does the screen communicate wedding context without becoming kitsch?
3. Is there a clear focal point within two seconds?
4. Does the screen feel designed rather than merely styled?
5. Does it still work when populated with real dense data?
6. Would the couple be comfortable showing this screen to each other on a phone?

If the answer is no, technical completeness does not make the UI accepted.
