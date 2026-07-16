import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { FoodCatalogModule } from '../food-catalog/food-catalog.module.js';
import { PortionsModule } from '../portions/portions.module.js';
import { FoodLogsController } from './food-logs.controller.js';
import { FoodLogsService } from './food-logs.service.js';
import { FoodPipelineService } from './food-pipeline.service.js';
import { PrismaFoodLogsRepository } from './prisma-food-logs.repository.js';

@Module({
  imports: [DatabaseModule, FoodCatalogModule, PortionsModule],
  controllers: [FoodLogsController],
  providers: [PrismaFoodLogsRepository, FoodPipelineService, FoodLogsService],
})
export class FoodLogsModule {}
