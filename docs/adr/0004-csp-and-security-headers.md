# 0004. Hash-based CSP and shared security headers

- Status: Accepted
- Date: 2026-11-02

## Context

The public application runs on Workers and serves generated static assets directly through
Cloudflare. A policy applied only in Astro middleware would miss those assets.

## Decision

Use Astro's SHA-256 CSP generation, same-origin script/style sources, a checked hash for the inline
theme bootstrap, and hash-only `style-src-attr` with explicit origin checks. Astro does not include
`is:inline` scripts in its generated hashes, so a unit test calculates that hash from the source.
Add `frame-ancestors`
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

Browser evidence showed `style-src-attr` blocking Base UI's visually hidden language input and
`style-src-elem` blocking Base UI's `.base-ui-disable-scrollbar` stylesheet when the language popup
opens. Their exact SHA-256 hashes are allowlisted. Unit tests calculate both Base UI hashes from the
installed package; E2E hashes the rendered theme script and language input and checks that the active
policy allows them. Source or dependency changes therefore require CSP review. The attribute policy
uses `'unsafe-hashes'` plus one hash, not `'unsafe-inline'`, so other style attributes remain
blocked. Browser E2E verifies the language popup, home pages, and visible toast emit no CSP
violations.
