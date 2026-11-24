# 0002. Allow scoped CSS in shared global styles

- Status: Accepted
- Date: 2026-11-01

## Context

The public hero uses a beacon with 3D transforms and keyframe motion. Tailwind utilities express most of its styling, while the keyframes, star pattern, beam shape and mask, elliptical wave crest, and animation play state need named definitions. A shared visible-focus indicator also
needs to apply consistently to generated UI primitives. Base UI toast components own their semantic container styles in `src/components/ui/toast.tsx`. The project otherwise uses Tailwind utilities and semantic design tokens.

## Decision

Keep the beacon's keyframes, named utilities for its star pattern, beam silhouette and fade, elliptical wave crest and animation play state, and a root pause variant in `src/styles/global.css`. Use Tailwind utilities and theme tokens in markup, and respect reduced motion. Define the shared focus-visible outline in that stylesheet because it must cross component boundaries. Do not add component
style blocks or a second stylesheet.

## Consequences

- The effect can be implemented without inline styles or a new styling system.
- `src/styles/global.css` remains the only source for the exception and its tokens.
- The focus indicator remains a shared cross-component rule; component-specific visual
  treatments continue to use Tailwind utilities.
- The beacon effect must stay tied to the hero and be reviewed for performance and accessibility.
