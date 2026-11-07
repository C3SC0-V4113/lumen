# Lumen

## Platform setup

The site targets Cloudflare Workers. Local development and D1 migrations use `lumen-local`; E2E
preview listens on port `4174`. The `lumen-staging` Worker, D1 and KV IDs are configured in
`wrangler.jsonc` and staging deploys run only in CI. Its R2 bucket remains to be provisioned before
the first deploy. Production Worker configuration is deferred to phase 15. Astro validates the
server-side `SITE_URL` and `SITE_ENV` values.

Database and platform scripts: `pnpm run db:generate`, `pnpm run db:migrate:local`,
`pnpm run db:seed:local`, `pnpm run db:seed:sql`, `pnpm run db:migrate:staging` (CI only),
`pnpm run cf:typegen`, and `pnpm run cf:typecheck`. Local content setup from an empty database is
`pnpm run db:migrate:local && pnpm run db:seed:local`; the seed command can be repeated safely.
`db:seed:sql` generates `scripts/seed.sql` from the canonical `src/db/seed/` function. To prepare a
staging seed artifact, run `pnpm run db:seed:sql`, then have the staging operator execute
`wrangler d1 execute lumen-staging --remote --env staging --file scripts/seed.sql` after applying
migrations. Do not run that remote command from a local development session.
`pnpm run check` verifies the generated Cloudflare types are current. The shared audit schema and
generated migrations live in `src/db/` and `migrations/`. Deploy and incident steps are in
[`docs/runbooks/deploy.md`](docs/runbooks/deploy.md).

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
