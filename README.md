# Lumen

Lumen is the foundation for an independent game studio website and private content management
system. This phase establishes shared visual tokens, accessible shadcn components, English and
Spanish localization, and persistent theme preferences. Public pages use Astro server rendering;
small React islands handle the language and theme controls.

## Development

Requirements: Node.js 22.23.4 or newer and pnpm 12.

```sh
pnpm install
pnpm run dev
```

See [DESIGN.md](DESIGN.md) for surfaces, tokens, typography, and interface rules. Durable product
constraints are recorded in [docs/adr/](docs/adr/).

<!-- BEGIN:purrfold-managed -->

## Quality

```bash
pnpm run lint
pnpm run typecheck
pnpm run format:check
pnpm run test
pnpm run doctor
pnpm run check
```

## Tooling

- Astro project with TypeScript, Tailwind, and React islands.
- shadcn UI initialized through the shadcn CLI.
- ESLint flat config with strict Astro, React, import ordering, and Prettier integration.
- `@shadcn/lint` enforcing the design system rules in `DESIGN.md`.
- React Doctor and React Scan.
- Vitest and React Testing Library.
- Playwright E2E testing.
- Conventional commit linting.

## shadcn MCP

purrfold attempted shadcn MCP setup during scaffold.

Manual setup commands for this package manager:

```bash
pnpm dlx shadcn@latest mcp init --client claude
pnpm dlx shadcn@latest mcp init --client codex
pnpm dlx shadcn@latest mcp init --client opencode
```

Codex may require user-level configuration in `~/.codex/config.toml`:

```toml
[mcp_servers.shadcn]
command = "pnpm"
args = ["dlx", "shadcn@latest", "mcp"]
```

## shadcn Presets

purrfold forwards additional shadcn CLI arguments, including official presets:

```bash
npx purrfold@latest my-app --shadcn-args --preset b3REw8vwo --yes
npx purrfold@latest my-app --shadcn-args --preset b1sSLwZVp --yes
npx purrfold@latest my-app --shadcn-args --preset b2qMI9ufY --yes
npx purrfold@latest my-app --shadcn-args --preset b5eH0WVTX --yes
```

## Agent Docs

- `AGENTS.md`: agent workflow and quality gates.
- `DESIGN.md`: generic UI/UX guardrails.
- `.agents/skills`: agent skills downloaded by `skills.sh` from their published sources. If any are missing, rerun `sh skills.sh`.
- `CLAUDE.md`: Claude Code pointer to `AGENTS.md`.

<!-- END:purrfold-managed -->
