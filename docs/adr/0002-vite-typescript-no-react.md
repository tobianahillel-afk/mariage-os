# ADR 0002 — Vite + TypeScript without React for V1

- Status: Accepted
- Date: 2026-09-02

## Context

Mariage OS needs a responsive static PWA deployable on Cloudflare Pages. It contains substantial domain logic, import/export, offline synchronization and tests, but only two primary users and no requirement for a large component ecosystem.

The product should remain understandable and small rather than becoming a framework-maintenance project.

## Decision

Use:

- Vite for development/build;
- TypeScript strict mode;
- standards-based HTML/CSS/DOM components/modules;
- no React/Next.js in V1.

The codebase still uses disciplined component/view/service/repository modules; “no React” does not mean unstructured JavaScript.

## Rationale

Advantages:

- small runtime/bundle;
- static deployment is trivial;
- fewer dependencies/supply-chain surface;
- direct access to browser/PWA/IndexedDB APIs;
- TypeScript protects the complex domain model;
- no server rendering/runtime required;
- easier long-term personal-project maintenance.

## Consequences

We must create/maintain a small internal component convention and avoid ad hoc DOM manipulation. Accessibility/focus/state patterns require deliberate reusable primitives.

If V1 implementation reveals UI state complexity that substantially outweighs this simplicity, a future ADR may reconsider a framework. That decision must include migration cost, bundle/security impact and evidence from the actual codebase.
