# 0002. Allow scoped CSS in shared global styles

- Status: Accepted
- Date: 2026-11-01

## Context

The public hero uses a beacon with conic masks, 3D transforms, SVG filters, and keyframe motion.
These effects do not map cleanly to static Tailwind utilities. A shared visible-focus indicator also
needs to apply consistently to generated UI primitives, and Sonner needs semantic toast tokens on its
container. The project otherwise uses Tailwind utilities and semantic design tokens.

## Decision

Keep the beacon's specialized keyframes in `src/styles/global.css`, use theme tokens where possible,
and respect reduced motion. Define the shared focus-visible outline and Sonner's semantic toast
properties in that stylesheet because they must cross component boundaries. Do not add component
style blocks or a second stylesheet.

## Consequences

- The effect can be implemented without inline styles or a new styling system.
- `src/styles/global.css` remains the only source for the exception and its tokens.
- The focus indicator and toaster tokens remain shared cross-component rules; component-specific visual
  treatments continue to use Tailwind utilities.
- The beacon effect must stay tied to the hero and be reviewed for performance and accessibility.
