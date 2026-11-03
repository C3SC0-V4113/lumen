# Staging deploy runbook

## Credentials and resources

The `staging` GitHub environment requires:

- `CLOUDFLARE_ACCOUNT_ID` for the account already selected in `wrangler.jsonc`.
- `CLOUDFLARE_API_TOKEN` scoped to that account with Workers Scripts: Edit, D1: Edit, and Workers
  R2 Storage: Edit. Do not grant zone, DNS, user, or account-wide administration permissions.

The workflow is triggered by pushes to `main`. It runs quality and Chromium E2E jobs first. The
deploy job waits for both, builds the staging Worker, applies D1 migrations, deploys, and checks the
staging URL and primary response headers. Deploys are serialized and an active deploy is never
cancelled by a newer push.

The R2 binding is configured as `lumen-staging-media`; create that bucket in the account before the
first staging deploy. Resource provisioning is not part of the workflow.

## Roll back a Worker version

Find the previous healthy Worker version in the Cloudflare dashboard, then run from an authorized
operator environment:

```sh
pnpm exec wrangler rollback --env staging <version-id>
```

Worker rollback does not reverse D1 schema changes. Keep migrations backward compatible with the
currently deployed Worker and use a forward migration for schema correction.

## Recover from a failed D1 migration

1. Stop further staging deploys while diagnosing the failed migration.
2. Inspect the GitHub Actions log and current migration state in the Cloudflare dashboard.
3. If the migration did not apply, correct it before its first successful application, or add a new
   forward migration if any statements already took effect.
4. Verify the correction against local D1 with `pnpm run db:migrate:local` and the integration test.
5. Merge the correction through the normal quality/E2E gates. CI applies pending migrations before
   deploying the Worker.

Do not manually mark an unapplied migration as applied or edit a migration already recorded as
successful in staging. If state is ambiguous, preserve the database and prepare a reviewed forward
migration.
