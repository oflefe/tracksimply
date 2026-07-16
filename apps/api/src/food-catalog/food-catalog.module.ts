import { Module } from '@nestjs/common';
import type { FoodProvider } from '../food-providers/provider.js';
import { FOOD_PROVIDER } from '../food-providers/provider.js';
import { FoodProvidersModule } from '../food-providers/food-providers.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { loadEnvironment } from '../config/env.js';
import { PrismaFoodRepository } from './prisma-food.repository.js';
import { FoodResolver } from './resolver.js';

const environment = loadEnvironment(process.env);

@Module({
  imports: [DatabaseModule, FoodProvidersModule],
  providers: [
    PrismaFoodRepository,
    {
      provide: FoodResolver,
      useFactory: (repository: PrismaFoodRepository, provider: FoodProvider) =>
        new FoodResolver(
          repository,
          provider,
          environment.AUTO_ACCEPT_CONFIDENCE,
          environment.REVIEW_CONFIDENCE,
        ),
      inject: [PrismaFoodRepository, FOOD_PROVIDER],
    },
  ],
  exports: [FoodResolver],
})
export class FoodCatalogModule {}
