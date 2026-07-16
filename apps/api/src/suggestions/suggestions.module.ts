import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PrismaSuggestionsRepository } from './prisma-suggestions.repository.js';
import { SuggestionsController } from './suggestions.controller.js';
import { SuggestionsService } from './suggestions.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [SuggestionsController],
  providers: [PrismaSuggestionsRepository, SuggestionsService],
})
export class SuggestionsModule {}
