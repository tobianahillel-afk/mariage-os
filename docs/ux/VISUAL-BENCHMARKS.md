# Visual / UX Benchmarks — Mariage OS

Status: **Research-backed design input, not a copying specification**

This document records external patterns worth learning from. Mariage OS must synthesize them into its own identity rather than reproduce competitor layouts.

## 1. Zola

Sources:

- https://www.zola.com/
- https://www.zola.com/wedding-planning/app
- https://www.zola.com/wedding-planning/guests
- https://www.zola.com/expert-advice/best-wedding-planning-apps

Useful patterns:

- personalized wedding context/countdown makes the tool emotionally specific;
- photography is prominent in discovery/planning contexts;
- large functional areas are represented as understandable planning destinations rather than database tables;
- guest/budget/vendor tools are presented as parts of one wedding rather than isolated admin modules;
- mobile planning is treated as first-class.

Do not copy:

- registry/e-commerce emphasis;
- marketing-heavy surfaces inside the private operating workspace;
- any paid upsell behavior.

Mariage OS takeaway:

> Retain the feeling that the application belongs to *this couple and this wedding*, especially on Dashboard and Venues.

## 2. The Knot

Sources:

- https://www.theknot.com/product-releases
- https://www.theknot.com/content/top-apps-need-for-wedding-planning
- https://www.theknot.com/content/wedding-planner-faqs

Useful patterns:

- top-level wedding metrics are visible immediately;
- planning is broken into understandable stages/goals rather than showing every checklist item at once;
- mobile home gives quick entry into high-value domains;
- current phase and progress help answer “what now?”.

Do not copy:

- recommendation/marketplace density;
- generic engagement mechanics that do not support the couple’s own source-of-truth workflow.

Mariage OS takeaway:

> Dashboard should combine wedding context, a small number of meaningful metrics and the next useful actions without becoming a KPI wall.

## 3. Joy

Sources:

- https://withjoy.com/help/en/articles/8309436-joy-101
- https://withjoy.com/help/en/articles/15388661-using-joy-as-a-wedding-coordinator

Useful patterns:

- “one place where everything connects” is a strong mental model;
- users are guided toward a sensible path from a blank dashboard;
- the couple remains the center of the event even when collaborators exist;
- features can be skipped when unnecessary.

Mariage OS takeaway:

> The product should never make the couple understand the database before they can plan their wedding.

## 4. Airtable Interface Designer

Sources:

- https://support.airtable.com/articles/5415824889-airtable-interface-layout-dashboard
- https://support.airtable.com/articles/8961492433-airtable-interface-layout-overview
- https://www.airtable.com/guides/collaborate/interface-designer-dashboards
- https://support.airtable.com/articles/4384405105-airtable-interface-layout-record-review

Useful patterns:

- separate overview/dashboard/list/detail/review layouts for different user jobs;
- high-level dashboard can drill into underlying detail;
- summary cards are useful when image + state + a few values are the right abstraction;
- dynamic filters should not permanently alter other users’ views;
- avoid endless-scroll dashboards containing every possible element.

Do not copy:

- visible database-builder/admin complexity;
- generic record-centric vocabulary.

Mariage OS takeaway:

> Data can be dense underneath while the interface remains purpose-specific above it.

## 5. Linear

Source:

- https://linear.app/changelog/2026-03-12-ui-refresh

Useful patterns:

- consistent headers/navigation/view controls improve orientation;
- dimmer navigation allows primary work area to dominate;
- icon consistency matters at product scale;
- calm interfaces can still be information-rich.

Do not copy:

- near-monochrome developer-tool aesthetic;
- extreme density on consumer/wedding-facing screens.

Mariage OS takeaway:

> Keep the shell calm and consistent, then allow richer colors/photography inside the current wedding domain.

## 6. Modern web motion/design-system references

Sources:

- https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
- https://web.dev/learn/css/view-transitions-spas
- https://web.dev/learn/css/transitions/

Useful patterns:

- transitions can preserve context and reduce cognitive load;
- motion should use progressive enhancement;
- `transform`/`opacity` are preferable to repeated layout-heavy animation;
- reduced-motion preferences are mandatory.

Mariage OS takeaway:

> “Wow” should come from continuity, image composition and micro-interaction polish rather than excessive animation.

## 7. Synthesis matrix

| Need | Primary inspiration | Mariage OS interpretation |
|---|---|---|
| emotional wedding context | Zola / The Knot | personalized countdown, photography, warm identity |
| one connected place | Joy | coherent global navigation and project mental model |
| complex data without raw DB feel | Airtable Interfaces | job-specific screens + drill-down |
| calm professional shell | Linear | stable navigation/header/component grammar |
| polished transitions | Web platform guidance | contextual transitions + reduced-motion fallback |

## 8. Originality rule

External products are references for principles, not visual templates.

Mariage OS must not intentionally duplicate:

- competitor proprietary illustrations;
- exact page composition;
- iconography;
- wording;
- brand colors;
- screenshots/assets.

The intended result is visibly its own product: **wedding editorial warmth + an operating system’s clarity**.
