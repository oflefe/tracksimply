import { MODULE_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it, vi } from 'vitest';

function metadata<T>(target: object, key: string): T {
  return Reflect.getMetadata(key, target) as T;
}

describe('application modules', () => {
  it('GIVEN feature modules WHEN metadata is inspected THEN each domain owns its dependencies', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

    const { AppModule } = await import('./app.module.js');
    const { DatabaseModule } = await import('./database/database.module.js');
    const { PrismaService } = await import('./database/prisma.service.js');
    const { FoodCatalogModule } =
      await import('./food-catalog/food-catalog.module.js');
    const { PrismaFoodRepository } =
      await import('./food-catalog/prisma-food.repository.js');
    const { FoodResolver } = await import('./food-catalog/resolver.js');
    const { FoodLogsModule } = await import('./food-logs/food-logs.module.js');
    const { FoodLogsController } =
      await import('./food-logs/food-logs.controller.js');
    const { FoodLogsService } =
      await import('./food-logs/food-logs.service.js');
    const { FoodPipelineService } =
      await import('./food-logs/food-pipeline.service.js');
    const { PrismaFoodLogsRepository } =
      await import('./food-logs/prisma-food-logs.repository.js');
    const { FoodProvidersModule } =
      await import('./food-providers/food-providers.module.js');
    const { FOOD_PROVIDER } = await import('./food-providers/provider.js');
    const { HealthModule } = await import('./health/health.module.js');
    const { HealthController } = await import('./health/health.controller.js');
    const { HealthService } = await import('./health/health.service.js');
    const { PrismaHealthRepository } =
      await import('./health/prisma-health.repository.js');
    const { MealsModule } = await import('./meals/meals.module.js');
    const { MealsController } = await import('./meals/meals.controller.js');
    const { MealsService } = await import('./meals/meals.service.js');
    const { PrismaMealsRepository } =
      await import('./meals/prisma-meals.repository.js');
    const { PortionsModule } = await import('./portions/portions.module.js');
    const { PrismaPortionRepository } =
      await import('./portions/prisma-portion.repository.js');
    const { PortionResolver } = await import('./portions/resolver.js');
    const { RecipesModule } = await import('./recipes/recipes.module.js');
    const { RecipesController } =
      await import('./recipes/recipes.controller.js');
    const { RecipesService } = await import('./recipes/recipes.service.js');
    const { PrismaRecipesRepository } =
      await import('./recipes/prisma-recipes.repository.js');
    const { SuggestionsModule } =
      await import('./suggestions/suggestions.module.js');
    const { SuggestionsController } =
      await import('./suggestions/suggestions.controller.js');
    const { SuggestionsService } =
      await import('./suggestions/suggestions.service.js');
    const { PrismaSuggestionsRepository } =
      await import('./suggestions/prisma-suggestions.repository.js');
    const { TemplatesModule } = await import('./templates/templates.module.js');
    const { TemplatesController } =
      await import('./templates/templates.controller.js');
    const { TemplatesService } =
      await import('./templates/templates.service.js');
    const { PrismaTemplatesRepository } =
      await import('./templates/prisma-templates.repository.js');

    const appImports = metadata<unknown[]>(AppModule, MODULE_METADATA.IMPORTS);
    expect(appImports).toEqual(
      expect.arrayContaining([
        HealthModule,
        MealsModule,
        FoodLogsModule,
        RecipesModule,
        TemplatesModule,
        SuggestionsModule,
      ]),
    );
    expect(metadata(AppModule, MODULE_METADATA.CONTROLLERS)).toBeUndefined();
    expect(metadata(AppModule, MODULE_METADATA.PROVIDERS)).toBeUndefined();

    expect(metadata(DatabaseModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaService,
    ]);
    expect(metadata(DatabaseModule, MODULE_METADATA.EXPORTS)).toEqual([
      PrismaService,
    ]);

    expect(metadata(FoodProvidersModule, MODULE_METADATA.EXPORTS)).toEqual([
      FOOD_PROVIDER,
    ]);
    expect(metadata(FoodCatalogModule, MODULE_METADATA.IMPORTS)).toEqual([
      DatabaseModule,
      FoodProvidersModule,
    ]);
    expect(metadata(FoodCatalogModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaFoodRepository,
      expect.objectContaining({
        provide: FoodResolver,
      }),
    ]);
    expect(metadata(FoodCatalogModule, MODULE_METADATA.EXPORTS)).toEqual([
      FoodResolver,
    ]);
    expect(metadata(PortionsModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaPortionRepository,
      expect.objectContaining({
        provide: PortionResolver,
      }),
    ]);
    expect(metadata(PortionsModule, MODULE_METADATA.EXPORTS)).toEqual([
      PortionResolver,
    ]);
    expect(metadata(FoodLogsModule, MODULE_METADATA.CONTROLLERS)).toEqual([
      FoodLogsController,
    ]);
    expect(metadata(FoodLogsModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaFoodLogsRepository,
      FoodPipelineService,
      FoodLogsService,
    ]);
    expect(metadata(HealthModule, MODULE_METADATA.CONTROLLERS)).toEqual([
      HealthController,
    ]);
    expect(metadata(HealthModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaHealthRepository,
      HealthService,
    ]);
    expect(metadata(MealsModule, MODULE_METADATA.CONTROLLERS)).toEqual([
      MealsController,
    ]);
    expect(metadata(MealsModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaMealsRepository,
      MealsService,
    ]);
    expect(metadata(RecipesModule, MODULE_METADATA.CONTROLLERS)).toEqual([
      RecipesController,
    ]);
    expect(metadata(RecipesModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaRecipesRepository,
      RecipesService,
    ]);
    expect(metadata(TemplatesModule, MODULE_METADATA.CONTROLLERS)).toEqual([
      TemplatesController,
    ]);
    expect(metadata(TemplatesModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaTemplatesRepository,
      TemplatesService,
    ]);
    expect(metadata(SuggestionsModule, MODULE_METADATA.CONTROLLERS)).toEqual([
      SuggestionsController,
    ]);
    expect(metadata(SuggestionsModule, MODULE_METADATA.PROVIDERS)).toEqual([
      PrismaSuggestionsRepository,
      SuggestionsService,
    ]);

    for (const ModuleClass of [
      AppModule,
      DatabaseModule,
      FoodProvidersModule,
      FoodCatalogModule,
      PortionsModule,
      FoodLogsModule,
      HealthModule,
      MealsModule,
      RecipesModule,
      TemplatesModule,
      SuggestionsModule,
    ]) {
      expect(new ModuleClass()).toBeInstanceOf(ModuleClass);
    }
  });

  it('GIVEN module factories WHEN invoked THEN configured providers are created', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');

    const { AppModule } = await import('./app.module.js');
    const { FoodCatalogModule } =
      await import('./food-catalog/food-catalog.module.js');
    const { FoodProvidersModule } =
      await import('./food-providers/food-providers.module.js');
    const { PortionsModule } = await import('./portions/portions.module.js');

    const loggerModule = metadata<unknown[]>(
      AppModule,
      MODULE_METADATA.IMPORTS,
    )[0] as { providers: unknown[] };
    const loggerOptions = loggerModule.providers.find(
      (provider) =>
        typeof provider === 'object' &&
        provider !== null &&
        'useValue' in provider,
    ) as {
      useValue: {
        pinoHttp: {
          genReqId: (request: {
            headers: Record<string, string | undefined>;
          }) => string;
          customProps: (request: {
            headers: Record<string, string | undefined>;
          }) => Record<string, unknown>;
        };
      };
    };
    const pinoHttp = loggerOptions.useValue.pinoHttp;
    expect(
      pinoHttp.genReqId({ headers: { 'x-request-id': 'request-1' } }),
    ).toBe('request-1');
    expect(pinoHttp.genReqId({ headers: {} })).toEqual(expect.any(String));
    expect(
      pinoHttp.customProps({ headers: { 'x-user-id': 'user-1' } }),
    ).toEqual({ userId: 'user-1' });

    const foodProviderFactory = metadata<Array<{ useFactory?: () => unknown }>>(
      FoodProvidersModule,
      MODULE_METADATA.PROVIDERS,
    )[0];
    expect(foodProviderFactory.useFactory?.()).toBeDefined();

    const foodResolverFactory = metadata<
      Array<{ useFactory?: (...dependencies: never[]) => unknown }>
    >(FoodCatalogModule, MODULE_METADATA.PROVIDERS)[1];
    expect(
      foodResolverFactory.useFactory?.({} as never, {} as never),
    ).toBeDefined();

    const portionResolverFactory = metadata<
      Array<{ useFactory?: (...dependencies: never[]) => unknown }>
    >(PortionsModule, MODULE_METADATA.PROVIDERS)[1];
    expect(portionResolverFactory.useFactory?.({} as never)).toBeDefined();
  });
});
