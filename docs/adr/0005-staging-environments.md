# 0005. Deploy staging to workers.dev through CI

- Status: Accepted
- Date: 2026-11-02

## Context

The project has no custom domain and uses Cloudflare Workers for staging and production. Resource
creation and production configuration are managed separately from this implementation phase.

## Decision

Use a named `staging` Wrangler environment and deploy it from CI after reusable Quality and Playwright
workflows succeed. The deploy workflow calls them as dependent jobs, so it avoids duplicated job
definitions and cannot race separate workflow-run events. Apply remote D1 migrations before
publishing the Worker. Keep production configuration out of this phase. The local top-level
environment has `workers_dev: false`; staging explicitly enables it. All deploy commands must use
`--env staging`.

## Consequences

The staging environment is `https://lumen-staging.cescovalledev.workers.dev` and uses D1, KV sessions,
and R2 media. The account and D1/KV IDs are configured in Wrangler; R2 bucket provisioning remains
external. A GitHub `staging`
environment holds the Cloudflare credentials. Deploys cannot overlap, and an in-progress deploy is
not cancelled by a later push.

`vars.SITE_URL` and `vars.SITE_ENV` are the single source of truth for build-time Astro environment
values. Astro's public server environment values are compiled into the Worker bundle, and the
Cloudflare adapter resolves the selected Wrangler environment during `astro build`. Changing these
vars requires rebuilding before deployment.
