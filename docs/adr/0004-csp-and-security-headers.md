# 0004. Hash-based CSP and shared security headers

- Status: Accepted
- Date: 2026-11-02

## Context

The public application runs on Workers and serves generated static assets directly through
Cloudflare. A policy applied only in Astro middleware would miss those assets.

## Decision

Use Astro's SHA-256 CSP generation, same-origin script/style sources, explicitly hash the inline
theme bootstrap, and use hash-only `style-src-attr` with explicit origin checks. Add `frame-ancestors`
as a response header because meta policies cannot enforce it. Apply the standard browser hardening
headers in middleware and `public/_headers` for static files. Keep the
Cloudflare Images binding disabled; image transformation remains local to avoid requiring the paid
Images product. Configure Astro's session binding as `SESSION_KV` for the future auth phase.

## Consequences

The middleware and static header list must stay aligned. Astro emits CSP meta policies only for
built pages; Vite dev mode does not enforce CSP. React Scan's development script is therefore not
restricted by this build policy and is not included in production bundles.

Markdown syntax highlighting is disabled because this site has no code-fenced Markdown content.
Astro's default Shiki highlighter adds inline styles, which do not fit the hash-based policy.

Browser evidence showed `script-src-elem` blocking the inline theme bootstrap in `src/layouts/main.astro`,
`style-src-attr` blocking Base UI's visually hidden language input, and `style-src-elem` blocking
Base UI's `.base-ui-disable-scrollbar` stylesheet when the language popup opens. Their exact SHA-256
hashes are allowlisted. The attribute policy uses `'unsafe-hashes'` plus one hash, not
`'unsafe-inline'`, so other style attributes remain blocked. Browser E2E verifies the language popup,
home pages, and visible toast emit no CSP violations. Any new inline code or style must be separately
justified and hashed.
