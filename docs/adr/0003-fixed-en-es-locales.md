# 0003. Keep the supported locales fixed to English and Spanish

- Status: Accepted
- Date: 2026-11-01

## Context

The product is bilingual. Letting administrators add languages would change routing, translation
workflows, and the content model, which are outside the initial product scope.

## Decision

Support English at the unprefixed URL and Spanish under `/es`. Configure Astro i18n with `en` as
the default locale, `es` as the only additional locale, and no default-locale prefix.

## Consequences

- Language switching maps equivalent routes between the unprefixed and `/es` paths.
- Translation dictionaries and UI language controls remain small and statically typed.
- Adding another locale requires a deliberate architecture change and new decision record.
