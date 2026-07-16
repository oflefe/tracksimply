import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { MealsController } from './meals.controller.js';
import { MealsService } from './meals.service.js';
import { PrismaMealsRepository } from './prisma-meals.repository.js';

@Module({
  imports: [DatabaseModule],
  controllers: [MealsController],
  providers: [PrismaMealsRepository, MealsService],
})
export class MealsModule {}
