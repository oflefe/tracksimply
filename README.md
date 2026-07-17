# Semantic Calorie Tracker MVP

A deterministic calorie logging monorepo: NestJS + Prisma + PostgreSQL API, shared Zod contracts, and a minimal Next.js client. It uses no LLM, image recognition, authentication, or background synchronization.

## Run locally

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm db:studio
pnpm dev
```

API: `http://localhost:3001`, web: `http://localhost:3000`. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` for verification.

## Architecture

`Input -> NLP candidate extraction -> deterministic parser -> local food resolver -> provider fallback -> portion resolver -> pure nutrition calculator -> preview -> transactional confirmation -> meal log snapshots`.

Conversational text is first passed through `compromise` to extract noun-phrase ingredient candidates. This allows input such as `I had two fried eggs with sourdough, some feta and a small latte` to reach the existing pipeline as four separate food mentions. The deterministic parser remains responsible for quantities, units, basic number words, fractions, quantifiers, and preparation modifiers.

The NLP step is deliberately not treated as food-domain NER. It only proposes candidate spans. Every candidate still goes through the food resolver and its confidence thresholds, so uncertain or invalid matches surface as `NEEDS_REVIEW` instead of being silently accepted.

Resolution checks aliases and local foods before FoodData Central. Provider responses are mapped at the adapter boundary and cached on demand. Explicit portions precede user rules, exact/system rules, category defaults, and provider servings. Assumptions and uncertainty are returned in preview diagnostics.

`FoodLogItem` stores calculated macros and a source snapshot, so later catalogue changes do not change historical logs. Confirmation revalidates food IDs, recalculates server-side, and writes the event, meal log, items, totals, and optional idempotency record in one transaction.

## API

`POST /api/v1/food-logs/preview`, `POST/PATCH /api/v1/food-logs`, `GET/DELETE /api/v1/food-logs/:id`, CRUD `/api/v1/meals`, basic recipe/template CRUD, and SQL-backed suggestions are implemented. Health endpoints are `/health/live` and `/health/ready`.

Example preview:

```json
{
  "userId": "demo-user-id",
  "mealType": "BREAKFAST",
  "occurredAt": "2026-07-15T08:30:00.000Z",
  "input": "2 fried eggs\n100g sourdough bread\nsome feta cheese"
}
```

The response contains one item per mention, resolution confidence, candidates, grams, quantity source, assumptions, warnings, and aggregate `calories`, `protein`, `carbohydrates`, `fat`, and `fibre`.

## Configuration and limitations

See `.env.example`. `FDC_API_KEY` is optional for seeded examples and required for provider fallback. Seed values are documented demo fixtures, not a nutrition authority. Authentication, recipe/template logging workflows, richer correction UX, and production deployment hardening remain intentionally deferred from this first vertical slice.

Noun-phrase extraction improves conversational input coverage but does not guarantee correct ingredient boundaries. Coordinated dish names, mixed dishes, and unusual wording can still require user review or future food-domain model support. The food resolver remains the final acceptance gate.

### FoodData Central API key

Request an API key from [USDA FoodData Central](https://fdc.nal.usda.gov/api-key-signup.html), then add it to your local `.env` file:

```env
FDC_API_KEY=your_api_key
```

Restart the API after changing `.env`. The key enables food-provider fallback when a food is not found in the local catalogue.
