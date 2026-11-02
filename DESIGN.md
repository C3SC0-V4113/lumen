# Lumen Design System

This file is the source of truth for the shared public site and CMS interface.

## Surfaces and themes

- The public site uses `data-surface="site"` and defaults to dark.
- The CMS uses `data-surface="cms"` and defaults to light.
- Each surface supports light and dark palettes through semantic shadcn tokens in
  `src/styles/global.css`.
- Persist preferences per surface. Theme initialization runs before paint and accepts only
  `light` or `dark`.
- Use semantic colors (`background`, `foreground`, `muted`, `primary`, `success`, `warning`,
  `info`, and `destructive`) instead of raw palette colors.
- All text pairs meet WCAG AA contrast. The unit suite reads the source tokens and checks each
  surface palette.

## Typography

| Role      | Typeface                      | Use                                          |
| --------- | ----------------------------- | -------------------------------------------- |
| Display   | Fraunces Variable, weight 600 | Headings with slight negative tracking       |
| Interface | Instrument Sans Variable      | Body copy and controls                       |
| Data      | JetBrains Mono, weight 500    | Code and numeric values; use tabular figures |

The fonts are self-hosted with Fontsource. Do not add Google Fonts or external font requests.

## Shape, layout, and controls

- Base radius is `0.625rem` (10px). Use Tailwind radius utilities; public pills use `rounded-full`.
- Public interactive controls use the `touch` size, with a minimum 44px target.
- Keep layouts calm and readable, with explicit loading, empty, error, and partial-data states.
- Use shadcn primitives before custom markup. Product-owned reusable compositions belong in
  `src/components/common/`; feature components belong in their feature folder.
- Use lucide icons with `currentColor` and accessible names for icon-only buttons.

## Motion and focus

- Focus is always visible: a 3px ring in the semantic `focus` color with a 2px offset.
- Use transitions for interactive state changes and name the properties being transitioned.
- Theme icon transitions use opacity, scale, and blur for 300ms with
  `cubic-bezier(0.2, 0, 0, 1)`. Reduced motion uses a short fade without scale or blur.
- Respect `prefers-reduced-motion`; motion never carries the only state cue.

## Lint rules

`pnpm run lint` enforces these rules with `@shadcn/lint`; do not disable them:

- `shadcn/no-restyle`: use a primitive variant or size for appearance; `className` is for layout.
- `shadcn/no-raw-colors`: use semantic tokens instead of raw palette classes.
- `shadcn/no-arbitrary-values`: use the Tailwind scale and theme tokens.
- `shadcn/no-inline-styles`: no inline styles or component `<style>` blocks.
- `shadcn/require-static-classes`: keep utility class names static.
- `shadcn/no-unknown-classes`: use classes known to Tailwind.

See [Architecture Decision Records](docs/adr/) for durable project constraints.
