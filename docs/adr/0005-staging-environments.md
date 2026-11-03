# 0005. Deploy staging to workers.dev through CI

- Status: Accepted
- Date: 2026-11-02

## Context

The project has no custom domain and uses Cloudflare Workers for staging and production. Resource
creation and production configuration are managed separately from this implementation phase.

## Decision

Use a named `staging` Wrangler environment and deploy it from CI after quality and E2E jobs succeed.
The deploy workflow owns those prerequisite jobs with a `needs` dependency, avoiding races between
separate workflow-run events. Apply remote D1 migrations before publishing the Worker. Keep
production configuration out of this phase.

## Consequences

The staging environment uses `workers.dev`, D1, KV sessions, and R2 media. The account and D1/KV
IDs are configured in Wrangler; R2 bucket provisioning remains external. A GitHub `staging`
environment holds the Cloudflare credentials. Deploys cannot overlap, and an in-progress deploy is
not cancelled by a later push.
