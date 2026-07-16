import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { loadEnvironment } from './config/env.js';
import { FoodLogsModule } from './food-logs/food-logs.module.js';
import { HealthModule } from './health/health.module.js';
import { MealsModule } from './meals/meals.module.js';
import { RecipesModule } from './recipes/recipes.module.js';
import { SuggestionsModule } from './suggestions/suggestions.module.js';
import { TemplatesModule } from './templates/templates.module.js';

const environment = loadEnvironment(process.env);

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: environment.LOG_LEVEL,
        genReqId: (request) =>
          request.headers['x-request-id']?.toString() ?? crypto.randomUUID(),
        customProps: (request) => ({
          userId: request.headers['x-user-id'],
        }),
      },
    }),
    HealthModule,
    MealsModule,
    FoodLogsModule,
    RecipesModule,
    TemplatesModule,
    SuggestionsModule,
  ],
})
export class AppModule {}
