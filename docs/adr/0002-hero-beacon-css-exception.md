# 0002. Allow a scoped CSS exception for the hero beacon

- Status: Accepted
- Date: 2026-11-01

## Context

The public hero uses a beacon with conic masks, 3D transforms, SVG filters, and keyframe motion.
These effects do not map cleanly to static Tailwind utilities. The project otherwise uses Tailwind
utilities and semantic design tokens.

## Decision

Allow the beacon's specialized keyframes and utilities in `src/styles/global.css`. Keep the
exception limited to the hero beacon, use theme tokens where possible, and respect reduced motion.
Do not add component style blocks or a second stylesheet.

## Consequences

- The effect can be implemented without inline styles or a new styling system.
- `src/styles/global.css` remains the only source for the exception and its tokens.
- Any future use must stay tied to the beacon and be reviewed for performance and accessibility.
