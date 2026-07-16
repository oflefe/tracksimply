import { Module } from '@nestjs/common';
import { loadEnvironment } from '../config/env.js';
import { FoodDataCentralProvider } from './fdc.provider.js';
import { FOOD_PROVIDER } from './provider.js';

const environment = loadEnvironment(process.env);

@Module({
  providers: [
    {
      provide: FOOD_PROVIDER,
      useFactory: () =>
        new FoodDataCentralProvider(
          environment.FDC_API_KEY,
          environment.FOOD_PROVIDER_TIMEOUT_MS,
          environment.FOOD_PROVIDER_MAX_RETRIES,
        ),
    },
  ],
  exports: [FOOD_PROVIDER],
})
export class FoodProvidersModule {}
