# 0006. Serve public content from validated published snapshots

- Status: Accepted
- Date: 2026-11-05

## Context

Content editing, review, and publication need to coexist without exposing drafts or partially
updated translations to public pages. Public reads also need a predictable response when stored JSON
is malformed or a translation has fallen behind its English source.

## Decision

Public services read `published_snapshot` only. Each `data` value is JSON validated with its
domain's Zod schema before publication and again before a public read. Invalid stored data is treated
as absent; logs include the entity type, ID, and locale, but never snapshot contents.

An `es` snapshot is stale when its `source_version` is lower than the published English snapshot's
`version`. Settings choose how stale and missing translations are served:

- `keep` serves a stale Spanish snapshot; a missing translation uses English with `fallback: true`.
- `source` uses English with `fallback: true` for stale or missing Spanish.
- `hide` omits stale and missing Spanish content.

English reads never fall back to another locale. Team order and home-section visibility are part of
the `team_list` and `home` published snapshots, so reordering or hiding content takes publication.
Rich text is a strict Tiptap JSON allowlist: `doc`, `paragraph`, `text`, and `bold`, `italic`, or
`link` marks. Link targets are limited to HTTP, HTTPS, and mailto URLs.

## Consequences

- Public routes cannot expose draft tables by accidentally querying them.
- Publishing a list snapshot keeps ordering changes atomic from the public reader's perspective.
- Snapshot schemas are shared between publication validation and read services.
- Translation policy is evaluated per item, with a `fallback` indicator for callers.
- Invalid snapshots are omitted and can be repaired through the CMS without exposing raw data.
