# Repository Guidelines

## Repository Structure

- `apps/api/src/app.module.ts` is the composition root. Keep it limited to logging configuration and feature-module imports.
- Each API domain owns one directory and one Nest module:
  - `health/`: liveness and readiness.
  - `meals/`: meal CRUD.
  - `food-logs/`: preview, confirmation, updates, deletion, and pipeline orchestration.
  - `recipes/`: recipe endpoints and persistence.
  - `templates/`: template endpoints and persistence.
  - `suggestions/`: food suggestions.
  - `food-catalog/`: food resolution and catalog persistence.
  - `portions/`: portion resolution and rules.
  - `food-providers/`: external food-provider implementations and injection token.
  - `database/`: `PrismaService` and `DatabaseModule`.
- Do not recreate umbrella directories such as `support/` for unrelated domains.
- Keep controllers, services, repositories, schemas, tests, and the module declaration inside their owning domain directory.

## Nest Modules

- Generate new Nest modules with the local CLI: `pnpm --filter @calorie-tracker/api exec nest g module <domain> --skip-import`.
- Every endpoint domain must have exactly one feature module.
- Feature modules own their controllers, services, and repositories.
- Import `DatabaseModule` when a domain needs Prisma.
- Export only providers that are required by another module.
- Consume cross-domain providers through module imports and exports; never register another domain's provider directly.
- `FoodProvidersModule` exports `FOOD_PROVIDER`.
- `FoodCatalogModule` exports `FoodResolver`.
- `PortionsModule` exports `PortionResolver`.
- `FoodLogsModule` imports `DatabaseModule`, `FoodCatalogModule`, and `PortionsModule`.
- Do not add controllers or domain providers directly to `AppModule`.

## API Architecture

- Controllers handle transport concerns only: request extraction, validation pipes, response shaping, and error propagation.
- Business rules, orchestration, calculations, and not-found decisions belong in services.
- Database queries, mutations, and transactions belong in repositories.
- Controllers must not inject `PrismaService`.
- Services must not inject `PrismaService` or call Prisma APIs.
- Prisma-backed classes must use the `Prisma*.repository.ts` naming pattern.
- Keep functions and methods single-purpose with explicit names.
- Abstract side effects behind repositories or providers.
- Surface failures with `ApplicationError`; do not hide unexpected failures.

## Verification

- Maintain 100% test coverage for changed behavior.
- Update documentation after changing behavior
- Write test descriptions in `GIVEN ... WHEN ... THEN ...` format.
- Test module metadata when changing imports, exports, providers, controllers, or factories.
- Run format, lint, typecheck, tests, and build before completion.
