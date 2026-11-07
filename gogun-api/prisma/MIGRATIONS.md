# Database migrations

`prisma/migrations` is the source of truth for schema changes. Run `npm run db:migrate` for a new database or after adding a migration. Do not use `prisma db push` for deployment; it does not record migration history. `schema.sql` resets tables and contains demo data, so it is not a deployment migration.

## Existing databases

The baseline migration represents the original `schema.prisma`. The next migration adds trip themes, member permissions, trip templates, comments, and quests. It keeps existing data and tolerates columns or tables previously added by the standalone `upgrade-*.sql` scripts.

Before recording migration history on an existing database, back it up and compare its shape with the current schema:

```sh
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Exit code `0` means the database already matches the current schema. Record both migrations as applied, then check status:

```sh
npx prisma migrate resolve --applied 20261104000000_baseline
npx prisma migrate resolve --applied 20261104000100_trip_features
npm run db:status
```

If the database still lacks the new columns or tables, first verify it contains the original baseline tables, then record only the baseline and apply the additive migration:

```sh
npx prisma migrate resolve --applied 20261104000000_baseline
npm run db:migrate
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

Review any nonempty diff before resolving or deploying. These commands use the `DATABASE_URL` in `prisma.config.ts`; select the intended database before running them. Fresh empty databases only need `npm run db:migrate`.
