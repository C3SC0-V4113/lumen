# Database

Lumen stores application data in Cloudflare D1 and defines its schema with Drizzle. `src/db/schema.ts` is the source of truth for tables, columns, and foreign keys. Update this document in the same pull request as any schema change.

## Team

```mermaid
erDiagram
    team_member ||--o{ team_member_translation : has
    team_member ||--o{ team_link : has
    team_link ||--o{ team_link_translation : has
    team_member ||--o{ team_credit : has
    team_credit ||--o{ team_credit_translation : has
    game ||--o{ team_credit : credited_on
    media_asset o|--o{ team_member : portrait_set_null

    team_member {
        text id PK
        text slug UK
        text discipline "discipline"
        text city
        text portrait_media_id FK
        integer sort_order
        text status "publicationState"
        integer created_at
        integer updated_at
    }
    team_member_translation {
        text member_id PK, FK
        text locale PK "locale"
        text role
        text bio
        text made_in
        text badge
        integer source_version
    }
    team_link {
        text id PK
        text member_id FK
        integer sort_order
        text kind "linkKind"
        text url
        integer year
    }
    team_link_translation {
        text link_id PK, FK
        text locale PK "locale"
        text label
    }
    team_credit {
        text id PK
        text member_id FK
        text game_id FK
        integer sort_order
    }
    team_credit_translation {
        text credit_id PK, FK
        text locale PK "locale"
        text work
        text credit
    }
    game
    media_asset
```

## Games and roadmap

```mermaid
erDiagram
    game ||--o{ game_translation : has
    game ||--o{ roadmap_milestone : has
    roadmap_milestone ||--o{ roadmap_milestone_translation : has
    media_asset o|--o{ game : cover_set_null

    game {
        text id PK
        text slug UK
        text status "publicationState"
        text cover_media_id FK
        integer sort_order
    }
    game_translation {
        text game_id PK, FK
        text locale PK "locale"
        text title
        text tagline
        text description
        text release_label
        text platforms_label
    }
    roadmap_milestone {
        text id PK
        text game_id FK
        integer sort_order
        text state "milestoneState"
    }
    roadmap_milestone_translation {
        text milestone_id PK, FK
        text locale PK "locale"
        text title
        text date_label
    }
    media_asset
```

## Jobs

```mermaid
erDiagram
    job ||--o{ job_translation : has

    job {
        text id PK
        text slug UK
        text discipline "discipline"
        text status "jobState"
        text apply_url
        integer applicants_count
        integer closes_at
        integer closed_at
        integer filled_at
        integer created_at
        integer updated_at
    }
    job_translation {
        text job_id PK, FK
        text locale PK "locale"
        text title
        text location_label
        text summary
    }
```

## Pages and home sections

```mermaid
erDiagram
    page ||--o{ home_section : contains
    home_section ||--o{ home_section_translation : has
    home_section ||--o{ home_section_item : contains
    home_section_item ||--o{ home_section_item_translation : has

    page {
        text id PK
        text slug UK
        text kind "pageKind"
    }
    home_section {
        text id PK
        text page_id FK
        text kind "sectionKind"
        integer sort_order
        integer hidden
        text animation "animation"
        text bg_light "lightBackground"
        text fg_light "textColor"
        text bg_dark "darkBackground"
        text fg_dark "textColor"
    }
    home_section_translation {
        text section_id PK, FK
        text locale PK "locale"
        text heading
        text body
    }
    home_section_item {
        text id PK
        text section_id FK
        integer sort_order
    }
    home_section_item_translation {
        text item_id PK, FK
        text locale PK "locale"
        text title
        text body
    }
```

## Media

```mermaid
erDiagram
    media_asset ||--o{ media_asset_translation : has
    media_asset ||--o{ media_asset_tag : tagged
    media_tag ||--o{ media_asset_tag : labels

    media_asset {
        text id PK
        text r2_key UK
        text kind "mediaKind"
        text mime
        integer bytes
        integer width
        integer height
        text sha256
        integer created_at
    }
    media_asset_translation {
        text asset_id PK, FK
        text locale PK "locale"
        text alt
    }
    media_tag {
        text id PK
        text slug UK
    }
    media_asset_tag {
        text asset_id PK, FK
        text tag_id PK, FK
    }
```

## Content workflow

```mermaid
erDiagram
    content_revision {
        text id PK
        text entity_type "entityType"
        text entity_id
        text locale "locale"
        integer version
        text data
        text actor_id
        text note
        text state "revisionState"
        integer created_at
    }
    published_snapshot {
        text entity_type PK "entityType"
        text entity_id PK
        text locale PK "locale"
        integer version
        integer source_version
        text data
        integer published_at
    }
    preview_link {
        text id PK
        text token_hash UK
        text entity_type "entityType"
        text entity_id
        integer expires_at
        integer revoked_at
    }
```

## System

```mermaid
erDiagram
    media_asset ||--o| press_kit_asset : included_in

    settings {
        integer id PK
        text studio_name
        text stale_policy "stalePolicy"
        integer flag_stale
        integer require_review
        text approvers "approverPolicy"
        text press_email
        text contact_email
        integer updated_at
    }
    press_kit {
        integer id PK
        integer embargo_until
        text zip_r2_key
        integer zip_bytes
        integer built_at
        text status "pressKitState"
    }
    press_kit_asset {
        text media_id PK, FK
        integer sort_order
    }
    newsletter_subscriber {
        text id PK
        text email UK
        text locale "locale"
        text consent_version
        integer created_at
    }
    audit_log {
        text id PK
        text actor_id
        text action
        text entity_type
        text entity_id
        integer created_at
    }
    media_asset
```

## Notes

- The draft tables hold editable and review content; `published_snapshot` holds the published version. Public reads use snapshots only.
- `published_snapshot` and `content_revision` are polymorphic (`entity_type` plus `entity_id`) and have no foreign key. Allowed `entity_type` values are `team_member`, `team_list`, `game`, `job`, and `home`.
- `audit_log.actor_id` intentionally has no foreign key; see [ADR 0006](adr/0006-public-reads-use-published-snapshots.md).
- `settings` and `press_kit` are single-row tables constrained to `id = 1`.
- Enum columns are enforced with SQL `CHECK` constraints generated from `src/db/enums.ts`.
- Every foreign key cascades on delete except the nullable `game.cover_media_id` and `team_member.portrait_media_id` references, which use `SET NULL`.
- Better Auth tables arrive in phase 6 and are not in this schema yet.
