# 0001. Deploy only to workers.dev

- Status: Accepted
- Date: 2026-11-01

## Context

The project has no custom domain and will use Cloudflare's `workers.dev` host for staging and
production. Several platform capabilities depend on zone ownership or domain verification.

## Decision

Use `workers.dev` for the full project lifecycle. Do not depend on outgoing email, the Cache API,
or zone-level features such as WAF, rate limiting rules, and cache rules. Invitations and password
resets use one-time links copied by an administrator. Any throttling is enforced in the Worker.

## Consequences

- The product has no email delivery or email-based confirmation flow.
- Public content is read from D1 snapshots, with versioned KV caching as an optional future path.
- Security controls that would otherwise live in zone configuration must run in the Worker.
- The app stays deployable without owning or verifying a domain.
