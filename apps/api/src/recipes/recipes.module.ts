import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PrismaRecipesRepository } from './prisma-recipes.repository.js';
import { RecipesController } from './recipes.controller.js';
import { RecipesService } from './recipes.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [RecipesController],
  providers: [PrismaRecipesRepository, RecipesService],
})
export class RecipesModule {}
